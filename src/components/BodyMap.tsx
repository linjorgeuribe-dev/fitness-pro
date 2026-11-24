import { useState } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import type { Muscle } from '../lib/types'
import { MUSCLE } from '../lib/labels'
import { cx } from './ui'

type Shape = { m: Muscle; d: string }
// Figura esquemática propia (viewBox 200×420). Cada región es un trazo simétrico.
const mirror = (d: string) => d.replace(/([MLQC ])\s*(-?[\d.]+)[ ,](-?[\d.]+)/g, (_, c, x, y) => `${c}${200 - +x} ${y}`)
const pair = (m: Muscle, d: string): Shape[] => [{ m, d }, { m, d: mirror(d) }]
const FRONT: Shape[] = [
  { m: 'neck', d: 'M90 52 L110 52 L112 66 L88 66 Z' },
  ...pair('traps', 'M88 60 L70 72 L88 72 Z'),
  ...pair('shoulders', 'M68 72 Q50 74 48 96 L62 100 Q64 84 76 76 Z'),
  ...pair('chest', 'M98 76 L78 76 Q66 86 66 102 Q82 112 98 106 Z'),
  ...pair('biceps', 'M48 100 L62 104 L60 140 L46 138 Z'),
  ...pair('forearms', 'M45 144 L60 146 L54 192 L42 190 Z'),
  { m: 'abdominals', d: 'M82 112 Q100 118 118 112 L116 176 Q100 186 84 176 Z' },
  ...pair('abdominals', 'M66 108 L79 113 L81 172 L70 164 Z'),
  ...pair('abductors', 'M68 172 L80 180 L74 206 L64 196 Z'),
  ...pair('quadriceps', 'M66 204 L78 210 L96 196 L96 280 L74 284 Q64 246 66 204 Z'),
  ...pair('adductors', 'M84 190 L99 192 L99 236 Z'),
  ...pair('calves', 'M74 300 L94 300 L92 368 L80 368 Z'),
]
const BACK: Shape[] = [
  { m: 'neck', d: 'M90 52 L110 52 L111 60 L89 60 Z' },
  { m: 'traps', d: 'M100 60 L70 74 L88 84 L100 116 L112 84 L130 74 Z' },
  ...pair('shoulders', 'M68 74 Q50 76 48 98 L62 102 Q66 88 80 82 Z'),
  ...pair('middle back', 'M98 120 L86 88 L72 92 L74 116 Z'),
  ...pair('lats', 'M66 106 L74 120 L98 124 L98 156 L78 160 Z'),
  { m: 'lower back', d: 'M82 162 L118 162 L116 186 L84 186 Z' },
  ...pair('triceps', 'M48 102 L62 106 L60 142 L46 140 Z'),
  ...pair('forearms', 'M45 146 L60 148 L54 192 L42 190 Z'),
  ...pair('abductors', 'M66 176 L78 172 L76 192 L64 196 Z'),
  ...pair('glutes', 'M70 196 Q70 186 84 190 L99 190 L99 226 Q80 234 68 222 Z'),
  ...pair('hamstrings', 'M68 228 Q84 238 98 230 L96 290 L74 292 Q66 260 68 228 Z'),
  ...pair('calves', 'M72 300 Q84 292 96 300 L92 352 L80 352 Z'),
]
const OUTLINE = 'M100 14 Q118 14 118 34 Q118 48 110 54 L112 62 Q134 68 150 76 Q158 96 156 140 L162 196 L148 198 L142 150 L136 112 L134 176 Q138 240 132 296 L128 376 L134 400 L106 400 L104 300 L100 236 L96 300 L94 400 L66 400 L72 376 L68 296 Q62 240 66 176 L64 112 L58 150 L52 198 L38 196 L44 140 Q42 96 50 76 Q66 68 88 62 L90 54 Q82 48 82 34 Q82 14 100 14 Z'

export interface BodyMapProps {
  selected?: Muscle | null
  onSelect?: (m: Muscle) => void
  /** Intensidad 0–1 por músculo (p. ej. volumen semanal relativo). */
  heat?: Partial<Record<Muscle, number>>
  primary?: Muscle[]
  secondary?: Muscle[]
  compact?: boolean
}

export function BodyMap({ selected, onSelect, heat, primary, secondary, compact }: BodyMapProps) {
  const [zoom, setZoom] = useState(1)
  const fill = (m: Muscle) => {
    if (selected === m || primary?.includes(m)) return 'var(--ember)'
    if (secondary?.includes(m)) return 'var(--amber)'
    const h = heat?.[m]
    if (h) return `color-mix(in oklab, var(--ember) ${Math.round(20 + Math.min(1, h) * 80)}%, var(--raised))`
    return 'var(--raised)'
  }
  const figure = (shapes: Shape[], label: string) => (
    <svg viewBox="20 6 160 402" role="group" aria-label={label} className="h-full w-1/2 max-w-[220px]">
      <path d={OUTLINE} fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />
      {shapes.map((s, i) => onSelect ? (
        <path key={i} d={s.d} fill={fill(s.m)} stroke="var(--bg)" strokeWidth="1.5" strokeLinejoin="round" tabIndex={0} role="button"
          aria-label={MUSCLE[s.m]} aria-pressed={selected === s.m} className="cursor-pointer outline-none transition-[fill] hover:brightness-125 focus-visible:stroke-[var(--ink)] focus-visible:stroke-[3]"
          onClick={() => onSelect(s.m)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(s.m))} />
      ) : <path key={i} d={s.d} fill={fill(s.m)} stroke="var(--bg)" strokeWidth="1.5" strokeLinejoin="round" />)}
    </svg>
  )
  return (
    <div className="relative">
      <div className={cx('overflow-auto rounded-2xl', compact ? 'h-44' : 'h-[min(60dvh,440px)]')}>
        <div className="flex h-full origin-top justify-center gap-2 transition-transform" style={{ transform: `scale(${zoom})`, height: `${100}%`, marginBottom: `${(zoom - 1) * 100}%` }}>
          {figure(FRONT, 'Vista frontal')}{figure(BACK, 'Vista posterior')}
        </div>
      </div>
      {!compact && (
        <div className="absolute right-2 top-2 flex flex-col gap-2">
          <button aria-label="Acercar" disabled={zoom >= 2} onClick={() => setZoom((z) => Math.min(2, z + 0.5))} className="grid size-11 place-items-center rounded-full bg-raised disabled:opacity-40"><ZoomIn size={18} /></button>
          <button aria-label="Alejar" disabled={zoom <= 1} onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="grid size-11 place-items-center rounded-full bg-raised disabled:opacity-40"><ZoomOut size={18} /></button>
        </div>
      )}
      {!compact && <div className="mt-1 flex justify-around text-xs font-semibold uppercase tracking-wider text-mute"><span>Frente</span><span>Espalda</span></div>}
    </div>
  )
}
