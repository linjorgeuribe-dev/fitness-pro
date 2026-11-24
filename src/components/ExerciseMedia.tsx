import { useState } from 'react'
import { imgUrl } from '../lib/catalog'
import type { Exercise } from '../lib/types'
import { cx } from './ui'

/** Demostración del ejercicio: alterna las fotos de posición inicial y final. Las fotos tienen fondo claro, por eso el marco es blanco en ambos temas. */
export function ExerciseMedia({ ex, animate = true, className }: { ex: Exercise; animate?: boolean; className?: string }) {
  const [err, setErr] = useState(false)
  if (err) return <div className={cx('grid aspect-[3/2] place-items-center rounded-2xl bg-raised text-center text-xs text-mute', className)}>Imagen no disponible sin conexión</div>
  return (
    <div className={cx('relative aspect-[3/2] overflow-hidden rounded-2xl bg-white', className)}>
      <img src={imgUrl(ex.id, 0)} alt={animate ? `${ex.n}: posición inicial y final` : ''} loading="lazy" decoding="async" width={480} height={320}
        className="absolute inset-0 size-full object-cover" onError={() => setErr(true)} />
      {animate && <img src={imgUrl(ex.id, 1)} alt="" loading="lazy" decoding="async" width={480} height={320} className="frame-b absolute inset-0 size-full object-cover" />}
    </div>
  )
}

export function ExerciseFrames({ ex }: { ex: Exercise }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {([0, 1] as const).map((i) => (
        <figure key={i} className="overflow-hidden rounded-2xl bg-white">
          <img src={imgUrl(ex.id, i)} alt={`${ex.n}: posición ${i ? 'final' : 'inicial'}`} loading="lazy" width={480} height={320} className="aspect-[3/2] w-full object-cover" />
          <figcaption className="bg-raised px-3 py-1.5 text-xs font-semibold text-mute">{i ? 'Posición final' : 'Posición inicial'}</figcaption>
        </figure>
      ))}
    </div>
  )
}
