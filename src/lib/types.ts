export type Muscle =
  | 'abdominals' | 'abductors' | 'adductors' | 'biceps' | 'calves' | 'chest' | 'forearms' | 'glutes'
  | 'hamstrings' | 'lats' | 'lower back' | 'middle back' | 'neck' | 'quadriceps' | 'shoulders' | 'traps' | 'triceps'
export type Equip = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'kettlebell' | 'band' | 'body' | 'ezbar' | 'medball' | 'ball' | 'foam' | 'other'
export type Goal = 'hypertrophy' | 'strength' | 'fatloss' | 'fitness' | 'endurance' | 'recomp' | 'mobility' | 'maintain'
export type Level = 1 | 2 | 3

export interface Exercise {
  id: string; n: string; e: string; eq: Equip; lv: Level
  f: string; m: string; c: string; p: Muscle[]; s: Muscle[]; g: number; tr: 0 | 1
}

export interface Profile {
  id: 'me'
  name: string
  age?: number; heightCm?: number; weightKg?: number
  level: Level
  goal: Goal
  days: number        // 2–6
  minutes: number     // por sesión
  equipment: Equip[]
  priority: Muscle[]
  limitations: string // texto libre, voluntario
  sex?: 'm' | 'f'     // opcional; solo afina las fórmulas de gasto calórico y composición
  units: 'kg' | 'lb'
  theme: 'dark' | 'light'
  restSound: boolean
  createdAt: number
}

export interface RoutineItem { exId: string; sets: number; repMin: number; repMax: number; rest: number; rir: number }
export interface RoutineDay { name: string; items: RoutineItem[] }
export interface Routine {
  id: string; name: string; split: string; days: RoutineDay[]
  fav: boolean; createdAt: number; updatedAt: number; nextDay: number; generated: boolean
}

export interface SetLog { w: number | null; r: number | null; rir: number | null; done: boolean; warm?: boolean }
export interface SessionItem { exId: string; target: Omit<RoutineItem, 'exId'>; sets: SetLog[]; note: string }
export interface Session {
  id: string; routineId: string | null; dayName: string
  start: number; end: number | null; pausedMs: number; pausedAt: number | null
  status: 'active' | 'done'; items: SessionItem[]; note: string
}
export interface BodyEntry { id: string; date: string; weightKg: number }

export interface FoodEntry { name: string; kcal: number; p: number; c: number; f: number }
/** Registro diario; `id` es la fecha local AAAA-MM-DD. */
export interface DayLog { id: string; foods: FoodEntry[]; waterMl: number; sleepH: number | null; energy: number | null; recovery: number | null }
/** Medidas en centímetros. */
export interface Measure { id: string; date: string; neck?: number; chest?: number; waist?: number; hip?: number; arm?: number; thigh?: number; calf?: number }
/** Foto de progreso: se guarda solo en este dispositivo y nunca se sincroniza. */
export interface Photo { id: string; date: string; blob: Blob }
