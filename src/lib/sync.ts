import { useLiveQuery } from 'dexie-react-hooks'
import type { Table } from 'dexie'
import { db } from './db'

/**
 * Sincronización opcional con la cuenta. El dispositivo sigue siendo la fuente principal:
 * se comparan huellas de cada registro local contra lo último sincronizado, se suben los
 * cambios (y borrados) y se aplican los del servidor que no choquen con cambios locales.
 * Conflictos: gana la última escritura por registro; en el primer enlace gana el servidor.
 */
type Kind = 'profile' | 'routine' | 'session' | 'body'
type Change = { kind: Kind; id: string; data: any; deleted: boolean }
const TABLES: Record<Kind, () => Table<any, string>> = { profile: () => db.profile, routine: () => db.routines, session: () => db.sessions, body: () => db.body }
const KINDS = Object.keys(TABLES) as Kind[]

function fingerprint(s: string) { // cyrb53
  let a = 0xdeadbeef, b = 0x41c6ce57
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 2654435761); b = Math.imul(b ^ c, 1597334677) }
  a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909); b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909)
  return (4294967296 * (2097151 & b) + (a >>> 0)).toString(36) + ':' + s.length
}

export class ApiError extends Error { constructor(public status: number, message: string) { super(message) } }
async function api(path: string, body?: unknown) {
  let res: Response
  try { res = await fetch('/api/' + path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: body === undefined ? {} : { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }) }
  catch { throw new ApiError(0, 'Sin conexión. Tus datos siguen guardados en este dispositivo.') }
  let data: any = null
  try { data = await res.json() } catch { /* respuesta sin JSON */ }
  if (!res.ok) throw new ApiError(res.status, data?.error ?? 'El servicio de cuentas no está disponible en este momento.')
  return data
}

const kvGet = async <T,>(key: string) => (await db.kv.get(key))?.value as T | undefined
const kvSet = (key: string, value: unknown) => db.kv.put({ key, value })
export interface Account { email: string; lastSync: number | null }
export const useAccount = () => useLiveQuery(async () => (await kvGet<Account>('account')) ?? null, [], undefined)

async function localSnapshot() {
  const out = new Map<string, { kind: Kind; id: string; data: any; h: string }>()
  for (const kind of KINDS) for (const data of await TABLES[kind]().toArray()) out.set(`${kind}:${data.id}`, { kind, id: data.id, data, h: fingerprint(JSON.stringify(data)) })
  return out
}

async function round(pushLocal: boolean) {
  const since = (await kvGet<number>('cursor')) ?? 0
  const local = await localSnapshot()
  const synced = new Map((await db.synced.toArray()).map((s) => [s.key, s.h]))
  const outgoing: Change[] = []
  if (pushLocal) {
    for (const [key, r] of local) if (synced.get(key) !== r.h) outgoing.push({ kind: r.kind, id: r.id, data: r.data, deleted: false })
    for (const key of synced.keys()) if (!local.has(key)) { const i = key.indexOf(':'); outgoing.push({ kind: key.slice(0, i) as Kind, id: key.slice(i + 1), data: null, deleted: true }) }
  }
  const dirty = new Set(outgoing.map((c) => `${c.kind}:${c.id}`))
  const res: { changes: Change[]; cursor: number; more: boolean } = await api('sync', { since, changes: outgoing.slice(0, 500) })
  const sent = outgoing.slice(0, 500)
  await db.transaction('rw', [db.profile, db.routines, db.sessions, db.body, db.synced, db.kv], async () => {
    for (const c of res.changes) {
      const key = `${c.kind}:${c.id}`
      if (dirty.has(key) || !TABLES[c.kind]) continue // el cambio local, más reciente, ya se envió
      if (c.deleted) { await TABLES[c.kind]().delete(c.id); await db.synced.delete(key) }
      else { await TABLES[c.kind]().put(c.data); await db.synced.put({ key, h: fingerprint(JSON.stringify(c.data)) }) }
    }
    for (const c of sent) { const key = `${c.kind}:${c.id}`; if (c.deleted) await db.synced.delete(key); else await db.synced.put({ key, h: local.get(key)!.h }) }
    await kvSet('cursor', res.cursor)
  })
  return res.more || outgoing.length > 500
}

let running: Promise<void> | null = null
/** Sincroniza ahora. Devuelve la misma promesa si ya hay una sincronización en curso. */
export function syncNow(): Promise<void> {
  running ??= (async () => {
    const acct = await kvGet<Account>('account')
    if (!acct) return
    try {
      // Primer enlace de este dispositivo: primero se baja todo (gana el servidor), luego se sube lo que solo existe aquí.
      if ((await kvGet<number>('cursor')) === undefined) { for (let i = 0; i < 20 && (await round(false)); i++); }
      for (let i = 0; i < 20 && (await round(true)); i++);
      await kvSet('account', { ...acct, lastSync: Date.now() })
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await forgetAccount() // la sesión venció: se conserva todo local
      throw e
    }
  })().finally(() => { running = null })
  return running
}

async function forgetAccount() { await db.transaction('rw', db.synced, db.kv, async () => { await db.synced.clear(); await db.kv.clear() }) }

export async function signIn(mode: 'login' | 'register', email: string, password: string) {
  const r = await api(mode, { email, password })
  await forgetAccount()
  await kvSet('account', { email: r.email, lastSync: null })
  await syncNow()
}
export async function signOut() { try { await syncNow() } catch { /* se cierra igual */ } try { await api('logout', {}) } finally { await forgetAccount() } }
export async function deleteAccount(password: string) { await api('account/delete', { password }); await forgetAccount() }

/** Sincroniza al abrir, al volver la conexión, al ocultar la app y cada 5 minutos, sin interrumpir al usuario. */
export function startAutoSync() {
  const go = () => { if (navigator.onLine) syncNow().catch(() => {}) }
  go()
  const vis = () => document.visibilityState === 'hidden' && go()
  window.addEventListener('online', go); document.addEventListener('visibilitychange', vis)
  const t = setInterval(go, 5 * 60_000)
  return () => { window.removeEventListener('online', go); document.removeEventListener('visibilitychange', vis); clearInterval(t) }
}
