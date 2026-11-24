import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { e1rm, plates, PLATES_KG, kgToLb, lbToKg } from '../src/engine/calc'
import { prescribe } from '../src/engine/prescription'
import { suggest, increment } from '../src/engine/overload'
import { SLOTS, generateRoutine, alternatives, splitFor } from '../src/engine/generator'
import { imbalances, muscleSets, personalRecords, recoveryPct, toCSV, sessionVolume } from '../src/engine/analytics'
import type { Equip, Exercise, Session, SetLog } from '../src/lib/types'

const catalog: Exercise[] = JSON.parse(readFileSync('public/data/exercises.json', 'utf8')).items
const instr: Record<string, string[]> = JSON.parse(readFileSync('public/data/instructions.json', 'utf8'))
const by = new Map(catalog.map((x) => [x.id, x]))
const set = (w: number, r: number, rir: number | null = 2): SetLog => ({ w, r, rir, done: true })
const ALL: Equip[] = ['barbell', 'dumbbell', 'cable', 'machine', 'kettlebell', 'band', 'body', 'ezbar', 'medball', 'ball', 'foam', 'other']

describe('catálogo', () => {
  it('tiene ids únicos, músculo principal e instrucciones', () => {
    expect(catalog.length).toBeGreaterThan(800)
    expect(new Set(catalog.map((x) => x.id)).size).toBe(catalog.length)
    for (const x of catalog) { expect(x.p.length).toBeGreaterThan(0); expect(instr[x.id]?.length ?? 0, x.id).toBeGreaterThan(0) }
  })
  it('todos los candidatos del generador existen en el catálogo', () => {
    const missing = Object.values(SLOTS).flat().filter((id) => !by.has(id))
    expect(missing).toEqual([])
  })
})

describe('cálculos', () => {
  it('1RM Epley', () => { expect(e1rm(100, 1)).toBe(100); expect(e1rm(100, 10)).toBeCloseTo(133.33, 1); expect(e1rm(0, 5)).toBe(0) })
  it('discos por lado', () => {
    expect(plates(100, 20, PLATES_KG)).toEqual({ perSide: [25, 15], total: 100, exact: true })
    expect(plates(20, 20, PLATES_KG).perSide).toEqual([])
    expect(plates(101, 20, PLATES_KG).exact).toBe(false)
  })
  it('conversión kg/lb reversible', () => { expect(lbToKg(kgToLb(80))).toBeCloseTo(80, 6); expect(kgToLb(100)).toBeCloseTo(220.46, 2) })
})

describe('prescripción', () => {
  it('fuerza usa repeticiones bajas y descansos largos', () => { const r = prescribe('strength', 2, true); expect(r.repMax).toBeLessThanOrEqual(6); expect(r.rest).toBeGreaterThanOrEqual(150) })
  it('principiantes: sin cargas máximas y lejos del fallo', () => { const r = prescribe('strength', 1, true); expect(r.repMin).toBeGreaterThanOrEqual(5); expect(r.rir).toBeGreaterThanOrEqual(3); expect(r.sets).toBeLessThanOrEqual(3) })
  it('resistencia usa repeticiones altas', () => { expect(prescribe('endurance', 2, false).repMin).toBeGreaterThanOrEqual(12) })
})

describe('sobrecarga progresiva', () => {
  const t = { sets: 3, repMin: 8, repMax: 12, rir: 2 }
  it('sin historial no inventa peso', () => { const s = suggest([], t, 2.5); expect(s.action).toBe('start'); expect(s.weight).toBeNull() })
  it('sube carga al completar el tope del rango con margen', () => { const s = suggest([{ sets: [set(60, 12), set(60, 12), set(60, 12)] }], t, 2.5); expect(s.action).toBe('increase'); expect(s.weight).toBe(62.5) })
  it('mantiene si llegó al tope pero al fallo', () => { expect(suggest([{ sets: [set(60, 12, 0), set(60, 12, 0), set(60, 12, 0)] }], t, 2.5).action).toBe('hold') })
  it('mantiene mientras faltan repeticiones', () => { const s = suggest([{ sets: [set(60, 12), set(60, 10), set(60, 9)] }], t, 2.5); expect(s.action).toBe('hold'); expect(s.weight).toBe(60) })
  it('reduce tras dos sesiones bajo el rango', () => { const low = { sets: [set(70, 6), set(70, 5), set(70, 5)] }; expect(suggest([low, low], t, 2.5).action).toBe('reduce') })
  it('propone descarga con tres sesiones a la baja', () => {
    const s = suggest([{ sets: [set(60, 8)] }, { sets: [set(60, 10)] }, { sets: [set(60, 11)] }], t, 2.5); expect(s.action).toBe('deload')
  })
  it('ignora series de calentamiento y no completadas', () => {
    const s = suggest([{ sets: [{ w: 20, r: 15, rir: null, done: true, warm: true }, set(60, 12), set(60, 12), set(60, 12), { w: 60, r: 3, rir: null, done: false }] }], t, 2.5)
    expect(s.action).toBe('increase')
  })
  it('incrementos según equipo', () => { expect(increment('barbell', 'kg', true)).toBe(5); expect(increment('barbell', 'kg', false)).toBe(2.5); expect(increment('dumbbell', 'lb', false)).toBe(5) })
})

describe('generador de rutinas', () => {
  const base = { goal: 'hypertrophy' as const, level: 2 as const, minutes: 60, equipment: ALL, priority: [] }
  it.each([2, 3, 4, 5, 6])('%i días: días completos, sin duplicados y con equipo válido', (days) => {
    const r = generateRoutine({ ...base, days }, catalog, 1)
    expect(r.days.length).toBe(days)
    for (const d of r.days) {
      expect(d.items.length).toBeGreaterThanOrEqual(3)
      expect(new Set(d.items.map((i) => i.exId)).size).toBe(d.items.length)
      for (const i of d.items) expect(by.has(i.exId)).toBe(true)
    }
  })
  it('es determinista', () => { expect(generateRoutine({ ...base, days: 4 }, catalog, 1)).toEqual(generateRoutine({ ...base, days: 4 }, catalog, 1)) })
  it('respeta el equipo disponible (solo peso corporal y bandas)', () => {
    const r = generateRoutine({ ...base, days: 3, equipment: ['body', 'band'] }, catalog, 1)
    for (const d of r.days) { expect(d.items.length).toBeGreaterThanOrEqual(3); for (const i of d.items) expect(['body', 'band']).toContain(by.get(i.exId)!.eq) }
  })
  it('sesiones cortas tienen menos ejercicios', () => {
    const short = generateRoutine({ ...base, days: 3, minutes: 30 }, catalog, 1), long = generateRoutine({ ...base, days: 3, minutes: 90 }, catalog, 1)
    expect(short.days[0].items.length).toBeLessThan(long.days[0].items.length)
  })
  it('principiantes no reciben ejercicios avanzados', () => {
    const r = generateRoutine({ ...base, level: 1, days: 3 }, catalog, 1)
    for (const d of r.days) for (const i of d.items) expect(by.get(i.exId)!.lv).toBe(1)
  })
  it('músculo prioritario añade volumen', () => {
    const a = generateRoutine({ ...base, days: 4, minutes: 90 }, catalog, 1), b = generateRoutine({ ...base, days: 4, minutes: 90, priority: ['biceps'] }, catalog, 1)
    const count = (r: typeof a) => r.days.flatMap((d) => d.items).filter((i) => by.get(i.exId)!.p[0] === 'biceps').length
    expect(count(b)).toBeGreaterThan(count(a))
  })
  it('splits con nombre', () => { expect(splitFor(4).split).toBe('Torso / Pierna'); expect(splitFor(9).days.length).toBe(6) })
  it('alternativas: mismo músculo, otro ejercicio, equipo disponible', () => {
    const ex = by.get('Barbell_Bench_Press_-_Medium_Grip')!
    const alts = alternatives(ex, catalog, ['dumbbell', 'body'], new Set())
    expect(alts.length).toBeGreaterThan(0)
    for (const a of alts) { expect(a.p[0]).toBe('chest'); expect(['dumbbell', 'body']).toContain(a.eq); expect(a.id).not.toBe(ex.id) }
  })
})

describe('analítica', () => {
  const s: Session = { id: 's', routineId: null, dayName: 'Día "A"', start: 1_700_000_000_000, end: 1_700_003_600_000, pausedMs: 0, pausedAt: null, status: 'done', note: '',
    items: [{ exId: 'Barbell_Bench_Press_-_Medium_Grip', target: { sets: 3, repMin: 6, repMax: 10, rest: 120, rir: 2 }, note: '', sets: [{ w: 40, r: 10, rir: null, done: true, warm: true }, set(80, 8), set(80, 7), { w: 80, r: 6, rir: 1, done: false }] }] }
  it('volumen ignora calentamiento y series sin completar', () => { expect(sessionVolume(s)).toBe(80 * 8 + 80 * 7) })
  it('series por músculo: principal 1, secundario 0.5', () => { const v = muscleSets([s], (id) => by.get(id)); expect(v.chest).toBe(2); expect(v.triceps).toBe(1) })
  it('récord por mejor 1RM estimado', () => { const pr = personalRecords([s]).get('Barbell_Bench_Press_-_Medium_Grip')!; expect(pr.weight).toBe(80); expect(pr.reps).toBe(8) })
  it('recuperación acotada 0–100', () => { expect(recoveryPct(0, 6)).toBe(0); expect(recoveryPct(500, 6)).toBe(100); expect(recoveryPct(24, 3)).toBe(50) })
  it('alerta de desequilibrio', () => { expect(imbalances({ chest: 20, shoulders: 10, lats: 5 }).length).toBe(1); expect(imbalances({ chest: 10, lats: 9, 'middle back': 4 }).length).toBe(0) })
  it('CSV escapa comillas', () => { const csv = toCSV([s], (id) => by.get(id), 'kg'); expect(csv.split('\n').length).toBe(4); expect(csv).toContain('"Día ""A"""') })
})
