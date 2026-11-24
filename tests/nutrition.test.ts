import { describe, expect, it } from 'vitest'
import { kcalFromMacros, navyBodyFat, sumFoods, targets } from '../src/engine/nutrition'

const base = { weightKg: 80, heightCm: 180, age: 30, sex: 'm' as const, days: 4, goal: 'maintain' as const }
describe('objetivos nutricionales', () => {
  it('Mifflin-St Jeor y factor de actividad', () => { const t = targets(base)!; expect(t.bmr).toBe(1780); expect(t.tdee).toBe(2760); expect(t.kcal).toBe(2760) })
  it('sin datos suficientes no inventa', () => { expect(targets({ ...base, weightKg: undefined })).toBeNull(); expect(targets({ ...base, age: undefined })).toBeNull() })
  it('déficit moderado y más proteína para perder grasa', () => { const t = targets({ ...base, goal: 'fatloss' })!; expect(t.kcal).toBe(2350); expect(t.protein).toBe(160) })
  it('superávit moderado para ganar músculo', () => { const t = targets({ ...base, goal: 'hypertrophy' })!; expect(t.kcal).toBe(3030); expect(t.protein).toBe(130) })
  it('nunca por debajo del gasto basal', () => { const t = targets({ ...base, days: 1, goal: 'fatloss' })!; expect(t.kcal).toBeGreaterThanOrEqual(t.bmr) })
  it('menores de 18: sin déficit', () => { const t = targets({ ...base, age: 16, goal: 'fatloss' })!; expect(t.kcal).toBe(t.tdee); expect(t.notes.join(' ')).toMatch(/menores de 18/) })
  it('los macros suman aproximadamente las calorías', () => { const t = targets({ ...base, goal: 'hypertrophy' })!; expect(Math.abs(kcalFromMacros(t.protein, t.carbs, t.fat) - t.kcal)).toBeLessThan(60) })
  it('sin sexo usa valor intermedio y lo avisa', () => { const t = targets({ ...base, sex: undefined })!; expect(t.bmr).toBe(1697); expect(t.notes.length).toBe(1) })
  it('agua acotada', () => { expect(targets({ ...base, weightKg: 200 })!.waterMl).toBe(4000); expect(targets({ ...base, weightKg: 35 })!.waterMl).toBe(1500) })
})
describe('composición corporal estimada', () => {
  it('hombre: valores de referencia', () => { expect(navyBodyFat('m', 180, 38, 85)).toBe(16.1) })
  it('mujer requiere cadera', () => { expect(navyBodyFat('f', 165, 32, 70)).toBeNull(); const v = navyBodyFat('f', 165, 32, 70, 96)!; expect(v).toBeGreaterThan(18); expect(v).toBeLessThan(30) })
  it('medidas imposibles devuelven null', () => { expect(navyBodyFat('m', 180, 90, 80)).toBeNull() })
})
it('suma de alimentos', () => { expect(sumFoods([{ name: 'a', kcal: 100, p: 10, c: 5, f: 2 }, { name: 'b', kcal: 50, p: 1, c: 10, f: 0 }])).toEqual({ kcal: 150, p: 11, c: 15, f: 2 }) })
