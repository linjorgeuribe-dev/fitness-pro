import { useEffect, useState } from 'react'
import { MOVES } from './moves'
import { mix, phase, solve } from './rig'
import { Figure } from './Figure'
import type { Exercise } from '../lib/types'

/** Esquema animado del movimiento (figura propia dibujada por programa). Devuelve null si el ejercicio aún no tiene. */
export function ExerciseAnimation({ ex }: { ex: Exercise }) {
  const move = MOVES[ex.id]
  const still = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [t, setT] = useState(still ? 0.5 : 0)
  useEffect(() => {
    if (!move || still) return
    let raf = 0; const t0 = performance.now()
    const tick = (now: number) => { setT(phase((now - t0) / 1000)); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [move, still])
  if (!move) return null
  return (
    <figure className="overflow-hidden rounded-2xl border border-line">
      <div className="aspect-[3/2]" aria-label={`Esquema animado de ${ex.n}`}><Figure pose={solve(mix(move.a, move.b, t))} props={move.props} primary={ex.p} secondary={ex.s} /></div>
      <figcaption className="bg-raised px-3 py-2 text-sm"><b>Clave técnica:</b> {move.cue}<span className="mt-1 block text-xs text-mute">Esquema del movimiento con músculos principales en naranja y secundarios en amarillo. Ilustrativo; revisión por un entrenador pendiente.</span></figcaption>
    </figure>
  )
}
