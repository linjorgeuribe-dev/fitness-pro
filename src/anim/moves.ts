import type { Key, V } from './rig'

export type Prop =
  | { t: 'barbell'; at: 'hand' | 'shoulder' | 'pelvis'; off?: V; r?: number } // off en el marco del torso: [espalda, cabeza]
  | { t: 'dumbbell'; at: 'hand' }
  | { t: 'cable'; from: V }
  | { t: 'plate'; len: number }                       // plataforma que sigue a la planta del pie (prensa)
  | { t: 'bench'; x: number; y: number; w: number; h?: number }
  | { t: 'line'; pts: V[]; w?: number }
export interface Move { a: Key; b: Key; props: Prop[]; cue: string }

const STAND: V = [150, 103], FEET: V = [152, 175]
const hang = { u: 3, f: 6 }

/**
 * Posturas definidas a mano por ejercicio. `a` = inicio, `b` = final del recorrido.
 * Son esquemas del patrón de movimiento, no una medición: pendientes de revisión por un entrenador.
 */
export const MOVES: Record<string, Move> = {
  Barbell_Squat: {
    cue: 'Cadera atrás y abajo; rodillas siguen la punta del pie; espalda neutra.',
    a: { pelvis: [148, 103], torso: 174, arm: { hand: [13, 3], side: 1, rel: true }, leg: { foot: FEET } },
    b: { pelvis: [127, 143], torso: 146, arm: { hand: [13, 3], side: 1, rel: true }, leg: { foot: FEET } },
    props: [{ t: 'barbell', at: 'shoulder', off: [9, 1] }],
  },
  Leg_Press: {
    cue: 'Baja la plataforma con control hasta ~90° de rodilla; empuja sin bloquear las rodillas.',
    a: { pelvis: [95, 150], torso: 228, arm: { hand: [104, 156], side: -1 }, leg: { foot: [149, 106], toe: 222 } },
    b: { pelvis: [95, 150], torso: 228, arm: { hand: [104, 156], side: -1 }, leg: { foot: [131, 121], toe: 222 } },
    props: [{ t: 'line', pts: [[108, 163], [58, 116]], w: 9 }, { t: 'line', pts: [[84, 168], [120, 168]], w: 9 }, { t: 'line', pts: [[78, 177], [222, 177]], w: 5 }, { t: 'line', pts: [[222, 177], [196, 70]], w: 5 }, { t: 'plate', len: 34 }],
  },
  Dumbbell_Lunges: {
    cue: 'Baja en vertical; rodilla de adelante sobre el tobillo; torso erguido.',
    a: { pelvis: [143, 111], torso: 180, arm: hang, leg: { foot: [176, 175] }, legFar: { foot: [112, 169], toe: 58 } },
    b: { pelvis: [143, 139], torso: 178, arm: hang, leg: { foot: [176, 175] }, legFar: { foot: [106, 160], toe: 38 } },
    props: [{ t: 'dumbbell', at: 'hand' }],
  },
  Barbell_Hip_Thrust: {
    cue: 'Espalda alta apoyada; empuja con los talones hasta alinear rodilla, cadera y hombro.',
    a: { shoulder: [95, 127], torso: 226, arm: { hand: [136, 150], side: 1 }, leg: { foot: [168, 175] } },
    b: { shoulder: [95, 127], torso: 274, arm: { hand: [148, 115], side: 1 }, leg: { foot: [168, 175] } },
    props: [{ t: 'bench', x: 52, y: 132, w: 50 }, { t: 'barbell', at: 'pelvis', off: [-11, 3] }],
  },
  Barbell_Glute_Bridge: {
    cue: 'Hombros en el piso; sube la cadera apretando glúteos, sin arquear la zona lumbar.',
    a: { shoulder: [80, 171], torso: 272, head: [63, 168], arm: { hand: [133, 160], side: 1 }, leg: { foot: [166, 175] } },
    b: { shoulder: [80, 171], torso: 302, head: [63, 168], arm: { hand: [127, 137], side: 1 }, leg: { foot: [166, 175] } },
    props: [{ t: 'barbell', at: 'pelvis', off: [-11, 3] }],
  },
  Barbell_Curl: {
    cue: 'Codos pegados al costado; sube sin balancear el torso; baja con control.',
    a: { pelvis: STAND, torso: 180, arm: { u: 3, f: 10 }, leg: { foot: FEET } },
    b: { pelvis: STAND, torso: 180, arm: { u: 8, f: 152 }, leg: { foot: FEET } },
    props: [{ t: 'barbell', at: 'hand', r: 10 }],
  },
  Hammer_Curls: {
    cue: 'Agarre neutro (pulgares arriba); codos fijos; sube hasta el hombro.',
    a: { pelvis: STAND, torso: 180, arm: { u: 3, f: 8 }, leg: { foot: FEET } },
    b: { pelvis: STAND, torso: 180, arm: { u: 6, f: 150 }, leg: { foot: FEET } },
    props: [{ t: 'dumbbell', at: 'hand' }],
  },
  Triceps_Pushdown: {
    cue: 'Brazo pegado al torso; solo se mueve el antebrazo hasta extender el codo.',
    a: { pelvis: [140, 103], torso: 172, arm: { u: 6, f: 118 }, leg: { foot: [142, 175] } },
    b: { pelvis: [140, 103], torso: 172, arm: { u: 6, f: 10 }, leg: { foot: [142, 175] } },
    props: [{ t: 'line', pts: [[218, 178], [218, 22], [196, 22]], w: 5 }, { t: 'cable', from: [196, 24] }],
  },
  'EZ-Bar_Skullcrusher': {
    cue: 'Brazos casi verticales y quietos; flexiona solo el codo llevando la barra hacia la frente.',
    a: { pelvis: [150, 127], torso: 270, head: [88, 124], arm: { u: 188, f: 188 }, leg: { foot: [190, 175] } },
    b: { pelvis: [150, 127], torso: 270, head: [88, 124], arm: { u: 196, f: 290 }, leg: { foot: [190, 175] } },
    props: [{ t: 'bench', x: 76, y: 133, w: 92 }, { t: 'barbell', at: 'hand', r: 8 }],
  },
  Seated_Cable_Rows: {
    cue: 'Pecho arriba; jala el agarre al abdomen llevando los codos atrás; no te balancees.',
    a: { pelvis: [105, 149], torso: 171, arm: { hand: [160, 114], side: -1 }, leg: { foot: [171, 150], toe: 180 } },
    b: { pelvis: [105, 149], torso: 184, arm: { hand: [119, 121], side: -1 }, leg: { foot: [171, 150], toe: 180 } },
    props: [{ t: 'bench', x: 84, y: 157, w: 46, h: 23 }, { t: 'line', pts: [[180, 138], [180, 160]], w: 6 }, { t: 'line', pts: [[236, 178], [236, 96]], w: 5 }, { t: 'cable', from: [236, 118] }],
  },
}
export const hasMove = (id: string) => id in MOVES
