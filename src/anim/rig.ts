/**
 * Maniquí 2D de perfil animado por programa. Cada ejercicio se define con dos posturas clave
 * (inicio y final); las articulaciones se resuelven con cinemática directa (ángulos) o inversa
 * (pies y manos fijos a un punto), así los huesos nunca cambian de largo y los apoyos no resbalan.
 * Ángulos en grados: 0 = hacia abajo, 90 = hacia el frente (derecha), 180 = hacia arriba.
 */
export type V = [number, number]
export const LEN = { torso: 46, neck: 7, head: 9, uarm: 26, farm: 24, thigh: 38, shin: 36, foot: 13 }
export const FLOOR = 180

/** Brazo por ángulos (u = brazo, f = antebrazo) o por punto de la mano. Con `rel`, la mano va en el marco del torso: [hacia la espalda, hacia la cabeza] desde el hombro. */
export type Arm = { u: number; f: number } | { hand: V; side: 1 | -1; rel?: boolean }
export type Leg = { foot: V; side?: 1 | -1; toe?: number }
export interface Key {
  pelvis?: V            // posición de la cadera…
  shoulder?: V          // …o del hombro cuando la espalda alta está apoyada (puentes, hip thrust)
  torso: number         // dirección cadera → hombro
  head?: V              // posición fija de la cabeza (acostado)
  arm: Arm; armFar?: Arm
  leg: Leg; legFar?: Leg
}
export interface Limb { root: V; joint: V; end: V }
export interface Pose { torso: number; pelvis: V; shoulder: V; head: V; arm: Limb; armFar: Limb; leg: Limb; legFar: Limb; toe: V; toeFar: V }

export const dir = (deg: number): V => [Math.sin((deg * Math.PI) / 180), Math.cos((deg * Math.PI) / 180)]
export const add = (a: V, b: V, k = 1): V => [a[0] + b[0] * k, a[1] + b[1] * k]
export const dist = (a: V, b: V) => Math.hypot(a[0] - b[0], a[1] - b[1])
/** Lado anterior de un segmento que va de a → b (para una figura que mira a la derecha). */
export const perp = (a: V, b: V): V => { const d = dist(a, b) || 1; return [(b[1] - a[1]) / d, -(b[0] - a[0]) / d] }

/** Cinemática inversa de dos huesos: devuelve la articulación intermedia y el extremo alcanzado. */
export function ik2(a: V, target: V, l1: number, l2: number, side: 1 | -1): { joint: V; end: V } {
  let vx = target[0] - a[0], vy = target[1] - a[1]
  const raw = Math.hypot(vx, vy)
  if (raw < 1e-6) { vx = 0; vy = 1 } else { vx /= raw; vy /= raw }
  const d = Math.min(l1 + l2 - 0.5, Math.max(Math.abs(l1 - l2) + 0.5, raw))
  const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - x * x))
  return { joint: [a[0] + vx * x + vy * h * side, a[1] + vy * x - vx * h * side], end: [a[0] + vx * d, a[1] + vy * d] }
}

function lerp(a: any, b: any, t: number): any {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t
  if (Array.isArray(a)) return a.map((x, i) => lerp(x, b[i], t))
  if (a && typeof a === 'object') return Object.fromEntries(Object.keys(a).map((k) => [k, lerp(a[k], b?.[k] ?? a[k], t)]))
  return a
}
export const mix = (a: Key, b: Key, t: number): Key => lerp(a, b, t)

/** Punto en el marco del torso: `back` hacia la espalda, `up` hacia la cabeza. Gira con la inclinación del tronco. */
export function torsoPoint(origin: V, torso: number, [back, up]: V): V {
  const d = dir(torso), b: V = [d[1], -d[0]]
  return [origin[0] + b[0] * back + d[0] * up, origin[1] + b[1] * back + d[1] * up]
}
function arm(shoulder: V, a: Arm, torso: number): Limb {
  if ('u' in a) { const joint = add(shoulder, dir(a.u), LEN.uarm); return { root: shoulder, joint, end: add(joint, dir(a.f), LEN.farm) } }
  const r = ik2(shoulder, a.rel ? torsoPoint(shoulder, torso, a.hand) : a.hand, LEN.uarm, LEN.farm, a.side)
  return { root: shoulder, ...r }
}
function leg(hip: V, l: Leg): Limb & { toe: V } {
  const r = ik2(hip, l.foot, LEN.thigh, LEN.shin, l.side ?? 1)
  return { root: hip, ...r, toe: add(r.end, dir(l.toe ?? 90), LEN.foot) }
}

export function solve(k: Key): Pose {
  const d = dir(k.torso)
  const pelvis: V = k.pelvis ?? add(k.shoulder!, d, -LEN.torso)
  const shoulder: V = k.shoulder && !k.pelvis ? k.shoulder : add(pelvis, d, LEN.torso)
  const head: V = k.head ?? add(shoulder, d, LEN.neck + LEN.head)
  const l = leg(pelvis, k.leg), lf = leg(pelvis, k.legFar ?? k.leg)
  return { torso: k.torso, pelvis, shoulder, head, arm: arm(shoulder, k.arm, k.torso), armFar: arm(shoulder, k.armFar ?? k.arm, k.torso), leg: l, legFar: lf, toe: l.toe, toeFar: lf.toe }
}

/** Ángulo interior de una articulación (180 = extendida). */
export function angleAt(p: Limb) {
  const a: V = [p.root[0] - p.joint[0], p.root[1] - p.joint[1]], b: V = [p.end[0] - p.joint[0], p.end[1] - p.joint[1]]
  return (Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) / ((Math.hypot(...a) || 1) * (Math.hypot(...b) || 1))))) * 180) / Math.PI
}
/** Vaivén suave 0 → 1 → 0, con pausa breve en los extremos. */
export function phase(seconds: number, period = 2.8) {
  const x = (seconds % period) / period, tri = x < 0.5 ? x * 2 : 2 - x * 2
  const c = Math.min(1, Math.max(0, (tri - 0.06) / 0.88))
  return c * c * (3 - 2 * c)
}
