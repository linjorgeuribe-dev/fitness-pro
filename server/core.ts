/**
 * API de cuentas y sincronización. Lógica pura sobre una interfaz `Db`, para poder
 * ejecutarla igual en Netlify Functions (Neon) y en pruebas (PGlite).
 */
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

export interface Db { query(sql: string, params?: unknown[]): Promise<any[]> }
export interface Ctx { db: Db; ip: string; secure: boolean; now?: () => number }

const KINDS = new Set(['profile', 'routine', 'session', 'body', 'day', 'measure'])
const COOKIE = 'fp_session'
const SESSION_DAYS = 30
const MAX_BODY = 2_000_000, MAX_RECORD = 300_000, MAX_CHANGES = 1000, PULL_LIMIT = 2000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } })
const fail = (status: number, error: string) => json(status, { error })
const sha = (s: string) => createHash('sha256').update(s).digest('hex')

const N = 16384
export function hashPassword(password: string, salt = randomBytes(16)): Promise<string> {
  return new Promise((ok, no) => scrypt(password, salt, 64, { N, r: 8, p: 1 }, (e, key) => (e ? no(e) : ok(`scrypt$${N}$${salt.toString('base64')}$${key.toString('base64')}`))))
}
export async function verifyPassword(password: string, stored: string) {
  const [alg, n, salt, hash] = stored.split('$')
  if (alg !== 'scrypt' || Number(n) !== N || !salt || !hash) return false
  const again = (await hashPassword(password, Buffer.from(salt, 'base64'))).split('$')[3]
  const a = Buffer.from(again, 'base64'), b = Buffer.from(hash, 'base64')
  return a.length === b.length && timingSafeEqual(a, b)
}
// Hash de relleno: el inicio de sesión tarda lo mismo exista o no el correo.
const DUMMY = hashPassword('x'.repeat(12))

function cookie(token: string, maxAge: number, secure: boolean) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`
}
const readCookie = (req: Request) => (req.headers.get('cookie') ?? '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1) ?? ''

async function limited(db: Db, key: string, max: number, minutes: number) {
  const [r] = await db.query(`select count(*)::int as n from auth_attempts where key = $1 and at > now() - ($2 || ' minutes')::interval`, [key, String(minutes)])
  return r.n >= max
}
const strike = (db: Db, key: string) => db.query('insert into auth_attempts (key) values ($1)', [key])

async function startSession(ctx: Ctx, userId: string) {
  const token = randomBytes(32).toString('base64url')
  await ctx.db.query(`insert into auth_sessions (token_hash, user_id, expires_at) values ($1, $2, now() + interval '${SESSION_DAYS} days')`, [sha(token), userId])
  return cookie(token, SESSION_DAYS * 86400, ctx.secure)
}
async function currentUser(ctx: Ctx, req: Request): Promise<{ id: string; email: string } | null> {
  const token = readCookie(req)
  if (!token) return null
  const [u] = await ctx.db.query('select u.id, u.email from auth_sessions s join users u on u.id = s.user_id where s.token_hash = $1 and s.expires_at > now()', [sha(token)])
  return u ?? null
}

async function body(req: Request): Promise<any | null> {
  if (!(req.headers.get('content-type') ?? '').startsWith('application/json')) return null
  const text = await req.text()
  if (text.length > MAX_BODY) return null
  try { const v = JSON.parse(text); return v && typeof v === 'object' ? v : null } catch { return null }
}
function credentials(b: any): { email: string; password: string } | null {
  const email = typeof b?.email === 'string' ? b.email.trim().toLowerCase() : '', password = typeof b?.password === 'string' ? b.password : ''
  return email.length <= 254 && EMAIL_RE.test(email) && password.length >= 1 && password.length <= 200 ? { email, password } : null
}

export async function handle(req: Request, ctx: Ctx): Promise<Response> {
  const url = new URL(req.url)
  const route = `${req.method} ${url.pathname.replace(/\/+$/, '')}`
  try {
    // Defensa CSRF: toda petición que modifica datos debe venir del mismo origen.
    if (req.method !== 'GET' && req.headers.get('origin') !== url.origin) return fail(403, 'Origen no permitido.')

    switch (route) {
      case 'GET /api/me': {
        const u = await currentUser(ctx, req)
        return u ? json(200, { email: u.email }) : fail(401, 'Sin sesión.')
      }
      case 'POST /api/register': {
        const c = credentials(await body(req))
        if (!c) return fail(400, 'Escribe un correo válido.')
        if (c.password.length < 10) return fail(400, 'La contraseña debe tener al menos 10 caracteres.')
        if (await limited(ctx.db, 'reg:' + ctx.ip, 5, 60)) return fail(429, 'Demasiados intentos. Espera un momento.')
        await strike(ctx.db, 'reg:' + ctx.ip)
        const hash = await hashPassword(c.password)
        const rows = await ctx.db.query('insert into users (email, pass_hash) values ($1, $2) on conflict (email) do nothing returning id', [c.email, hash])
        if (!rows.length) return fail(409, 'Ya existe una cuenta con ese correo. Inicia sesión.')
        return json(201, { email: c.email }, { 'set-cookie': await startSession(ctx, rows[0].id) })
      }
      case 'POST /api/login': {
        const c = credentials(await body(req))
        if (!c) return fail(400, 'Correo o contraseña incorrectos.')
        const keys = ['login:' + c.email, 'ip:' + ctx.ip]
        if ((await limited(ctx.db, keys[0], 8, 15)) || (await limited(ctx.db, keys[1], 30, 15))) return fail(429, 'Demasiados intentos. Espera 15 minutos.')
        const [u] = await ctx.db.query('select id, pass_hash from users where email = $1', [c.email])
        const ok = await verifyPassword(c.password, u?.pass_hash ?? (await DUMMY))
        if (!u || !ok) { await Promise.all(keys.map((k) => strike(ctx.db, k))); return fail(401, 'Correo o contraseña incorrectos.') }
        return json(200, { email: c.email }, { 'set-cookie': await startSession(ctx, u.id) })
      }
      case 'POST /api/logout': {
        const token = readCookie(req)
        if (token) await ctx.db.query('delete from auth_sessions where token_hash = $1', [sha(token)])
        return json(200, { ok: true }, { 'set-cookie': cookie('', 0, ctx.secure) })
      }
      case 'POST /api/sync': {
        const u = await currentUser(ctx, req)
        if (!u) return fail(401, 'Sin sesión.')
        const b = await body(req)
        const since = Number(b?.since ?? 0)
        if (!b || !Number.isSafeInteger(since) || since < 0 || !Array.isArray(b.changes) || b.changes.length > MAX_CHANGES) return fail(400, 'Petición inválida.')
        const changes: { kind: string; id: string; data: unknown; deleted: boolean }[] = []
        for (const c of b.changes) {
          const deleted = c?.deleted === true
          if (!KINDS.has(c?.kind) || typeof c.id !== 'string' || !c.id || c.id.length > 80) return fail(400, 'Registro inválido.')
          if (!deleted && (c.data === null || typeof c.data !== 'object' || Array.isArray(c.data) || JSON.stringify(c.data).length > MAX_RECORD)) return fail(400, 'Registro inválido.')
          changes.push({ kind: c.kind, id: c.id, data: deleted ? null : c.data, deleted })
        }
        const pulled = await ctx.db.query('select kind, id, data, deleted, rev::float8 as rev from records where user_id = $1 and rev > $2 order by rev limit $3', [u.id, since, PULL_LIMIT + 1])
        const more = pulled.length > PULL_LIMIT
        if (more) pulled.pop()
        let cursor = pulled.length ? pulled[pulled.length - 1].rev : since
        if (changes.length) {
          // Un solo INSERT … ON CONFLICT: todo el lote entra o no entra. Gana la última escritura por registro.
          const pushed = await ctx.db.query(
            `insert into records (user_id, kind, id, data, deleted, rev, updated_at)
             select $1, c.kind, c.id, c.data, c.deleted, nextval('records_rev'), now()
             from jsonb_to_recordset($2::jsonb) as c(kind text, id text, data jsonb, deleted boolean)
             on conflict (user_id, kind, id) do update set data = excluded.data, deleted = excluded.deleted, rev = excluded.rev, updated_at = now()
             returning rev::float8 as rev`, [u.id, JSON.stringify(changes)])
          if (!more) cursor = Math.max(cursor, ...pushed.map((r) => r.rev))
        }
        return json(200, { changes: pulled.map(({ kind, id, data, deleted }) => ({ kind, id, data, deleted })), cursor, more })
      }
      case 'POST /api/account/delete': {
        const u = await currentUser(ctx, req)
        if (!u) return fail(401, 'Sin sesión.')
        const b = await body(req)
        const [row] = await ctx.db.query('select pass_hash from users where id = $1', [u.id])
        if (typeof b?.password !== 'string' || !row || !(await verifyPassword(b.password, row.pass_hash))) return fail(401, 'Contraseña incorrecta.')
        await ctx.db.query('delete from users where id = $1', [u.id]) // borra en cascada sesiones y registros
        return json(200, { ok: true }, { 'set-cookie': cookie('', 0, ctx.secure) })
      }
      default: return fail(404, 'No encontrado.')
    }
  } catch (e) {
    console.error('api error', route, e instanceof Error ? e.message : e)
    return fail(500, 'Error del servidor. Inténtalo de nuevo.')
  }
}
