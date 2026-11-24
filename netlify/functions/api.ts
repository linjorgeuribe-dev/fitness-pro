import { neon } from '@neondatabase/serverless'
import { handle, type Db } from '../../server/core.ts'

let db: Db | null = null
function getDb(): Db {
  if (db) return db
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Falta DATABASE_URL')
  const sql = neon(url)
  return (db = { query: (text, params = []) => sql.query(text, params as any[]) as Promise<any[]> })
}

export default async (req: Request, context: { ip?: string }) => {
  try { return await handle(req, { db: getDb(), ip: context.ip ?? 'desconocida', secure: true }) }
  catch { return new Response(JSON.stringify({ error: 'Servicio de cuentas no disponible.' }), { status: 503, headers: { 'content-type': 'application/json' } }) }
}
export const config = { path: '/api/*' }
