import Dexie, { type Table } from 'dexie'
import type { BodyEntry, Profile, Routine, Session } from './types'

class FitDB extends Dexie {
  profile!: Table<Profile, string>
  routines!: Table<Routine, string>
  sessions!: Table<Session, string>
  body!: Table<BodyEntry, string>
  synced!: Table<{ key: string; h: string }, string>
  kv!: Table<{ key: string; value: unknown }, string>
  constructor() {
    super('fitness-pro')
    this.version(1).stores({ profile: 'id', routines: 'id, updatedAt', sessions: 'id, status, start', body: 'id, date' })
    // v2: estado de sincronización (huella de lo último enviado/recibido por registro, y cursor)
    this.version(2).stores({ synced: 'key', kv: 'key' })
  }
}
export const db = new FitDB()
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2))

/** Pide al navegador que no borre los datos locales bajo presión de almacenamiento. */
export async function requestPersistence() {
  try { if (navigator.storage?.persist) await navigator.storage.persist() } catch { /* opcional */ }
}

export async function exportAll() {
  const [profile, routines, sessions, body] = await Promise.all([db.profile.toArray(), db.routines.toArray(), db.sessions.toArray(), db.body.toArray()])
  return { app: 'fitness-pro', version: 1, exportedAt: new Date().toISOString(), profile, routines, sessions, body }
}

export async function importAll(data: any) {
  if (!data || data.app !== 'fitness-pro' || !Array.isArray(data.sessions) || !Array.isArray(data.routines))
    throw new Error('El archivo no es un respaldo válido de Fitness Pro.')
  await db.transaction('rw', db.profile, db.routines, db.sessions, db.body, async () => {
    if (Array.isArray(data.profile)) await db.profile.bulkPut(data.profile)
    await db.routines.bulkPut(data.routines)
    await db.sessions.bulkPut(data.sessions)
    if (Array.isArray(data.body)) await db.body.bulkPut(data.body)
  })
}

export async function wipeAll() {
  await db.transaction('rw', [db.profile, db.routines, db.sessions, db.body, db.synced, db.kv], async () => {
    await Promise.all([db.profile.clear(), db.routines.clear(), db.sessions.clear(), db.body.clear(), db.synced.clear(), db.kv.clear()])
  })
}
