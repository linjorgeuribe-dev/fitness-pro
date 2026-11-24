/** Postgres embebido (PGlite) con la migración aplicada: para pruebas y para el servidor local de e2e. */
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import type { Db } from './core.ts'

export async function memoryDb(): Promise<Db> {
  const pg = new PGlite()
  for (const f of ['001_init.sql', '002_nutricion.sql']) await pg.exec(readFileSync(new URL('../migrations/' + f, import.meta.url), 'utf8'))
  return { query: async (sql, params = []) => (await pg.query(sql, params as any[])).rows as any[] }
}
