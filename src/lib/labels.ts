import type { Equip, Goal, Muscle } from './types'

export const MUSCLE: Record<Muscle, string> = {
  abdominals: 'Abdomen', abductors: 'Abductores', adductors: 'Aductores', biceps: 'Bíceps', calves: 'Pantorrillas',
  chest: 'Pecho', forearms: 'Antebrazos', glutes: 'Glúteos', hamstrings: 'Isquiotibiales', lats: 'Dorsales',
  'lower back': 'Zona lumbar', 'middle back': 'Espalda media', neck: 'Cuello', quadriceps: 'Cuádriceps',
  shoulders: 'Hombros', traps: 'Trapecios', triceps: 'Tríceps',
}
export const MUSCLES = Object.keys(MUSCLE) as Muscle[]

export const EQUIP: Record<Equip, string> = {
  barbell: 'Barra olímpica', dumbbell: 'Mancuernas', cable: 'Poleas', machine: 'Máquinas / Smith', kettlebell: 'Kettlebells',
  band: 'Bandas elásticas', body: 'Peso corporal', ezbar: 'Barra EZ', medball: 'Balón medicinal', ball: 'Fitball',
  foam: 'Rodillo de espuma', other: 'Otro equipo',
}
export const EQUIPS = Object.keys(EQUIP) as Equip[]

export const GOAL: Record<Goal, string> = {
  hypertrophy: 'Ganar masa muscular', strength: 'Aumentar fuerza', fatloss: 'Reducir grasa corporal',
  fitness: 'Mejorar condición física', endurance: 'Mejorar resistencia', recomp: 'Recomposición corporal',
  mobility: 'Mejorar movilidad', maintain: 'Mantener condición física',
}
export const LEVEL = { 1: 'Principiante', 2: 'Intermedio', 3: 'Avanzado' } as const
export const CATEGORY: Record<string, string> = {
  strength: 'Fuerza', stretching: 'Estiramiento', plyometrics: 'Pliometría', powerlifting: 'Powerlifting',
  'olympic weightlifting': 'Halterofilia', strongman: 'Strongman', cardio: 'Cardio',
}
export const FORCE: Record<string, string> = { push: 'Empuje', pull: 'Tirón', static: 'Isométrico' }
export const MECH: Record<string, string> = { compound: 'Multiarticular', isolation: 'Aislamiento' }
