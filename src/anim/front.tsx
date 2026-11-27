/**
 * Maniquí visto de frente (o desde arriba cuando está acostado). Cubre los movimientos que ocurren
 * hacia los lados y que la vista de perfil no puede mostrar: elevaciones laterales, aperturas,
 * cruces de poleas, encogimientos, inclinaciones laterales, aductores/abductores.
 * Ángulos de brazos y piernas: 0 = abajo, 90 = hacia afuera, 180 = arriba (cada lado es espejo del otro).
 * `k` acorta un segmento cuando apunta hacia quien mira (escorzo); negativo = apunta hacia adentro.
 */
import type { Exercise, Muscle } from '../lib/types'
import { FLOOR, LEN, ik2, type V } from './rig'

export interface FLimb { u: number; f: number; ku?: number; kf?: number }
export type FLeg = FLimb | { foot: V }                // foot = [distancia al centro, y]
export interface FKey {
  hip: V; lean?: number; shrug?: number
  arm: FLimb; armL?: FLimb                            // arm = lado derecho de la imagen; armL = izquierdo (por defecto, espejo)
  leg: FLeg; legL?: FLeg
  rel?: boolean                                       // los brazos giran con la inclinación del tronco
}
export type FProp =
  | { t: 'dumbbells'; side?: 1 | -1 }                 // en ambas manos o solo en una
  | { t: 'center' }                                   // una mancuerna sujeta con las dos manos
  | { t: 'bar'; at: 'hands' | 'shoulders' }
  | { t: 'cables'; from: V; side?: 1 | -1; to?: 'ankle' } // from = polea que va a la mano derecha de la imagen; la otra es espejo
  | { t: 'band' }                                     // banda entre las manos
  | { t: 'rect'; x: number; y: number; w: number; h: number }
  | { t: 'posts'; x: number; top: number }            // dos postes simétricos
export interface FrontMove { view: 'frente' | 'arriba'; a: FKey; b: FKey; props: FProp[]; cue: string }
export interface FL { root: V; joint: V; end: V }
export interface FPose { hip: V; chest: V; head: V; up: V; sh: [FL, FL]; lg: [FL, FL] }

export const SHOULDER_W = 17, HIP_W = 9
const rad = (d: number) => (d * Math.PI) / 180

function limb(root: V, l: FLimb, s: 1 | -1, l1: number, l2: number, rot = 0): FL {
  const d = (deg: number, len: number): V => [s * Math.sin(rad(deg + s * rot)) * len, Math.cos(rad(deg + s * rot)) * len]
  const a = d(l.u, l1 * (l.ku ?? 1)), joint: V = [root[0] + a[0], root[1] + a[1]]
  const b = d(l.f, l2 * (l.kf ?? 1))
  return { root, joint, end: [joint[0] + b[0], joint[1] + b[1]] }
}
export function solveFront(k: FKey): FPose {
  const lean = k.lean ?? 0, up: V = [Math.sin(rad(lean)), -Math.cos(rad(lean))], right: V = [-up[1], up[0]]
  const chest: V = [k.hip[0] + up[0] * LEN.torso, k.hip[1] + up[1] * LEN.torso]
  const head: V = [chest[0] + up[0] * (LEN.neck + LEN.head), chest[1] + up[1] * (LEN.neck + LEN.head)]
  const sh = (s: 1 | -1): V => [chest[0] + right[0] * SHOULDER_W * s + up[0] * (k.shrug ?? 0), chest[1] + right[1] * SHOULDER_W * s + up[1] * (k.shrug ?? 0)]
  const leg = (l: FLeg, s: 1 | -1): FL => {
    const root: V = [k.hip[0] + HIP_W * s, k.hip[1]]
    if ('foot' in l) return { root, ...ik2(root, [150 + s * l.foot[0], l.foot[1]], LEN.thigh, LEN.shin, s) }
    return limb(root, l, s, LEN.thigh, LEN.shin)
  }
  // En el brazo, `rot` con signo del lado hace que ambos giren en el mismo sentido que el tronco.
  const arm = (l: FLimb, s: 1 | -1) => limb(sh(s), l, s, LEN.uarm, LEN.farm, k.rel ? -lean : 0)
  return { hip: k.hip, chest, head, up, sh: [arm(k.arm, 1), arm(k.armL ?? k.arm, -1)], lg: [leg(k.leg, 1), leg(k.legL ?? k.leg, -1)] }
}

const full = (l: FLimb): Required<FLimb> => ({ ku: 1, kf: 1, ...l })
const fullLeg = (l: FLeg): FLeg => ('foot' in l ? l : full(l))
const norm = (k: FKey) => ({ hip: k.hip, lean: k.lean ?? 0, shrug: k.shrug ?? 0, rel: k.rel, arm: full(k.arm), armL: full(k.armL ?? k.arm), leg: fullLeg(k.leg), legL: fullLeg(k.legL ?? k.leg) })
function lerp(a: any, b: any, t: number): any {
  if (typeof a === 'number') return a + (b - a) * t
  if (Array.isArray(a)) return a.map((x, i) => lerp(x, b[i], t))
  if (a && typeof a === 'object') return Object.fromEntries(Object.keys(a).map((k) => [k, lerp(a[k], b[k], t)]))
  return a
}
/** Postura intermedia; completa los valores por defecto para que escorzo, inclinación y encogimiento también se interpolen. */
export const mixFront = (a: FKey, b: FKey, t: number): FKey => lerp(norm(a), norm(b), t)

const SKIN = '#cfd3da', EMBER = '#ff6a33', AMBER = '#f5b83d', GEAR = '#7c8390', GEAR2 = '#3b414d', SHADE = '#b3b8c2'
const n1 = (x: number) => x.toFixed(1)
const Seg = ({ a, b, w, c }: { a: V; b: V; w: number; c: string }) => <line x1={n1(a[0])} y1={n1(a[1])} x2={n1(b[0])} y2={n1(b[1])} stroke={c} strokeWidth={w} strokeLinecap="round" />
const Dot = ({ p, r, c, s }: { p: V; r: number; c: string; s?: string }) => <circle cx={n1(p[0])} cy={n1(p[1])} r={r} fill={c} stroke={s} strokeWidth={s ? 1.6 : undefined} />
const at = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

export function FigureFront({ pose: q, move, primary, secondary }: { pose: FPose; move: FrontMove; primary: Muscle[]; secondary: Muscle[] }) {
  const col = (...ms: Muscle[]) => (ms.some((m) => primary.includes(m)) ? EMBER : ms.some((m) => secondary.includes(m)) ? AMBER : null)
  const top = move.view === 'arriba'
  const right: V = [-q.up[1], q.up[0]]
  const T = (side: number, upK: number): V => [q.hip[0] + right[0] * side + q.up[0] * LEN.torso * upK, q.hip[1] + right[1] * side + q.up[1] * LEN.torso * upK]
  const mirror = (v: V): V => [300 - v[0], v[1]]
  const stripe = (a: V, b: V, w: number, c: string | null, f = 0.15, t = 0.85) => c && <Seg a={at(a, b, f)} b={at(a, b, t)} w={w} c={c} />
  const prop = (p: FProp, i: number, layer: 'back' | 'front') => {
    const hands: V[] = [q.sh[0].end, q.sh[1].end]
    if (layer === 'back') {
      if (p.t === 'rect') return <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={5} fill={GEAR2} stroke={GEAR} strokeWidth={1.5} />
      if (p.t === 'posts') return <g key={i}>{[p.x, 300 - p.x].map((x) => <line key={x} x1={x} y1={FLOOR - 2} x2={x} y2={p.top} stroke={GEAR} strokeWidth={5} strokeLinecap="round" />)}</g>
      if (p.t === 'cables') return <g key={i}>{([1, -1] as const).filter((s) => !p.side || p.side === s).map((s) => {
        const from = s === 1 ? p.from : mirror(p.from), to = p.to === 'ankle' ? q.lg[s === 1 ? 0 : 1].end : hands[s === 1 ? 0 : 1]
        return <g key={s}><line x1={from[0]} y1={from[1]} x2={n1(to[0])} y2={n1(to[1])} stroke="#8a909c" strokeWidth={1.6} /><Dot p={from} r={4} c={GEAR2} s={GEAR} /></g>
      })}</g>
      return null
    }
    if (p.t === 'dumbbells') return <g key={i}>{([0, 1] as const).filter((j) => !p.side || (p.side === 1) === (j === 0)).map((j) => {
      const l = q.sh[j], d: V = [l.end[0] - l.joint[0], l.end[1] - l.joint[1]], m = Math.hypot(d[0], d[1]) || 1, n: V = Math.abs(m) < 3 ? [1, 0] : [-d[1] / m, d[0] / m]
      const a: V = [l.end[0] - n[0] * 8, l.end[1] - n[1] * 8], b: V = [l.end[0] + n[0] * 8, l.end[1] + n[1] * 8]
      return <g key={j}><Seg a={a} b={b} w={3} c="#9aa0ab" /><Dot p={a} r={4.6} c={GEAR2} s={GEAR} /><Dot p={b} r={4.6} c={GEAR2} s={GEAR} /></g>
    })}</g>
    if (p.t === 'center') { const c = at(hands[0], hands[1], 0.5); return <g key={i}><Seg a={[c[0], c[1] - 3]} b={[c[0], c[1] + 12]} w={3} c="#9aa0ab" /><Dot p={[c[0], c[1] + 14]} r={7} c={GEAR2} s={GEAR} /></g> }
    if (p.t === 'band') return <line key={i} x1={n1(hands[1][0])} y1={n1(hands[1][1])} x2={n1(hands[0][0])} y2={n1(hands[0][1])} stroke={AMBER} strokeOpacity={0.55} strokeWidth={2.4} />
    if (p.t === 'bar') {
      const c = p.at === 'hands' ? at(hands[0], hands[1], 0.5) : T(0, 1.04), half = 62
      const a: V = [c[0] - right[0] * half, c[1] - right[1] * half], b: V = [c[0] + right[0] * half, c[1] + right[1] * half]
      return <g key={i}><Seg a={a} b={b} w={3.2} c="#9aa0ab" />{[a, b].map((e, j) => <Seg key={j} a={[e[0] - q.up[0] * 11, e[1] - q.up[1] * 11]} b={[e[0] + q.up[0] * 11, e[1] + q.up[1] * 11]} w={6} c={GEAR} />)}</g>
    }
    return null
  }
  const barBehind = move.props.some((p) => p.t === 'bar' && p.at === 'shoulders')
  const arm = (l: FL) => (
    <g>
      <Seg a={l.root} b={l.joint} w={9.5} c={SKIN} /><Seg a={l.joint} b={l.end} w={8} c={SKIN} />
      {stripe(l.root, l.joint, 5, col('biceps', 'triceps'))}{stripe(l.joint, l.end, 4.5, col('forearms'))}
      <Dot p={l.end} r={4.2} c={SKIN} />
    </g>
  )
  const leg = (l: FL, s: 1 | -1) => {
    const inner = (p: V): V => [p[0] - s * 3.2, p[1]], outer = (p: V): V => [p[0] + s * 1.5, p[1]]
    return (
      <g>
        <Seg a={l.root} b={l.joint} w={13} c={SKIN} /><Seg a={l.joint} b={l.end} w={10} c={SKIN} />
        {stripe(outer(l.root), outer(l.joint), 6, col('quadriceps'), 0.2, 0.85)}
        {stripe(inner(l.root), inner(l.joint), 5, col('adductors'), 0.12, 0.7)}
        {stripe(l.joint, l.end, 5, col('calves'), 0.1, 0.6)}
        {!top && <ellipse cx={n1(l.end[0] + s * 2)} cy={n1(l.end[1] + 2)} rx={6.5} ry={3.6} fill="#9aa0ab" />}
      </g>
    )
  }
  const chest = col('chest'), abs = col('abdominals'), lats = col('lats', 'middle back'), traps = col('traps'), delt = col('shoulders'), abd = col('abductors', 'glutes')
  const neck = at(q.chest, q.head, 0.4)
  return (
    <svg viewBox="0 0 300 200" role="img" className="size-full">
      <rect width={300} height={200} fill="#171a1f" />
      {!top && <line x1={0} y1={FLOOR + 0.5} x2={300} y2={FLOOR + 0.5} stroke="#2c313a" strokeWidth={1} />}
      {move.props.map((p, i) => prop(p, i, 'back'))}
      {barBehind && move.props.map((p, i) => prop(p, i, 'front'))}
      {leg(q.lg[1], -1)}{leg(q.lg[0], 1)}
      <polygon points={[T(-SHOULDER_W + 1, 1), T(SHOULDER_W - 1, 1), T(HIP_W + 3, 0), T(-HIP_W - 3, 0)].map((v) => `${n1(v[0])},${n1(v[1])}`).join(' ')} fill={SKIN} stroke={SKIN} strokeWidth={10} strokeLinejoin="round" />
      {abd && <><Dot p={T(HIP_W + 6, 0)} r={5} c={abd} /><Dot p={T(-HIP_W - 6, 0)} r={5} c={abd} /></>}
      {lats && <><Seg a={T(SHOULDER_W - 1, 0.78)} b={T(HIP_W + 4, 0.38)} w={5} c={lats} /><Seg a={T(-SHOULDER_W + 1, 0.78)} b={T(-HIP_W - 4, 0.38)} w={5} c={lats} /></>}
      {chest && <><Seg a={T(3.5, 0.84)} b={T(13, 0.86)} w={9} c={chest} /><Seg a={T(-3.5, 0.84)} b={T(-13, 0.86)} w={9} c={chest} /></>}
      {abs && <Seg a={T(0, 0.12)} b={T(0, 0.58)} w={10} c={abs} />}
      {!chest && !abs && !lats && <Seg a={T(0, 0.2)} b={T(0, 0.9)} w={1.2} c={SHADE} />}
      {traps && <><Seg a={at(q.chest, neck, 0.9)} b={q.sh[0].root} w={5.5} c={traps} /><Seg a={at(q.chest, neck, 0.9)} b={q.sh[1].root} w={5.5} c={traps} /></>}
      <Seg a={q.chest} b={neck} w={7.5} c={SKIN} />
      <Dot p={q.head} r={9} c={SKIN} />
      {arm(q.sh[1])}{arm(q.sh[0])}
      <Dot p={q.sh[0].root} r={6.4} c={delt ?? SKIN} /><Dot p={q.sh[1].root} r={6.4} c={delt ?? SKIN} />
      {!barBehind && move.props.map((p, i) => prop(p, i, 'front'))}
    </svg>
  )
}

/* ───────────── Plantillas ───────────── */
const HIP: V = [150, 103], HIP_SEAT: V = [150, 128]
const standLeg: FLimb = { u: 4, f: 1 }
const seatLeg: FLimb = { u: 10, f: 1, ku: 0.3 }
const hang: FLimb = { u: 5, f: 4 }
const onHip: FLimb = { u: 32, f: -38 }
const bench: FProp = { t: 'rect', x: 120, y: 131, w: 60, h: 9 }
const HIP_TOP: V = [150, 125]                          // acostado, visto desde arriba (cabeza hacia arriba de la imagen)
const topLeg: FLimb = { u: 6, f: 3, kf: 0.3 }
const pad: FProp = { t: 'rect', x: 133, y: 52, w: 34, h: 84 }
const inHands = (x: Exercise, n: string, pulley?: V): FProp[] =>
  x.eq === 'dumbbell' || x.eq === 'kettlebell' ? [{ t: 'dumbbells' }] : (x.eq === 'cable' || x.eq === 'band') && pulley ? [{ t: 'cables', from: pulley }] : /barbell|smith/.test(n) || x.eq === 'barbell' ? [{ t: 'bar', at: 'hands' }] : []

type FBuild = (x: Exercise, n: string) => FrontMove
const F: Record<string, FBuild> = {
  lateralRaise: (x, n) => {
    const s = /seated/.test(n), one = /one-arm|low-pulley|single/.test(n), base = { hip: s ? HIP_SEAT : HIP, leg: s ? seatLeg : standLeg }
    const up: FLimb = { u: 86, f: 82 }, rest = one ? onHip : undefined
    const props: FProp[] = x.eq === 'band' ? [{ t: 'cables', from: [158, 177] }] : x.eq === 'cable' ? [{ t: 'cables', from: [60, 172], side: 1 }] : one ? [{ t: 'dumbbells', side: 1 }] : [{ t: 'dumbbells' }]
    return { view: 'frente', cue: 'Sube los brazos por los lados hasta la altura de los hombros, con los codos apenas flexionados; baja lento.',
      a: { ...base, arm: hang, armL: rest ?? hang }, b: { ...base, arm: up, armL: rest ?? up }, props: [...(s ? [bench] : []), ...props] }
  },
  shrug: (x, n) => ({ view: 'frente', cue: 'Brazos rectos; sube los hombros hacia las orejas en línea vertical, pausa arriba y baja sin girarlos.',
    a: { hip: HIP, arm: hang, leg: standLeg, shrug: 0 }, b: { hip: HIP, arm: hang, leg: standLeg, shrug: 9 }, props: x.eq === 'cable' ? [{ t: 'cables', from: [164, 177] }] : inHands(x, n) }),
  flye: (x, n) => ({ view: 'arriba', cue: 'Abre los brazos en arco con los codos ligeramente flexionados hasta sentir el estiramiento del pecho; cierra como si abrazaras.',
    a: { hip: HIP_TOP, arm: { u: 92, f: 96 }, leg: topLeg }, b: { hip: HIP_TOP, arm: { u: 90, f: 90, ku: 0.2, kf: -0.75 }, leg: topLeg }, props: [pad, ...inHands(x, n, [248, 92])] }),
  aroundWorld: () => ({ view: 'arriba', cue: 'Acostado, lleva las mancuernas en semicírculo desde la cadera hasta arriba de la cabeza, con los brazos casi rectos y paralelos al piso.',
    a: { hip: HIP_TOP, arm: { u: 14, f: 12 }, leg: topLeg }, b: { hip: HIP_TOP, arm: { u: 166, f: 168 }, leg: topLeg }, props: [pad, { t: 'dumbbells' }] }),
  rearFlyeProne: (x, n) => ({ view: 'arriba', cue: 'Boca abajo, abre los brazos hacia los lados juntando las escápulas; los codos apenas flexionados y sin impulso.',
    a: { hip: HIP_TOP, arm: { u: 90, f: 90, ku: 0.18, kf: 0.12 }, leg: topLeg }, b: { hip: HIP_TOP, arm: { u: 92, f: 94 }, leg: topLeg }, props: [pad, ...inHands(x, n)] }),
  crossover: (x, n) => {
    const low = /low/.test(n), posts: FProp = { t: 'posts', x: 52, top: 14 }
    return low
      ? { view: 'frente', cue: 'Desde las poleas bajas, sube y junta las manos frente al pecho en arco, con los codos fijos y ligeramente flexionados.',
          a: { hip: HIP, arm: { u: 38, f: 42 }, leg: standLeg }, b: { hip: HIP, arm: { u: 78, f: 90, ku: 0.55, kf: -0.9 }, leg: standLeg }, props: [posts, { t: 'cables', from: [248, 170] }] }
      : { view: 'frente', cue: 'Torso apenas inclinado; lleva las manos en arco hacia abajo y al frente hasta juntarlas, sin cambiar la flexión del codo.',
          a: { hip: HIP, arm: { u: 104, f: 110 }, leg: standLeg }, b: { hip: HIP, arm: { u: 25, f: -55 }, leg: standLeg }, props: [posts, { t: 'cables', from: [248, 18] }] }
  },
  ironCross: () => ({ view: 'frente', cue: 'Brazos rectos en cruz; baja las manos por los lados hasta la cadera sin doblar los codos y regresa con control.',
    a: { hip: HIP, arm: { u: 98, f: 100 }, leg: standLeg }, b: { hip: HIP, arm: { u: 14, f: 12 }, leg: standLeg }, props: [{ t: 'posts', x: 52, top: 14 }, { t: 'cables', from: [248, 18] }] }),
  pecDeck: () => ({ view: 'frente', cue: 'Espalda pegada al respaldo; junta los codos al frente apretando el pecho y abre con control sin pasar la línea de los hombros.',
    a: { hip: HIP_SEAT, arm: { u: 92, f: 180 }, leg: seatLeg }, b: { hip: HIP_SEAT, arm: { u: 90, f: 180, ku: 0.16 }, leg: seatLeg }, props: [bench] }),
  pullApart: (x, n) => {
    const s = /machine/.test(n), props: FProp[] = x.eq === 'band' ? [{ t: 'band' }] : x.eq === 'cable' ? [{ t: 'posts', x: 52, top: 30 }, { t: 'cables', from: [52, 44] }] : []
    return { view: 'frente', cue: 'Brazos a la altura de los hombros; ábrelos hacia atrás juntando las escápulas, sin encoger los hombros.',
      a: { hip: s ? HIP_SEAT : HIP, arm: { u: 90, f: 90, ku: 0.14, kf: 0.1 }, leg: s ? seatLeg : standLeg }, b: { hip: s ? HIP_SEAT : HIP, arm: { u: 91, f: 93 }, leg: s ? seatLeg : standLeg }, props: [...(s ? [bench] : []), ...props] }
  },
  sideBend: (x, n) => {
    const bar = /barbell/.test(n), legs: FLimb = { u: 7, f: 2 }
    return bar
      ? { view: 'frente', cue: 'Barra sobre los hombros y cadera quieta; inclina el tronco hacia un lado y al otro sin girar ni irte al frente.',
          a: { hip: HIP, lean: -15, rel: true, arm: { u: 62, f: 212 }, leg: legs }, b: { hip: HIP, lean: 15, rel: true, arm: { u: 62, f: 212 }, leg: legs }, props: [{ t: 'bar', at: 'shoulders' }] }
      : { view: 'frente', cue: 'Mancuerna en una mano; inclínate hacia ese lado solo desde la cintura y sube contrayendo el costado contrario.',
          a: { hip: HIP, lean: 17, arm: { u: 3, f: 2 }, armL: onHip, leg: legs }, b: { hip: HIP, lean: -7, arm: { u: 3, f: 2 }, armL: onHip, leg: legs }, props: [{ t: 'dumbbells', side: 1 }] }
  },
  plieSquat: () => ({ view: 'frente', cue: 'Pies anchos con las puntas hacia afuera; baja en vertical con las rodillas siguiendo la dirección de los pies.',
    a: { hip: [150, 108], arm: { u: -9, f: -12 }, leg: { foot: [35, 176] } }, b: { hip: [150, 138], arm: { u: -9, f: -12 }, leg: { foot: [35, 176] } }, props: [{ t: 'center' }] }),
  hipAbduction: () => ({ view: 'frente', cue: 'Sentado con la espalda apoyada; separa las rodillas contra la resistencia y regresa sin dejar caer el peso.',
    a: { hip: HIP_SEAT, arm: { u: 14, f: 2 }, leg: { u: 8, f: 0, ku: 0.45, kf: 0.9 } }, b: { hip: HIP_SEAT, arm: { u: 14, f: 2 }, leg: { u: 52, f: 0, ku: 0.62, kf: 0.9 } }, props: [bench] }),
  hipAdduction: () => ({ view: 'frente', cue: 'Sentado con la espalda apoyada; junta las rodillas apretando la cara interna del muslo y abre con control.',
    a: { hip: HIP_SEAT, arm: { u: 14, f: 2 }, leg: { u: 52, f: 0, ku: 0.62, kf: 0.9 } }, b: { hip: HIP_SEAT, arm: { u: 14, f: 2 }, leg: { u: 8, f: 0, ku: 0.45, kf: 0.9 } }, props: [bench] }),
  standingAdduction: (x) => ({ view: 'frente', cue: 'De pie sobre una pierna; lleva la otra hacia el centro cruzando por delante, sin inclinar el tronco.',
    a: { hip: HIP, arm: onHip, leg: { u: 34, f: 32 }, legL: standLeg }, b: { hip: HIP, arm: onHip, leg: { u: -10, f: -12 }, legL: standLeg },
    props: [{ t: 'cables', from: [250, x.eq === 'band' ? 150 : 172], side: 1, to: 'ankle' }] }),
  highCableCurl: () => ({ view: 'frente', cue: 'Brazos en cruz a la altura de los hombros; flexiona solo los codos llevando las manos hacia la cabeza.',
    a: { hip: HIP, arm: { u: 96, f: 98 }, leg: standLeg }, b: { hip: HIP, arm: { u: 96, f: 228 }, leg: standLeg }, props: [{ t: 'posts', x: 44, top: 26 }, { t: 'cables', from: [252, 40] }] }),
}

/** Asignación conservadora de la vista frontal, por nombre en inglés del catálogo. */
export function frontFor(x: Exercise): string | null {
  if (x.c !== 'strength' && x.c !== 'powerlifting') return null
  const n = x.e.toLowerCase(), p = x.p[0]
  if (p === 'shoulders') {
    if (/^(seated |cable seated )?side lateral raise$|^lateral raise - with bands$|^one-arm side laterals$|^standing low-pulley deltoid raise$|^power partials$/.test(n)) return 'lateralRaise'
    if (/^band pull apart$|^back flyes - with bands$|^reverse machine flyes$|^cable rear delt fly$/.test(n)) return 'pullApart'
    if (/^reverse flyes$|^lying rear delt raise$|^dumbbell lying rear lateral raise$/.test(n)) return 'rearFlyeProne'
  }
  if (p === 'traps' && /shrugs?( |$)/.test(n) && !/scapular|calf-machine|middle back/.test(n)) return 'shrug'
  if (p === 'chest') {
    if (/^(incline |decline )?dumbbell flyes( - with a twist)?$|^flat bench cable flyes$|^incline cable flye$/.test(n)) return 'flye'
    if (/^around the worlds$/.test(n)) return 'aroundWorld'
    if (/^(low )?cable crossover$|^cross over - with bands$/.test(n)) return 'crossover'
    if (/^cable iron cross$/.test(n)) return 'ironCross'
    if (/^butterfly$/.test(n)) return 'pecDeck'
  }
  if (p === 'abdominals' && /^(dumbbell|barbell) side bend$/.test(n)) return 'sideBend'
  if (/^plie dumbbell squat$/.test(n)) return 'plieSquat'
  if (/^thigh abductor$/.test(n)) return 'hipAbduction'
  if (/^thigh adductor$/.test(n)) return 'hipAdduction'
  if (/^cable hip adduction$|^band hip adductions$/.test(n)) return 'standingAdduction'
  if (p === 'biceps' && /^high cable curls$|^overhead cable curl$/.test(n)) return 'highCableCurl'
  return null
}
const cache = new Map<string, FrontMove | null>()
export function buildFront(x: Exercise): FrontMove | null {
  if (!cache.has(x.id)) { const t = frontFor(x); cache.set(x.id, t ? F[t](x, x.e.toLowerCase()) : null) }
  return cache.get(x.id)!
}
export const FRONT_NAMES = Object.keys(F)
