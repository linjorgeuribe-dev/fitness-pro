import type { Equip, Exercise, Muscle, Profile, Routine, RoutineDay, RoutineItem } from '../lib/types'
import { minutesFor, prescribe } from './prescription'

/** Patrón de movimiento → candidatos en orden de preferencia (ids del catálogo). */
export const SLOTS = {
  squat: ['Barbell_Squat', 'Leg_Press', 'Hack_Squat', 'Smith_Machine_Squat', 'Goblet_Squat', 'Dumbbell_Squat', 'Squats_-_With_Bands', 'Bodyweight_Squat'],
  hinge: ['Romanian_Deadlift', 'Barbell_Deadlift', 'Stiff-Legged_Dumbbell_Deadlift', 'Lying_Leg_Curls', 'Seated_Leg_Curl', 'Pull_Through', 'Kettlebell_One-Legged_Deadlift', 'Ball_Leg_Curl', 'Butt_Lift_Bridge'],
  lunge: ['Dumbbell_Lunges', 'Split_Squat_with_Dumbbells', 'Barbell_Lunge', 'Dumbbell_Step_Ups', 'Smith_Single-Leg_Split_Squat', 'Bodyweight_Walking_Lunge'],
  quadIso: ['Leg_Extensions', 'Single-Leg_Leg_Extension', 'Goblet_Squat', 'Bodyweight_Squat'],
  hamIso: ['Lying_Leg_Curls', 'Seated_Leg_Curl', 'Standing_Leg_Curl', 'Ball_Leg_Curl', 'Seated_Band_Hamstring_Curl', 'Stiff-Legged_Dumbbell_Deadlift'],
  glute: ['Barbell_Hip_Thrust', 'Barbell_Glute_Bridge', 'Pull_Through', 'One-Legged_Cable_Kickback', 'Glute_Kickback', 'Single_Leg_Glute_Bridge', 'Butt_Lift_Bridge'],
  calf: ['Standing_Calf_Raises', 'Seated_Calf_Raise', 'Calf_Press_On_The_Leg_Press_Machine', 'Standing_Dumbbell_Calf_Raise', 'Standing_Barbell_Calf_Raise', 'Calf_Raises_-_With_Bands', 'Calf_Raise_On_A_Dumbbell'],
  hPush: ['Barbell_Bench_Press_-_Medium_Grip', 'Dumbbell_Bench_Press', 'Machine_Bench_Press', 'Leverage_Chest_Press', 'Smith_Machine_Bench_Press', 'Cable_Chest_Press', 'Pushups', 'Bench_Press_-_With_Bands'],
  inclinePush: ['Incline_Dumbbell_Press', 'Barbell_Incline_Bench_Press_-_Medium_Grip', 'Leverage_Incline_Chest_Press', 'Smith_Machine_Incline_Bench_Press', 'Incline_Cable_Chest_Press', 'Decline_Push-Up'],
  chestIso: ['Cable_Crossover', 'Butterfly', 'Dumbbell_Flyes', 'Incline_Dumbbell_Flyes', 'Cross_Over_-_With_Bands', 'Push-Up_Wide'],
  vPush: ['Dumbbell_Shoulder_Press', 'Barbell_Shoulder_Press', 'Machine_Shoulder_Military_Press', 'Leverage_Shoulder_Press', 'Smith_Machine_Overhead_Shoulder_Press', 'Cable_Shoulder_Press', 'Shoulder_Press_-_With_Bands', 'Kettlebell_Seated_Press', 'Decline_Push-Up'],
  latRaise: ['Side_Lateral_Raise', 'Standing_Low-Pulley_Deltoid_Raise', 'Cable_Seated_Lateral_Raise', 'Lateral_Raise_-_With_Bands', 'Seated_Side_Lateral_Raise'],
  rearDelt: ['Face_Pull', 'Reverse_Machine_Flyes', 'Reverse_Flyes', 'Cable_Rear_Delt_Fly', 'Seated_Bent-Over_Rear_Delt_Raise', 'Band_Pull_Apart', 'Back_Flyes_-_With_Bands'],
  vPull: ['Wide-Grip_Lat_Pulldown', 'Pullups', 'Close-Grip_Front_Lat_Pulldown', 'Chin-Up', 'V-Bar_Pulldown', 'Band_Assisted_Pull-Up', 'Underhand_Cable_Pulldowns', 'Straight-Arm_Pulldown'],
  hPull: ['Seated_Cable_Rows', 'Bent_Over_Barbell_Row', 'One-Arm_Dumbbell_Row', 'Leverage_Iso_Row', 'T-Bar_Row_with_Handle', 'Bent_Over_Two-Dumbbell_Row', 'Dumbbell_Incline_Row', 'Inverted_Row', 'Two-Arm_Kettlebell_Row', 'Suspended_Row'],
  biceps: ['Barbell_Curl', 'Dumbbell_Bicep_Curl', 'EZ-Bar_Curl', 'Hammer_Curls', 'Standing_Biceps_Cable_Curl', 'Machine_Bicep_Curl', 'Incline_Dumbbell_Curl', 'Preacher_Curl', 'Chin-Up'],
  triceps: ['Triceps_Pushdown_-_Rope_Attachment', 'Triceps_Pushdown', 'EZ-Bar_Skullcrusher', 'Standing_Dumbbell_Triceps_Extension', 'Machine_Triceps_Extension', 'Dips_-_Triceps_Version', 'Bench_Dips', 'Push-Ups_-_Close_Triceps_Position', 'Band_Skull_Crusher'],
  core: ['Plank', 'Cable_Crunch', 'Crunches', 'Reverse_Crunch', 'Dead_Bug', 'Flat_Bench_Lying_Leg_Raise', 'Pallof_Press', 'Russian_Twist', 'Ab_Crunch_Machine'],
  lowBack: ['Hyperextensions_Back_Extensions', 'Hyperextensions_With_No_Hyperextension_Bench', 'Stiff_Leg_Barbell_Good_Morning'],
  traps: ['Dumbbell_Shrug', 'Barbell_Shrug', 'Cable_Shrugs', 'Leverage_Shrug'],
  forearms: ['Palms-Up_Barbell_Wrist_Curl_Over_A_Bench', 'Seated_Dumbbell_Palms-Up_Wrist_Curl', 'Cable_Wrist_Curl', 'Wrist_Roller'],
} as const
export type Slot = keyof typeof SLOTS

const PRIORITY_SLOT: Partial<Record<Muscle, Slot>> = {
  chest: 'chestIso', shoulders: 'latRaise', lats: 'vPull', 'middle back': 'hPull', biceps: 'biceps', triceps: 'triceps',
  quadriceps: 'quadIso', hamstrings: 'hamIso', glutes: 'glute', calves: 'calf', abdominals: 'core', traps: 'traps',
  forearms: 'forearms', 'lower back': 'lowBack',
}

type Day = { name: string; slots: Slot[] }
const FULL_A: Slot[] = ['squat', 'hPush', 'hPull', 'hinge', 'vPush', 'core', 'biceps', 'triceps']
const FULL_B: Slot[] = ['hinge', 'vPush', 'vPull', 'lunge', 'inclinePush', 'core', 'latRaise', 'calf']
const FULL_C: Slot[] = ['squat', 'inclinePush', 'vPull', 'glute', 'hPull', 'rearDelt', 'triceps', 'biceps']
const UPPER_A: Slot[] = ['hPush', 'hPull', 'vPush', 'vPull', 'latRaise', 'triceps', 'biceps', 'rearDelt']
const UPPER_B: Slot[] = ['inclinePush', 'vPull', 'hPull', 'chestIso', 'rearDelt', 'biceps', 'triceps', 'latRaise']
const LOWER_A: Slot[] = ['squat', 'hinge', 'lunge', 'hamIso', 'calf', 'core', 'quadIso']
const LOWER_B: Slot[] = ['hinge', 'squat', 'glute', 'quadIso', 'hamIso', 'calf', 'core']
const PUSH: Slot[] = ['hPush', 'vPush', 'inclinePush', 'latRaise', 'triceps', 'chestIso', 'triceps']
const PULL: Slot[] = ['vPull', 'hPull', 'rearDelt', 'biceps', 'hPull', 'traps', 'biceps']
const LEGS: Slot[] = ['squat', 'hinge', 'lunge', 'quadIso', 'hamIso', 'calf', 'core']

export function splitFor(days: number): { split: string; days: Day[] } {
  switch (Math.max(2, Math.min(6, days))) {
    case 2: return { split: 'Full Body', days: [{ name: 'Cuerpo completo A', slots: FULL_A }, { name: 'Cuerpo completo B', slots: FULL_B }] }
    case 3: return { split: 'Full Body', days: [{ name: 'Cuerpo completo A', slots: FULL_A }, { name: 'Cuerpo completo B', slots: FULL_B }, { name: 'Cuerpo completo C', slots: FULL_C }] }
    case 4: return { split: 'Torso / Pierna', days: [{ name: 'Torso A', slots: UPPER_A }, { name: 'Pierna A', slots: LOWER_A }, { name: 'Torso B', slots: UPPER_B }, { name: 'Pierna B', slots: LOWER_B }] }
    case 5: return { split: 'Push / Pull / Legs + Torso / Pierna', days: [{ name: 'Empuje', slots: PUSH }, { name: 'Tirón', slots: PULL }, { name: 'Pierna', slots: LEGS }, { name: 'Torso', slots: UPPER_B }, { name: 'Pierna B', slots: LOWER_B }] }
    default: return { split: 'Push / Pull / Legs ×2', days: [{ name: 'Empuje A', slots: PUSH }, { name: 'Tirón A', slots: PULL }, { name: 'Pierna A', slots: LEGS }, { name: 'Empuje B', slots: ['inclinePush', 'vPush', 'hPush', 'chestIso', 'latRaise', 'triceps'] }, { name: 'Tirón B', slots: ['hPull', 'vPull', 'rearDelt', 'biceps', 'traps', 'forearms'] }, { name: 'Pierna B', slots: LOWER_B }] }
  }
}

/** Primer candidato del patrón que el usuario puede hacer con su equipo y nivel, sin repetir. */
export function pick(slot: Slot, by: Map<string, Exercise>, equipment: Equip[], level: number, used: Set<string>, skip = 0): Exercise | null {
  const ok = SLOTS[slot].map((id) => by.get(id)).filter((x): x is Exercise => !!x && equipment.includes(x.eq) && x.lv <= Math.max(level, 1) + (level === 1 ? 0 : 1) && !used.has(x.id))
  return ok.length ? ok[skip % ok.length] : null
}

export type GenInput = Pick<Profile, 'goal' | 'level' | 'days' | 'minutes' | 'equipment' | 'priority'>

/**
 * Generador por reglas, determinista y sin IA: elige el reparto según los días, llena cada día
 * con patrones de movimiento usando el equipo disponible y recorta por el tiempo de la sesión.
 */
export function generateRoutine(p: GenInput, catalog: Exercise[], now = Date.now(), id = 'gen-' + now): Routine {
  const by = new Map(catalog.map((x) => [x.id, x]))
  const plan = splitFor(p.days)
  const days: RoutineDay[] = plan.days.map((d, di) => {
    const used = new Set<string>(); const items: RoutineItem[] = []
    let budget = p.minutes - 5 // calentamiento general
    const slots = [...d.slots]
    // Músculos prioritarios: un ejercicio extra en los días donde ya se trabaja esa zona
    for (const m of p.priority) { const s = PRIORITY_SLOT[m]; if (s && d.slots.includes(s)) slots.splice(Math.min(4, slots.length), 0, s) }
    for (const slot of slots) {
      const ex = pick(slot, by, p.equipment, p.level, used, di > 2 ? 1 : 0)
      if (!ex) continue
      const rx = prescribe(p.goal, p.level, ex.m === 'compound')
      const cost = minutesFor(rx)
      if (budget - cost < 0 && items.length >= 3) break
      used.add(ex.id); budget -= cost; items.push({ exId: ex.id, ...rx })
    }
    return { name: d.name, items }
  })
  return { id, name: `${plan.split} · ${p.days} días`, split: plan.split, days, fav: false, createdAt: now, updatedAt: now, nextDay: 0, generated: true }
}

/** Alternativas para sustituir un ejercicio (máquina ocupada): mismo músculo principal y mecánica, con el equipo disponible. */
export function alternatives(ex: Exercise, catalog: Exercise[], equipment: Equip[], exclude: Set<string>, limit = 8) {
  return catalog
    .filter((x) => x.id !== ex.id && !exclude.has(x.id) && x.c === ex.c && x.p[0] === ex.p[0] && equipment.includes(x.eq) && x.lv <= 2)
    .map((x) => ({ x, score: (x.m === ex.m ? 2 : 0) + (x.f === ex.f ? 1 : 0) + (x.eq !== ex.eq ? 0.5 : 0) + (x.lv === 1 ? 0.25 : 0) }))
    .sort((a, b) => b.score - a.score).slice(0, limit).map((a) => a.x)
}
