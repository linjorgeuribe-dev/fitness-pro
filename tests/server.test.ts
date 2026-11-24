import { beforeAll, describe, expect, it } from 'vitest'
import { handle, hashPassword, verifyPassword, type Ctx } from '../server/core.ts'
import { memoryDb } from '../server/pglite-db.ts'

const ORIGIN = 'https://app.test'
let ctx: Ctx
beforeAll(async () => { ctx = { db: await memoryDb(), ip: '1.1.1.1', secure: true } })

type R = { status: number; body: any; cookie: string }
async function call(method: string, path: string, body?: unknown, cookie = '', headers: Record<string, string> = {}, ip = ctx.ip): Promise<R> {
  const res = await handle(new Request(ORIGIN + path, { method, body: body === undefined ? undefined : JSON.stringify(body),
    headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), origin: ORIGIN, ...(cookie ? { cookie } : {}), ...headers } }), { ...ctx, ip })
  const set = res.headers.get('set-cookie') ?? ''
  return { status: res.status, body: await res.json(), cookie: set.split(';')[0] }
}
const reg = async (email: string, ip: string) => (await call('POST', '/api/register', { email, password: 'contraseña-larga-1' }, '', {}, ip)).cookie
const rec = (id: string, extra = {}) => ({ kind: 'routine', id, data: { id, name: 'R ' + id, ...extra }, deleted: false })

describe('contraseñas', () => {
  it('hash con sal y verificación', async () => {
    const h = await hashPassword('secreto-123456')
    expect(h).not.toContain('secreto'); expect(h).not.toBe(await hashPassword('secreto-123456'))
    expect(await verifyPassword('secreto-123456', h)).toBe(true); expect(await verifyPassword('otra', h)).toBe(false); expect(await verifyPassword('x', 'basura')).toBe(false)
  })
})

describe('cuentas', () => {
  it('registro, sesión por cookie HttpOnly, /me y cierre de sesión', async () => {
    const r = await call('POST', '/api/register', { email: ' Ana@Example.com ', password: 'contraseña-larga-1' })
    expect(r.status).toBe(201); expect(r.body.email).toBe('ana@example.com'); expect(r.cookie).toMatch(/^fp_session=.{40,}/)
    const raw = await handle(new Request(ORIGIN + '/api/login', { method: 'POST', headers: { 'content-type': 'application/json', origin: ORIGIN }, body: JSON.stringify({ email: 'ana@example.com', password: 'contraseña-larga-1' }) }), ctx)
    expect(raw.headers.get('set-cookie')).toMatch(/HttpOnly; SameSite=Lax; Max-Age=\d+; Secure/)
    expect((await call('GET', '/api/me', undefined, r.cookie)).body.email).toBe('ana@example.com')
    expect((await call('GET', '/api/me')).status).toBe(401)
    expect((await call('POST', '/api/logout', {}, r.cookie)).status).toBe(200)
    expect((await call('GET', '/api/me', undefined, r.cookie)).status).toBe(401)
  })
  it('no guarda la contraseña ni el token en claro', async () => {
    const [u] = await ctx.db.query(`select pass_hash from users where email = 'ana@example.com'`)
    expect(u.pass_hash.startsWith('scrypt$')).toBe(true); expect(u.pass_hash).not.toContain('contraseña')
    const c = await call('POST', '/api/login', { email: 'ana@example.com', password: 'contraseña-larga-1' })
    const rows = await ctx.db.query('select token_hash from auth_sessions')
    expect(rows.some((s) => c.cookie.includes(s.token_hash))).toBe(false)
  })
  it('rechaza duplicados, correos inválidos y contraseñas cortas', async () => {
    expect((await call('POST', '/api/register', { email: 'ana@example.com', password: 'contraseña-larga-1' }, '', {}, '2.2.2.2')).status).toBe(409)
    expect((await call('POST', '/api/register', { email: 'no-es-correo', password: 'contraseña-larga-1' }, '', {}, '2.2.2.2')).status).toBe(400)
    expect((await call('POST', '/api/register', { email: 'b@example.com', password: 'corta' }, '', {}, '2.2.2.2')).status).toBe(400)
  })
  it('mismo mensaje para correo inexistente y contraseña incorrecta', async () => {
    const a = await call('POST', '/api/login', { email: 'ana@example.com', password: 'mala' }, '', {}, '3.3.3.3'), b = await call('POST', '/api/login', { email: 'nadie@example.com', password: 'mala' }, '', {}, '3.3.3.3')
    expect(a.status).toBe(401); expect(b.status).toBe(401); expect(a.body).toEqual(b.body)
  })
  it('bloquea CSRF (origen ajeno o ausente) y cuerpos que no son JSON', async () => {
    expect((await call('POST', '/api/login', { email: 'ana@example.com', password: 'contraseña-larga-1' }, '', { origin: 'https://evil.test' })).status).toBe(403)
    const noOrigin = await handle(new Request(ORIGIN + '/api/logout', { method: 'POST' }), ctx); expect(noOrigin.status).toBe(403)
    const form = await handle(new Request(ORIGIN + '/api/login', { method: 'POST', headers: { origin: ORIGIN, 'content-type': 'application/x-www-form-urlencoded' }, body: 'email=ana@example.com&password=x' }), ctx)
    expect(form.status).toBe(400)
  })
  it('limita intentos de inicio de sesión por correo', async () => {
    await reg('fuerza@example.com', '4.4.4.4')
    let last = 0
    for (let i = 0; i < 9; i++) last = (await call('POST', '/api/login', { email: 'fuerza@example.com', password: 'mala' }, '', {}, '4.4.4.' + i)).status
    expect(last).toBe(429)
    expect((await call('POST', '/api/login', { email: 'fuerza@example.com', password: 'contraseña-larga-1' }, '', {}, '4.4.4.99')).status).toBe(429)
  })
  it('inyección SQL en el correo no hace nada', async () => {
    const r = await call('POST', '/api/login', { email: `x@y.zz' or '1'='1`, password: 'x' }, '', {}, '5.5.5.5'); expect([400, 401]).toContain(r.status)
    expect((await ctx.db.query('select count(*)::int as n from users'))[0].n).toBeGreaterThan(0)
  })
})

describe('sincronización', () => {
  let a = '', b = ''
  beforeAll(async () => { a = await reg('sync-a@example.com', '6.6.6.6'); b = await reg('sync-b@example.com', '6.6.6.7') })
  it('exige sesión', async () => { expect((await call('POST', '/api/sync', { since: 0, changes: [] })).status).toBe(401) })
  it('sube, baja en otro dispositivo y avanza el cursor', async () => {
    const up = await call('POST', '/api/sync', { since: 0, changes: [rec('r1'), rec('r2')] }, a)
    expect(up.status).toBe(200); expect(up.body.changes).toEqual([]); expect(up.body.cursor).toBeGreaterThan(0)
    const down = await call('POST', '/api/sync', { since: 0, changes: [] }, a)
    expect(down.body.changes.map((c: any) => c.id).sort()).toEqual(['r1', 'r2']); expect(down.body.cursor).toBe(up.body.cursor)
    expect((await call('POST', '/api/sync', { since: down.body.cursor, changes: [] }, a)).body.changes).toEqual([])
  })
  it('aísla los datos entre usuarios', async () => {
    expect((await call('POST', '/api/sync', { since: 0, changes: [] }, b)).body.changes).toEqual([])
    await call('POST', '/api/sync', { since: 0, changes: [rec('r1', { name: 'de B' })] }, b)
    const mine = (await call('POST', '/api/sync', { since: 0, changes: [] }, a)).body.changes.find((c: any) => c.id === 'r1')
    expect(mine.data.name).toBe('R r1')
  })
  it('última escritura gana y los borrados viajan como lápidas', async () => {
    const c0 = (await call('POST', '/api/sync', { since: 0, changes: [] }, a)).body.cursor
    await call('POST', '/api/sync', { since: c0, changes: [rec('r1', { name: 'editada' }), { kind: 'routine', id: 'r2', deleted: true }] }, a)
    const d = (await call('POST', '/api/sync', { since: c0, changes: [] }, a)).body.changes
    expect(d.find((c: any) => c.id === 'r1').data.name).toBe('editada'); expect(d.find((c: any) => c.id === 'r2')).toMatchObject({ deleted: true, data: null })
  })
  it('valida tipo, id y tamaño', async () => {
    for (const bad of [{ kind: 'users', id: 'x', data: {} }, { kind: 'routine', id: '', data: {} }, { kind: 'routine', id: 'x', data: 'texto' }, { kind: 'routine', id: 'x', data: { big: 'a'.repeat(400_000) } }])
      expect((await call('POST', '/api/sync', { since: 0, changes: [bad] }, a)).status).toBe(400)
    expect((await call('POST', '/api/sync', { since: -1, changes: [] }, a)).status).toBe(400)
  })
  it('eliminar cuenta exige contraseña y borra todo en cascada', async () => {
    expect((await call('POST', '/api/account/delete', { password: 'mala' }, b)).status).toBe(401)
    expect((await call('POST', '/api/account/delete', { password: 'contraseña-larga-1' }, b)).status).toBe(200)
    expect((await call('GET', '/api/me', undefined, b)).status).toBe(401)
    const [n] = await ctx.db.query(`select (select count(*) from users where email = 'sync-b@example.com')::int as u, (select count(*) from records r where not exists (select 1 from users u where u.id = r.user_id))::int as huerfanos`)
    expect(n).toEqual({ u: 0, huerfanos: 0 })
  })
})
