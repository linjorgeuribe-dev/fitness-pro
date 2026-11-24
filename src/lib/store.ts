import { createContext, useContext } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, uid } from './db'
import type { Profile, Routine, Session, SessionItem, SetLog } from './types'
import { kgToLb, lbToKg } from '../engine/calc'

export const useProfileLive = () => useLiveQuery(async () => (await db.profile.get('me')) ?? null, [], undefined)
/** El perfil se lee una vez en App y se comparte por contexto, así las pantallas nunca lo ven «cargando». */
export const ProfileCtx = createContext<Profile | null>(null)
export const useProfile = () => useContext(ProfileCtx)
export const useRoutines = () => useLiveQuery(() => db.routines.orderBy('updatedAt').reverse().toArray(), [], [] as Routine[])
/** Igual que useRoutines pero devuelve undefined mientras carga (evita parpadeos de «sin rutina»). */
export const useRoutinesMaybe = () => useLiveQuery(() => db.routines.orderBy('updatedAt').reverse().toArray(), [])
export const useSessions = () => useLiveQuery(async () => (await db.sessions.where('status').equals('done').toArray()).sort((a, b) => b.start - a.start), [], [] as Session[])
export const useActive = () => useLiveQuery(async () => (await db.sessions.where('status').equals('active').first()) ?? null, [], undefined)

/** Los pesos se guardan siempre en kg; estas funciones convierten hacia y desde la unidad del usuario. */
export const toDisp = (kg: number | null | undefined, units: 'kg' | 'lb') => kg == null ? null : Math.round((units === 'lb' ? kgToLb(kg) : kg) * 4) / 4
export const fromDisp = (v: number, units: 'kg' | 'lb') => (units === 'lb' ? lbToKg(v) : v)
export const fmtW = (kg: number | null | undefined, units: 'kg' | 'lb') => { const v = toDisp(kg, units); return v == null ? '—' : String(+v.toFixed(2)) }

const blankSets = (n: number): SetLog[] => Array.from({ length: n }, () => ({ w: null, r: null, rir: null, done: false }))

export async function startSession(routine: Routine | null, dayIdx = 0): Promise<Session> {
  const existing = await db.sessions.where('status').equals('active').first()
  if (existing) return existing
  const day = routine?.days[dayIdx]
  const items: SessionItem[] = (day?.items ?? []).map(({ exId, ...target }) => ({ exId, target, sets: blankSets(target.sets), note: '' }))
  const s: Session = { id: uid(), routineId: routine?.id ?? null, dayName: day?.name ?? 'Entrenamiento libre', start: Date.now(), end: null, pausedMs: 0, pausedAt: null, status: 'active', items, note: '' }
  await db.sessions.add(s)
  return s
}
export const saveSession = (s: Session) => db.sessions.put(s)

export async function finishSession(s: Session) {
  const now = Date.now()
  const pausedMs = s.pausedMs + (s.pausedAt ? now - s.pausedAt : 0)
  // Se conservan solo los ejercicios con al menos una serie completada
  const items = s.items.map((it) => ({ ...it, sets: it.sets.filter((x) => x.done) })).filter((it) => it.sets.length)
  const done: Session = { ...s, items, end: now, pausedMs, pausedAt: null, status: 'done' }
  await db.transaction('rw', db.sessions, db.routines, async () => {
    await db.sessions.put(done)
    if (s.routineId) {
      const r = await db.routines.get(s.routineId)
      if (r) { const i = r.days.findIndex((d) => d.name === s.dayName); await db.routines.update(r.id, { nextDay: ((i < 0 ? r.nextDay : i) + 1) % r.days.length }) }
    }
  })
  localStorage.removeItem('rest')
  return done
}
export const discardSession = async (id: string) => { await db.sessions.delete(id); localStorage.removeItem('rest') }

export const DEFAULT_PROFILE: Profile = {
  id: 'me', name: '', level: 1, goal: 'hypertrophy', days: 3, minutes: 60,
  equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'body', 'ezbar'], priority: [], limitations: '',
  units: 'kg', theme: 'dark', restSound: true, createdAt: 0,
}
