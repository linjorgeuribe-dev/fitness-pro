import { useEffect, useState } from 'react'
import { MOVES } from './moves'
import { buildMove } from './templates'
import { mix, phase, solve } from './rig'
import { Figure } from './Figure'
import { FigureFront, buildFront, mixFront, solveFront } from './front'
import type { Exercise } from '../lib/types'

/** Esquema animado del movimiento (figura propia dibujada por programa). Devuelve null si el ejercicio aún no tiene. */
export function ExerciseAnimation({ ex }: { ex: Exercise }) {
  // Posturas afinadas a mano si existen; si no, la plantilla de su familia de movimiento.
  const side = MOVES[ex.id] ?? buildMove(ex), front = side ? null : buildFront(ex), move = side ?? front
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
      <div className="aspect-[3/2]" aria-label={`Esquema animado de ${ex.n}`}>{side ? <Figure pose={solve(mix(side.a, side.b, t))} props={side.props} primary={ex.p} secondary={ex.s} /> : <FigureFront pose={solveFront(mixFront(front!.a, front!.b, t))} move={front!} primary={ex.p} secondary={ex.s} />}</div>
      <figcaption className="bg-raised px-3 py-2 text-sm"><b>Clave técnica:</b> {move.cue}<span className="mt-1 block text-xs text-mute">{front ? (front.view === 'arriba' ? 'Vista desde arriba. ' : 'Vista de frente. ') : ''}Esquema del movimiento con músculos principales en naranja y secundarios en amarillo. Ilustrativo; revisión por un entrenador pendiente.</span></figcaption>
    </figure>
  )
}
