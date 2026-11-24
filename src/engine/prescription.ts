import type { Goal, Level } from '../lib/types'

export interface Rx { sets: number; repMin: number; repMax: number; rest: number; rir: number }

/**
 * Prescripción inicial orientativa por objetivo y experiencia.
 * Rangos tomados de ACSM (2009) y NSCA (Essentials, 4.ª ed.); ver docs/SCIENTIFIC_REFERENCES.md.
 * `compound` = ejercicio multiarticular (descansos más largos, repeticiones algo más bajas).
 */
export function prescribe(goal: Goal, level: Level, compound: boolean): Rx {
  const base: Record<Goal, [Rx, Rx]> = {
    //            multiarticular                                         aislamiento
    strength:    [{ sets: 4, repMin: 3, repMax: 6, rest: 180, rir: 2 },  { sets: 3, repMin: 6, repMax: 10, rest: 120, rir: 2 }],
    hypertrophy: [{ sets: 3, repMin: 6, repMax: 10, rest: 120, rir: 2 }, { sets: 3, repMin: 10, repMax: 15, rest: 75, rir: 1 }],
    recomp:      [{ sets: 3, repMin: 6, repMax: 10, rest: 120, rir: 2 }, { sets: 3, repMin: 10, repMax: 15, rest: 75, rir: 1 }],
    fatloss:     [{ sets: 3, repMin: 8, repMax: 12, rest: 90, rir: 2 },  { sets: 3, repMin: 12, repMax: 15, rest: 60, rir: 2 }],
    endurance:   [{ sets: 3, repMin: 12, repMax: 20, rest: 60, rir: 2 }, { sets: 2, repMin: 15, repMax: 25, rest: 45, rir: 2 }],
    fitness:     [{ sets: 3, repMin: 8, repMax: 12, rest: 90, rir: 2 },  { sets: 2, repMin: 12, repMax: 15, rest: 60, rir: 2 }],
    maintain:    [{ sets: 2, repMin: 6, repMax: 10, rest: 120, rir: 2 }, { sets: 2, repMin: 10, repMax: 15, rest: 75, rir: 2 }],
    mobility:    [{ sets: 2, repMin: 10, repMax: 15, rest: 60, rir: 3 }, { sets: 2, repMin: 12, repMax: 15, rest: 45, rir: 3 }],
  }
  const rx = { ...base[goal][compound ? 0 : 1] }
  if (level === 1) {
    // Principiantes: volumen moderado, lejos del fallo y sin cargas máximas — prioridad a la técnica.
    rx.sets = Math.min(rx.sets, 3)
    rx.rir = Math.max(rx.rir, 3)
    if (rx.repMin < 5) { rx.repMin = 5; rx.repMax = Math.max(rx.repMax, 8) }
  } else if (level === 3 && (goal === 'hypertrophy' || goal === 'strength') && compound) {
    rx.sets += 1
  }
  return rx
}

/** Minutos estimados de un ejercicio (series × (ejecución + descanso) + transición). */
export const minutesFor = (rx: Rx) => (rx.sets * (40 + rx.rest) + 60) / 60
