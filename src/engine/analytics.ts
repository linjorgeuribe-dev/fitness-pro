import type { Exercise, Muscle, Session } from '../lib/types'
import { e1rm } from './calc'

export const DAY = 86_400_000
export const doneSets = (s: Session) => s.items.flatMap((it) => it.sets.filter((x) => x.done && !x.warm).map((x) => ({ ...x, exId: it.exId })))
export const sessionVolume = (s: Session) => doneSets(s).reduce((a, x) => a + (x.w ?? 0) * (x.r ?? 0), 0)
export const sessionMinutes = (s: Session) => Math.max(0, Math.round(((s.end ?? Date.now()) - s.start - s.pausedMs) / 60000))

export function startOfWeek(t: number) { // lunes
  const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime()
}

/** Series efectivas por músculo: 1 por músculo principal, 0.5 por secundario (convención habitual de conteo de volumen). */
export function muscleSets(sessions: Session[], get: (id: string) => Exercise | undefined) {
  const out = {} as Record<Muscle, number>
  for (const s of sessions) for (const it of s.items) {
    const ex = get(it.exId); if (!ex) continue
    const n = it.sets.filter((x) => x.done && !x.warm).length
    for (const m of ex.p) out[m] = (out[m] ?? 0) + n
    for (const m of ex.s) out[m] = (out[m] ?? 0) + n * 0.5
  }
  return out
}

export function lastTrained(sessions: Session[], get: (id: string) => Exercise | undefined) {
  const out = {} as Record<Muscle, number>
  for (const s of sessions) for (const it of s.items) {
    if (!it.sets.some((x) => x.done)) continue
    const ex = get(it.exId); if (!ex) continue
    for (const m of ex.p) out[m] = Math.max(out[m] ?? 0, s.end ?? s.start)
  }
  return out
}

/**
 * Estimación orientativa de recuperación (0–100) a partir del tiempo desde la última sesión
 * y de las series registradas ese día. No es una medición fisiológica.
 */
export function recoveryPct(hoursSince: number, setsThatDay: number) {
  const need = Math.min(96, 36 + setsThatDay * 4) // 48 h con ~3 series, hasta 96 h con mucho volumen
  return Math.max(0, Math.min(100, Math.round((hoursSince / need) * 100)))
}

export interface PR { exId: string; weight: number; reps: number; e1rm: number; date: number }
export function personalRecords(sessions: Session[]) {
  const best = new Map<string, PR>()
  for (const s of sessions) for (const x of doneSets(s)) {
    if (!x.w || !x.r) continue
    const v = e1rm(x.w, x.r); const b = best.get(x.exId)
    if (!b || v > b.e1rm) best.set(x.exId, { exId: x.exId, weight: x.w, reps: x.r, e1rm: v, date: s.end ?? s.start })
  }
  return best
}

export function exerciseHistory(sessions: Session[], exId: string) {
  return sessions.filter((s) => s.status === 'done').sort((a, b) => b.start - a.start)
    .map((s) => ({ date: s.start, sets: s.items.filter((i) => i.exId === exId).flatMap((i) => i.sets) }))
    .filter((h) => h.sets.some((x) => x.done))
}

/** Desequilibrios de volumen entre pares antagonistas en el periodo dado. */
export function imbalances(v: Partial<Record<Muscle, number>>) {
  const g = (ms: Muscle[]) => ms.reduce((a, m) => a + (v[m] ?? 0), 0)
  const pairs: [string, number, string, number][] = [
    ['empuje (pecho, hombros, tríceps)', g(['chest', 'shoulders', 'triceps']), 'tirón (dorsales, espalda media, bíceps)', g(['lats', 'middle back', 'biceps'])],
    ['cuádriceps', g(['quadriceps']), 'isquiotibiales y glúteos', g(['hamstrings', 'glutes'])],
  ]
  const out: string[] = []
  for (const [a, va, b, vb] of pairs) {
    if (va + vb < 12) continue
    if (va > vb * 1.6) out.push(`Llevas ${Math.round(va)} series de ${a} frente a ${Math.round(vb)} de ${b}.`)
    else if (vb > va * 1.6) out.push(`Llevas ${Math.round(vb)} series de ${b} frente a ${Math.round(va)} de ${a}.`)
  }
  return out
}

export function toCSV(sessions: Session[], get: (id: string) => Exercise | undefined, units: string) {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`
  const rows = [['fecha', 'sesion', 'ejercicio', 'exercise', 'serie', `peso_${units}`, 'repeticiones', 'rir', 'calentamiento', 'nota'].join(',')]
  for (const s of [...sessions].sort((a, b) => a.start - b.start)) for (const it of s.items) {
    const ex = get(it.exId); let n = 0
    for (const x of it.sets) if (x.done) rows.push([new Date(s.start).toISOString(), esc(s.dayName), esc(ex?.n ?? it.exId), esc(ex?.e ?? ''), ++n, x.w ?? '', x.r ?? '', x.rir ?? '', x.warm ? 1 : 0, esc(it.note)].join(','))
  }
  return rows.join('\n')
}
