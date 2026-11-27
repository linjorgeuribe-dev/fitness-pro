import { describe, expect, it } from 'vitest'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { MOVES, type Move } from '../src/anim/moves'
import { buildMove, templateFor, TEMPLATE_NAMES } from '../src/anim/templates'
import { FLOOR, LEN, angleAt, dist, mix, phase, solve, type Limb } from '../src/anim/rig'
import { Figure } from '../src/anim/Figure'
import type { Exercise } from '../src/lib/types'

const catalog: Exercise[] = JSON.parse(readFileSync('public/data/exercises.json', 'utf8')).items
const by = new Map(catalog.map((x) => [x.id, x]))
const T = [0, 0.25, 0.5, 0.75, 1]
/** Todas las animaciones del catálogo: las afinadas a mano y las que salen de plantillas, sin repetir las idénticas. */
const ALL = new Map<string, { move: Move; ids: string[] }>()
for (const x of catalog) { const m = MOVES[x.id] ?? buildMove(x); if (!m) continue; const k = JSON.stringify(m); ALL.has(k) ? ALL.get(k)!.ids.push(x.id) : ALL.set(k, { move: m, ids: [x.id] }) }
const CASES = [...ALL.values()].map((v) => [v.ids[0], v.move, v.ids.length] as const)

describe('animaciones esquemáticas', () => {
  it('cada animación corresponde a un ejercicio del catálogo', () => { for (const id of Object.keys(MOVES)) expect(by.has(id), id).toBe(true) })
  it('cobertura: cada plantilla se usa y la asignación es estable', () => {
    const used = new Set(catalog.map(templateFor).filter(Boolean))
    for (const t of TEMPLATE_NAMES) expect(used.has(t), t).toBe(true)
    const n = catalog.filter((x) => MOVES[x.id] ?? buildMove(x)).length
    expect(n).toBeGreaterThanOrEqual(260)
    // Lo que no es fuerza (estiramientos, pliometría, cardio, halterofilia, strongman) nunca recibe animación
    for (const x of catalog) if (x.c !== 'strength' && x.c !== 'powerlifting') expect(buildMove(x), x.id).toBeNull()
    // Casos que NO deben confundirse con su plantilla vecina
    const t = (id: string) => templateFor(by.get(id)!)
    expect(t('Side_Lateral_Raise')).toBeNull(); expect(t('Dumbbell_Flyes')).toBeNull(); expect(t('Cable_Crossover')).toBeNull()
    expect(t('Leg_Press')).toBe('legPress'); expect(t('Calf_Press_On_The_Leg_Press_Machine')).toBeNull()
    expect(t('Romanian_Deadlift')).toBe('hinge'); expect(t('Barbell_Deadlift')).toBe('deadlift'); expect(t('Kettlebell_One-Legged_Deadlift')).toBeNull()
    expect(t('Incline_Dumbbell_Press')).toBe('bench'); expect(t('Dumbbell_Shoulder_Press')).toBe('overheadPress'); expect(t('Seated_Triceps_Press')).toBe('overheadTriceps')
    expect(t('Wide-Grip_Lat_Pulldown')).toBe('pulldown'); expect(t('Straight-Arm_Pulldown')).toBe('straightArmPulldown'); expect(t('Pullups')).toBe('pullup')
    expect(t('Preacher_Curl')).toBe('preacherCurl'); expect(t('Lying_Leg_Curls')).toBe('legCurlLying'); expect(t('Palms-Up_Barbell_Wrist_Curl_Over_A_Bench')).toBeNull()
    expect(t('Smith_Machine_Bench_Press')).toBe('bench'); expect(t('Smith_Machine_Squat')).toBe('squat'); expect(t('Seated_Band_Hamstring_Curl')).toBe('legCurlSeated'); expect(t('Front_Squat_Clean_Grip')).toBe('squatFront'); expect(t('Power_Clean')).toBeNull()
    expect(t('Pushups')).toBe('pushup'); expect(t('Handstand_Push-Ups')).toBeNull(); expect(t('Crunches')).toBe('crunch'); expect(t('Cable_Crunch')).toBeNull()
  })
  it.each(CASES)('%s: huesos de largo constante, apoyos fijos y articulaciones dentro de rango', (id, m) => {
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
      // Si la mano va a un punto fijo (barra, agarre), el brazo lo alcanza sin estirarse
      if ('hand' in key.arm && !key.arm.rel) expect(dist(q.arm.end, key.arm.hand), `mano t=${t}`).toBeLessThan(0.8)
      // Rangos articulares: rodilla y codo no se hiperextienden ni se cierran más de lo anatómico
      for (const [name, l] of [['rodilla', q.leg], ['rodilla lejana', q.legFar], ['codo', q.arm]] as const) { const a = angleAt(l); expect(a, `${name} t=${t}`).toBeGreaterThan(28); expect(a, `${name} t=${t}`).toBeLessThanOrEqual(180) }
      // Nada atraviesa el piso ni se sale del cuadro
      for (const p of [q.pelvis, q.shoulder, q.head, q.arm.joint, q.arm.end, q.leg.joint, q.leg.end, q.toe, q.legFar.joint, q.legFar.end, q.toeFar]) { expect(p[1]).toBeLessThanOrEqual(FLOOR + 1); expect(p[1]).toBeGreaterThan(8); expect(p[0]).toBeGreaterThan(8); expect(p[0]).toBeLessThan(292) }
    }
    // Pie de apoyo plantado: el tobillo no se mueve durante el recorrido
    if (!m.freeFeet) for (const f of feet) expect(dist(f, feet[0])).toBeLessThan(0.6)
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
    const list = process.env.ANIM_ALL ? [...new Map(catalog.filter((x) => MOVES[x.id] ?? buildMove(x)).map((x) => [MOVES[x.id] ? x.id : templateFor(x)!, x.id])).values()] : Object.keys(MOVES)
    for (const id of list) for (let i = 0; i <= 16; i += process.env.ANIM_ALL ? 8 : 1) {
      const ex = by.get(id)!, m = MOVES[id] ?? buildMove(ex)!
      writeFileSync(`${process.env.ANIM_OUT}/${id}_${String(i).padStart(2, '0')}.svg`, renderToStaticMarkup(<Figure pose={solve(mix(m.a, m.b, phase((i / 16) * 1.4)))} props={m.props} primary={ex.p} secondary={ex.s} />).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" '))
    }
  })
})
