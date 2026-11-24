import type { Goal } from '../lib/types'

export interface NutritionInput { weightKg?: number; heightCm?: number; age?: number; sex?: 'm' | 'f'; days: number; goal: Goal }
export interface Targets { bmr: number; tdee: number; kcal: number; protein: number; fat: number; carbs: number; waterMl: number; notes: string[] }

/**
 * Objetivos nutricionales orientativos. Gasto basal con Mifflin-St Jeor, factor de actividad según
 * días de entrenamiento y ajuste moderado por objetivo. Nunca propone menos que el gasto basal
 * ni déficits para menores de 18 años. Ver docs/SCIENTIFIC_REFERENCES.md.
 */
export function targets(p: NutritionInput): Targets | null {
  if (!p.weightKg || !p.heightCm || !p.age || p.weightKg < 30 || p.heightCm < 120 || p.age < 14) return null
  const notes: string[] = []
  // Sin sexo indicado se usa el punto medio de las dos constantes de la fórmula (+5 / −161).
  const k = p.sex === 'm' ? 5 : p.sex === 'f' ? -161 : -78
  if (!p.sex) notes.push('Sin sexo indicado se usa un valor intermedio de la fórmula; indicarlo mejora la estimación.')
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + k
  const factor = p.days <= 1 ? 1.2 : p.days <= 3 ? 1.375 : p.days <= 5 ? 1.55 : 1.725
  const tdee = bmr * factor
  let adj = ({ fatloss: -0.15, hypertrophy: 0.1, strength: 0.05 } as Partial<Record<Goal, number>>)[p.goal] ?? 0
  if (p.age < 18 && adj < 0) { adj = 0; notes.push('Para menores de 18 años no se proponen déficits calóricos; consulta a un profesional de la salud.') }
  let kcal = tdee * (1 + adj)
  if (kcal < bmr) { kcal = bmr; notes.push('El objetivo se ajustó para no quedar por debajo de tu gasto basal estimado.') }
  const perKg = p.goal === 'fatloss' ? 2 : ['hypertrophy', 'strength', 'recomp'].includes(p.goal) ? 1.6 : 1.2
  const protein = perKg * p.weightKg
  const fat = Math.max(0.8 * p.weightKg, (kcal * 0.2) / 9)
  const carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4)
  const r = (n: number, s = 1) => Math.round(n / s) * s
  return { bmr: r(bmr), tdee: r(tdee, 10), kcal: r(kcal, 10), protein: r(protein, 5), fat: r(fat, 5), carbs: r(carbs, 5), waterMl: r(Math.min(4000, Math.max(1500, 35 * p.weightKg)), 250), notes }
}

/** % de grasa corporal estimado (método de circunferencias de la Marina de EE. UU.). Error típico ±3–4 puntos. */
export function navyBodyFat(sex: 'm' | 'f', heightCm: number, neck: number, waist: number, hip?: number): number | null {
  const log = Math.log10
  let bf: number
  if (sex === 'm') { if (waist - neck <= 0) return null; bf = 495 / (1.0324 - 0.19077 * log(waist - neck) + 0.15456 * log(heightCm)) - 450 }
  else { if (!hip || waist + hip - neck <= 0) return null; bf = 495 / (1.29579 - 0.35004 * log(waist + hip - neck) + 0.221 * log(heightCm)) - 450 }
  return Number.isFinite(bf) && bf > 2 && bf < 60 ? Math.round(bf * 10) / 10 : null
}

export interface Food { name: string; kcal: number; p: number; c: number; f: number }
export const sumFoods = (foods: Food[]) => foods.reduce((a, x) => ({ kcal: a.kcal + x.kcal, p: a.p + x.p, c: a.c + x.c, f: a.f + x.f }), { kcal: 0, p: 0, c: 0, f: 0 })
/** Calorías a partir de macros (4/4/9), para rellenar cuando el usuario solo escribe gramos. */
export const kcalFromMacros = (p: number, c: number, f: number) => Math.round(p * 4 + c * 4 + f * 9)
