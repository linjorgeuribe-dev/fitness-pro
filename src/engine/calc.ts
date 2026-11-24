export const KG_PER_LB = 0.45359237
export const kgToLb = (kg: number) => kg / KG_PER_LB
export const lbToKg = (lb: number) => lb * KG_PER_LB
export const round = (n: number, step = 0.5) => Math.round(n / step) * step

/** 1RM estimado (Epley). Es una estimación; pierde precisión por encima de ~10 repeticiones. */
export function e1rm(weight: number, reps: number) {
  if (!weight || !reps || reps < 1) return 0
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

export interface PlateResult { perSide: number[]; total: number; exact: boolean }
/** Discos por lado para llegar al peso objetivo con la barra indicada. */
export function plates(target: number, bar: number, available: number[]): PlateResult {
  let side = (target - bar) / 2
  const perSide: number[] = []
  if (side > 0) for (const p of [...available].sort((a, b) => b - a)) while (side >= p - 1e-9) { perSide.push(p); side -= p }
  const total = bar + 2 * perSide.reduce((a, b) => a + b, 0)
  return { perSide, total, exact: Math.abs(total - target) < 1e-6 }
}
export const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25]
export const PLATES_LB = [45, 35, 25, 10, 5, 2.5]
