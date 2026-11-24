import type { Equip, SetLog } from '../lib/types'

export interface Suggestion {
  action: 'increase' | 'hold' | 'reduce' | 'deload' | 'start'
  weight: number | null
  reason: string
}
export interface PastSession { sets: SetLog[] } // más reciente primero

/** Incremento mínimo realista según el equipo (en la unidad del usuario). */
export function increment(eq: Equip, units: 'kg' | 'lb', lowerBody: boolean) {
  if (units === 'lb') return eq === 'barbell' || eq === 'ezbar' ? (lowerBody ? 10 : 5) : eq === 'machine' || eq === 'cable' ? 5 : 5
  return eq === 'barbell' || eq === 'ezbar' ? (lowerBody ? 5 : 2.5) : eq === 'dumbbell' || eq === 'kettlebell' ? 2 : 2.5
}

const work = (s: PastSession) => s.sets.filter((x) => x.done && !x.warm && x.w != null && x.r != null && x.r > 0)

/**
 * Doble progresión: primero se sube en repeticiones dentro del rango; al completar el tope
 * en todas las series con margen (RIR), se propone subir carga. Nunca aplica el cambio sola:
 * devuelve una sugerencia con su explicación para que el usuario decida.
 */
export function suggest(history: PastSession[], t: { sets: number; repMin: number; repMax: number; rir: number }, inc: number): Suggestion {
  const last = history[0] ? work(history[0]) : []
  if (!last.length) return { action: 'start', weight: null, reason: 'Sin registros previos: elige un peso que te permita completar el rango con buena técnica y 2–3 repeticiones de margen.' }
  const top = Math.max(...last.map((s) => s.w!))
  const atTop = last.filter((s) => s.w === top)
  const rirs = last.map((s) => s.rir).filter((x): x is number => x != null)
  const avgRir = rirs.length ? rirs.reduce((a, b) => a + b, 0) / rirs.length : null

  // Tendencia: mejor serie (peso × reps) de las últimas sesiones
  const best = history.slice(0, 3).map((h) => Math.max(0, ...work(h).map((s) => s.w! * s.r!)))
  const declining = best.length === 3 && best[0] < best[1] && best[1] < best[2]
  if (declining) return { action: 'deload', weight: Math.max(0, top - inc), reason: 'Tu mejor serie bajó en las últimas 3 sesiones. Considera una semana de descarga (menos series y peso) o revisa sueño y descanso antes de volver a subir.' }

  const allTop = last.length >= t.sets && atTop.length === last.length && last.every((s) => s.r! >= t.repMax)
  if (allTop && (avgRir == null || avgRir >= Math.max(1, t.rir - 1)))
    return { action: 'increase', weight: top + inc, reason: `Completaste ${last.length} series de ${t.repMax}+ repeticiones con ${top}${avgRir != null ? ` y RIR promedio ${avgRir.toFixed(1)}` : ''}. Puedes subir ${inc} y volver a la parte baja del rango.` }
  if (allTop) return { action: 'hold', weight: top, reason: `Llegaste al tope del rango, pero muy cerca del fallo (RIR ${avgRir!.toFixed(1)}). Repite el peso buscando más margen antes de subir.` }

  const below = last.filter((s) => s.r! < t.repMin).length
  if (below >= Math.ceil(last.length / 2)) {
    const prev = history[1] ? work(history[1]) : []
    const prevBelow = prev.length > 0 && prev.filter((s) => s.r! < t.repMin).length >= Math.ceil(prev.length / 2)
    if (prevBelow) return { action: 'reduce', weight: Math.max(0, top - inc), reason: `Dos sesiones seguidas por debajo de ${t.repMin} repeticiones. Baja ${inc} para trabajar dentro del rango con buena técnica.` }
    return { action: 'hold', weight: top, reason: `Quedaste por debajo de ${t.repMin} repeticiones en varias series. Mantén el peso y, si hace falta, descansa un poco más entre series.` }
  }
  return { action: 'hold', weight: top, reason: `Mantén ${top} y busca sumar repeticiones hasta completar ${t.sets}×${t.repMax}.` }
}
