import { describe, expect, it } from 'vitest'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { MOVES } from '../src/anim/moves'
import { FLOOR, LEN, angleAt, dist, mix, phase, solve, type Limb } from '../src/anim/rig'
import { Figure } from '../src/anim/Figure'
import type { Exercise } from '../src/lib/types'

const catalog: Exercise[] = JSON.parse(readFileSync('public/data/exercises.json', 'utf8')).items
const by = new Map(catalog.map((x) => [x.id, x]))
const T = [0, 0.25, 0.5, 0.75, 1]
/** Ejercicios donde el apoyo del pie se desplaza o pivota por diseño. */
const MOVING_FEET = new Set(['Leg_Press'])

describe('animaciones esquemáticas', () => {
  it('cada animación corresponde a un ejercicio del catálogo', () => { for (const id of Object.keys(MOVES)) expect(by.has(id), id).toBe(true) })
  it.each(Object.keys(MOVES))('%s: huesos de largo constante, apoyos fijos y articulaciones dentro de rango', (id) => {
    const m = MOVES[id]
    const feet = T.map((t) => solve(mix(m.a, m.b, t)).leg.end)
    for (const t of T) {
      const q = solve(mix(m.a, m.b, t))
      const bone = (l: Limb, l1: number, l2: number) => { expect(dist(l.root, l.joint)).toBeCloseTo(l1, 1); expect(dist(l.joint, l.end)).toBeCloseTo(l2, 1) }
      bone(q.arm, LEN.uarm, LEN.farm); bone(q.armFar, LEN.uarm, LEN.farm); bone(q.leg, LEN.thigh, LEN.shin); bone(q.legFar, LEN.thigh, LEN.shin)
      expect(dist(q.pelvis, q.shoulder)).toBeCloseTo(LEN.torso, 1)
      // El pie llega al punto pedido (la postura es alcanzable, no se estira la pierna)
      const key = mix(m.a, m.b, t)
      expect(dist(q.leg.end, key.leg.foot), `pie t=${t}`).toBeLessThan(0.6)
      if (key.legFar) expect(dist(q.legFar.end, key.legFar.foot), `pie lejano t=${t}`).toBeLessThan(0.6)
      // Rangos articulares: rodilla y codo no se hiperextienden ni se cierran más de lo anatómico
      for (const [name, l] of [['rodilla', q.leg], ['rodilla lejana', q.legFar], ['codo', q.arm]] as const) { const a = angleAt(l); expect(a, `${name} t=${t}`).toBeGreaterThan(28); expect(a, `${name} t=${t}`).toBeLessThanOrEqual(180) }
      // Nada atraviesa el piso ni se sale del cuadro
      for (const p of [q.pelvis, q.shoulder, q.head, q.arm.joint, q.arm.end, q.leg.joint, q.leg.end, q.toe, q.legFar.joint, q.legFar.end, q.toeFar]) { expect(p[1]).toBeLessThanOrEqual(FLOOR + 1); expect(p[1]).toBeGreaterThan(8); expect(p[0]).toBeGreaterThan(8); expect(p[0]).toBeLessThan(292) }
    }
    // Pie de apoyo plantado: el tobillo no se mueve durante el recorrido
    if (!MOVING_FEET.has(id)) for (const f of feet) expect(dist(f, feet[0])).toBeLessThan(0.6)
  })
  it('recorridos con sentido biomecánico', () => {
    const at = (id: string, t: number) => solve(mix(MOVES[id].a, MOVES[id].b, t))
    expect(angleAt(at('Barbell_Squat', 1).leg)).toBeLessThan(95)            // sentadilla: rodilla ≤ ~90° abajo
    expect(at('Barbell_Squat', 1).leg.joint[0] - at('Barbell_Squat', 1).toe[0]).toBeLessThan(6) // rodilla no rebasa de más la punta
    expect(angleAt(at('Barbell_Curl', 1).arm)).toBeLessThan(45); expect(angleAt(at('Barbell_Curl', 0).arm)).toBeGreaterThan(165)
    expect(dist(at('Barbell_Curl', 0).arm.joint, at('Barbell_Curl', 1).arm.joint)).toBeLessThan(4)       // codo quieto en el curl
    expect(dist(at('Triceps_Pushdown', 0).arm.joint, at('Triceps_Pushdown', 1).arm.joint)).toBeLessThan(0.1)
    expect(angleAt(at('Triceps_Pushdown', 1).arm)).toBeGreaterThan(170)
    const thrust = at('Barbell_Hip_Thrust', 1); expect(Math.abs(thrust.pelvis[1] - thrust.shoulder[1])).toBeLessThan(6) // torso horizontal arriba
    expect(Math.abs(angleAt(thrust.leg) - 90)).toBeLessThan(15)                                             // rodilla ~90° en el hip thrust
    expect(at('Barbell_Glute_Bridge', 1).pelvis[1]).toBeLessThan(at('Barbell_Glute_Bridge', 0).pelvis[1] - 15)
    expect(Math.abs(angleAt(at('Dumbbell_Lunges', 1).leg) - 90)).toBeLessThan(15)                           // desplante: rodilla delantera ~90°
    expect(Math.abs(at('Dumbbell_Lunges', 1).leg.joint[0] - at('Dumbbell_Lunges', 1).leg.end[0])).toBeLessThan(8) // …y sobre el tobillo
    expect(Math.abs(angleAt(at('Leg_Press', 1).leg) - 90)).toBeLessThan(25); expect(angleAt(at('Leg_Press', 0).leg)).toBeLessThan(172) // sin bloquear
    expect(at('Seated_Cable_Rows', 1).arm.joint[0]).toBeLessThan(at('Seated_Cable_Rows', 1).shoulder[0])   // remo: codo detrás del hombro
    expect(dist(at('EZ-Bar_Skullcrusher', 0).arm.joint, at('EZ-Bar_Skullcrusher', 1).arm.joint)).toBeLessThan(5)
  })
  it('vaivén continuo entre 0 y 1', () => { expect(phase(0)).toBe(0); expect(phase(1.4)).toBe(1); for (let s = 0; s < 6; s += 0.05) { const v = phase(s); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1) } })
  it('genera los fotogramas SVG', () => {
    if (!process.env.ANIM_OUT) return
    mkdirSync(process.env.ANIM_OUT, { recursive: true })
    for (const id of Object.keys(MOVES)) for (let i = 0; i <= 16; i++) {
      const m = MOVES[id], ex = by.get(id)!
      writeFileSync(`${process.env.ANIM_OUT}/${id}_${String(i).padStart(2, '0')}.svg`, renderToStaticMarkup(<Figure pose={solve(mix(m.a, m.b, phase((i / 16) * 1.4)))} props={m.props} primary={ex.p} secondary={ex.s} />).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" '))
    }
  })
})
