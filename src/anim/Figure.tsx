import { add, perp, torsoPoint, FLOOR, type Limb, type Pose, type V } from './rig'
import type { Prop } from './moves'
import type { Muscle } from '../lib/types'

const SKIN = '#cfd3da', FAR = '#737985', EMBER = '#ff6a33', AMBER = '#f5b83d', GEAR = '#7c8390', GEAR2 = '#3b414d'
const P = (v: V) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`
const Seg = ({ a, b, w, c }: { a: V; b: V; w: number; c: string }) => <line x1={a[0].toFixed(1)} y1={a[1].toFixed(1)} x2={b[0].toFixed(1)} y2={b[1].toFixed(1)} stroke={c} strokeWidth={w} strokeLinecap="round" />

/** Franja de músculo sobre un segmento: lado +1 = anterior, −1 = posterior, 0 = centro; from/to = tramo del hueso. */
function Stripe({ a, b, w, side, c, from = 0.12, to = 0.88 }: { a: V; b: V; w: number; side: 1 | -1 | 0; c: string | null; from?: number; to?: number }) {
  if (!c) return null
  const p = perp(a, b), o = (side * w) / 4, at = (t: number): V => [a[0] + (b[0] - a[0]) * t + p[0] * o, a[1] + (b[1] - a[1]) * t + p[1] * o]
  const s = at(from), e = at(to)
  return <line x1={s[0].toFixed(1)} y1={s[1].toFixed(1)} x2={e[0].toFixed(1)} y2={e[1].toFixed(1)} stroke={c} strokeWidth={side ? w / 2 : w * 0.62} strokeLinecap="round" />
}

export function Figure({ pose: q, props, primary, secondary }: { pose: Pose; props: Prop[]; primary: Muscle[]; secondary: Muscle[] }) {
  const col = (...ms: Muscle[]) => (ms.some((m) => primary.includes(m)) ? EMBER : ms.some((m) => secondary.includes(m)) ? AMBER : null)
  const armEl = (l: Limb, far: boolean) => (
    <g>
      <Seg a={l.root} b={l.joint} w={9.5} c={far ? FAR : SKIN} /><Seg a={l.joint} b={l.end} w={8} c={far ? FAR : SKIN} />
      {!far && <><Stripe a={l.root} b={l.joint} w={9.5} side={1} c={col('biceps')} /><Stripe a={l.root} b={l.joint} w={9.5} side={-1} c={col('triceps')} /><Stripe a={l.joint} b={l.end} w={8} side={0} c={col('forearms')} /></>}
      <circle cx={l.end[0].toFixed(1)} cy={l.end[1].toFixed(1)} r={4.2} fill={far ? FAR : SKIN} />
    </g>
  )
  const legEl = (l: Limb, toe: V, far: boolean) => (
    <g>
      <Seg a={l.root} b={l.joint} w={13} c={far ? FAR : SKIN} /><Seg a={l.joint} b={l.end} w={10} c={far ? FAR : SKIN} />
      {!far && <><Stripe a={l.root} b={l.joint} w={13} side={1} c={col('quadriceps')} /><Stripe a={l.root} b={l.joint} w={13} side={-1} c={col('hamstrings')} />
        {!col('quadriceps') && !col('hamstrings') && <Stripe a={l.root} b={l.joint} w={13} side={0} c={col('adductors', 'abductors')} />}
        <Stripe a={l.joint} b={l.end} w={10} side={-1} c={col('calves')} /></>}
      <Seg a={l.end} b={toe} w={7} c={far ? '#565c68' : '#9aa0ab'} />
    </g>
  )
  const hand = q.grip, sole: V = [(q.leg.end[0] + q.toe[0]) / 2, (q.leg.end[1] + q.toe[1]) / 2]
  const fore = perp(q.arm.joint, q.arm.end)
  const prop = (p: Prop, i: number, layer: 'back' | 'front') => {
    if (p.t === 'bench' && layer === 'back') { const h = p.h ?? FLOOR - p.y; return <g key={i}><rect x={p.x} y={p.y} width={p.w} height={7} rx={3} fill={GEAR} /><rect x={p.x + 5} y={p.y + 7} width={4} height={h - 7} fill={GEAR2} /><rect x={p.x + p.w - 9} y={p.y + 7} width={4} height={h - 7} fill={GEAR2} /></g> }
    if (p.t === 'line' && layer === 'back') return <polyline key={i} points={p.pts.map(P).join(' ')} fill="none" stroke={GEAR} strokeWidth={p.w ?? 5} strokeLinecap="round" strokeLinejoin="round" />
    if (p.t === 'plate' && layer === 'back') { const n = perp(q.leg.end, q.toe), c = add(sole, n, -5), d: V = [(q.toe[0] - q.leg.end[0]) / 13, (q.toe[1] - q.leg.end[1]) / 13]; return <g key={i}><Seg a={add(c, d, -p.len / 2)} b={add(c, d, p.len / 2)} w={5} c={GEAR} /><circle cx={add(c, n, -13)[0].toFixed(1)} cy={add(c, n, -13)[1].toFixed(1)} r={11} fill={GEAR2} stroke={GEAR} strokeWidth={2} /></g> }
    if (p.t === 'cable' && layer === 'back') { const e = p.to === 'foot' ? q.leg.end : hand; return <g key={i}><line x1={p.from[0]} y1={p.from[1]} x2={e[0].toFixed(1)} y2={e[1].toFixed(1)} stroke="#8a909c" strokeWidth={1.6} /><circle cx={p.from[0]} cy={p.from[1]} r={4} fill={GEAR2} stroke={GEAR} strokeWidth={1.5} /></g> }
    if (p.t === 'barbell' && layer === 'front') { const c = p.at === 'hand' ? hand : torsoPoint(p.at === 'shoulder' ? q.shoulder : q.pelvis, q.torso, p.off ?? [0, 0]), r = p.r ?? 13; return <g key={i}><circle cx={c[0].toFixed(1)} cy={c[1].toFixed(1)} r={r} fill={GEAR2} stroke={GEAR} strokeWidth={2.5} /><circle cx={c[0].toFixed(1)} cy={c[1].toFixed(1)} r={2.6} fill="#9aa0ab" /></g> }
    if (p.t === 'dumbbell' && layer === 'front') { const a = add(hand, fore, -8), b = add(hand, fore, 8); return <g key={i}><Seg a={a} b={b} w={3} c="#9aa0ab" /><circle cx={a[0].toFixed(1)} cy={a[1].toFixed(1)} r={4.6} fill={GEAR2} stroke={GEAR} strokeWidth={1.6} /><circle cx={b[0].toFixed(1)} cy={b[1].toFixed(1)} r={4.6} fill={GEAR2} stroke={GEAR} strokeWidth={1.6} /></g> }
    return null
  }
  const tp = perp(q.pelvis, q.shoulder) // en el torso (va hacia arriba) este vector apunta a la espalda
  const glute = add(q.pelvis, tp, 5)
  const neck = add(q.shoulder, [q.head[0] - q.shoulder[0], q.head[1] - q.shoulder[1]], 0.45)
  return (
    <svg viewBox="0 0 300 200" role="img" className="size-full">
      <rect width={300} height={200} fill="#171a1f" />
      <line x1={0} y1={FLOOR + 0.5} x2={300} y2={FLOOR + 0.5} stroke="#2c313a" strokeWidth={1} />
      {props.map((p, i) => prop(p, i, 'back'))}
      <g transform="translate(-4,-1)">{legEl(q.legFar, q.toeFar, true)}{armEl(q.armFar, true)}</g>
      <Seg a={q.pelvis} b={q.shoulder} w={21} c={SKIN} />
      <circle cx={glute[0].toFixed(1)} cy={glute[1].toFixed(1)} r={9} fill={col('glutes') ?? SKIN} />
      <Stripe a={q.pelvis} b={q.shoulder} w={21} side={-1} c={col('chest')} from={0.58} to={0.92} />
      <Stripe a={q.pelvis} b={q.shoulder} w={21} side={-1} c={col('abdominals')} from={0.08} to={0.5} />
      <Stripe a={q.pelvis} b={q.shoulder} w={21} side={1} c={col('lower back')} from={0.06} to={0.3} />
      <Stripe a={q.pelvis} b={q.shoulder} w={21} side={1} c={col('lats', 'middle back')} from={0.36} to={0.74} />
      <Stripe a={q.pelvis} b={q.shoulder} w={21} side={1} c={col('traps')} from={0.8} to={0.98} />
      <Seg a={q.shoulder} b={neck} w={7.5} c={SKIN} />
      <circle cx={q.head[0].toFixed(1)} cy={q.head[1].toFixed(1)} r={9} fill={SKIN} />
      {legEl(q.leg, q.toe, false)}
      {props.map((p, i) => prop(p, i, 'front'))}
      {armEl(q.arm, false)}
      {q.grip !== q.arm.end && <Seg a={q.arm.end} b={q.grip} w={6.5} c={SKIN} />}
      <circle cx={q.shoulder[0].toFixed(1)} cy={q.shoulder[1].toFixed(1)} r={6.4} fill={col('shoulders') ?? SKIN} />
    </svg>
  )
}
