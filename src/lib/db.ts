import Dexie, { type Table } from 'dexie'
import type { BodyEntry, DayLog, Measure, Photo, Profile, Routine, Session } from './types'

class FitDB extends Dexie {
  profile!: Table<Profile, string>
  routines!: Table<Routine, string>
  sessions!: Table<Session, string>
  body!: Table<BodyEntry, string>
  days!: Table<DayLog, string>
  measures!: Table<Measure, string>
  photos!: Table<Photo, string>
  synced!: Table<{ key: string; h: string }, string>
  kv!: Table<{ key: string; value: unknown }, string>
  constructor() {
    super('fitness-pro')
    this.version(1).stores({ profile: 'id', routines: 'id, updatedAt', sessions: 'id, status, start', body: 'id, date' })
    // v2: estado de sincronización (huella de lo último enviado/recibido por registro, y cursor)
    this.version(2).stores({ synced: 'key', kv: 'key' })
    this.version(3).stores({ days: 'id', measures: 'id, date', photos: 'id, date' })
  }
}
export const db = new FitDB()
/** Fecha local AAAA-MM-DD (no UTC: a las 10 p. m. en Mexicali sigue siendo «hoy»). */
export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2))

/** Pide al navegador que no borre los datos locales bajo presión de almacenamiento. */
export async function requestPersistence() {
  try { if (navigator.storage?.persist) await navigator.storage.persist() } catch { /* opcional */ }
}

export async function exportAll() {
  const [profile, routines, sessions, body, days, measures] = await Promise.all([db.profile.toArray(), db.routines.toArray(), db.sessions.toArray(), db.body.toArray(), db.days.toArray(), db.measures.toArray()])
  // Las fotos de progreso no van en el respaldo (son binarias y privadas del dispositivo).
  return { app: 'fitness-pro', version: 2, exportedAt: new Date().toISOString(), profile, routines, sessions, body, days, measures }
}

export async function importAll(data: any) {
  if (!data || data.app !== 'fitness-pro' || !Array.isArray(data.sessions) || !Array.isArray(data.routines))
    throw new Error('El archivo no es un respaldo válido de Fitness Pro.')
  await db.transaction('rw', [db.profile, db.routines, db.sessions, db.body, db.days, db.measures], async () => {
    if (Array.isArray(data.days)) await db.days.bulkPut(data.days)
    if (Array.isArray(data.measures)) await db.measures.bulkPut(data.measures)
    if (Array.isArray(data.profile)) await db.profile.bulkPut(data.profile)
    await db.routines.bulkPut(data.routines)
    await db.sessions.bulkPut(data.sessions)
    if (Array.isArray(data.body)) await db.body.bulkPut(data.body)
  })
}

export async function wipeAll() {
  await db.transaction('rw', [db.profile, db.routines, db.sessions, db.body, db.days, db.measures, db.photos, db.synced, db.kv], async () => {
    await Promise.all([db.profile.clear(), db.routines.clear(), db.sessions.clear(), db.body.clear(), db.days.clear(), db.measures.clear(), db.photos.clear(), db.synced.clear(), db.kv.clear()])
  })
}
