/**
 * Plantillas de movimiento por familia de ejercicio. Cada plantilla devuelve las dos posturas clave
 * y el equipo a dibujar según el ejercicio del catálogo. La asignación (`templateFor`) es conservadora:
 * solo se usa cuando el nombre, el músculo principal y el equipo coinciden con claridad; lo demás
 * se queda sin animación (con sus fotos).
 */
import type { Exercise } from '../lib/types'
import type { Arm, V } from './rig'
import { MOVES, type Move, type Prop } from './moves'
const MOVES_IDS = MOVES

const FEET: V = [152, 175], STAND: V = [150, 103]
/** De pie con rodillas apenas flexionadas: deja espacio arriba para los brazos extendidos. */
const STAND_LOW: V = [150, 111]
const hang: Arm = { u: 3, f: 6 }
const onBack: Arm = { hand: [13, 3], side: 1, rel: true }
const isBar = (x: Exercise, n: string) => x.eq === 'barbell' || x.eq === 'ezbar' || /smith|barbell|bar /.test(n)
const isDb = (x: Exercise) => x.eq === 'dumbbell' || x.eq === 'kettlebell'

/** Equipo que va en la mano. `pulley` = punto de la polea para ejercicios de cable o banda. */
function inHand(x: Exercise, n: string, pulley?: V, r = 11): Prop[] {
  if (isBar(x, n)) return [{ t: 'barbell', at: 'hand', r: x.eq === 'ezbar' ? 8 : r }]
  if (isDb(x)) return [{ t: 'dumbbell', at: 'hand' }]
  if ((x.eq === 'cable' || x.eq === 'band') && pulley) return [{ t: 'cable', from: pulley }]
  return []
}
/** Carga para ejercicios de pierna: barra en la espalda, mancuernas a los lados o nada. */
function loaded(x: Exercise, n: string, free: Arm): { arm: Arm; props: Prop[] } {
  if (isBar(x, n) || (x.eq === 'other' && /weighted/.test(n))) return { arm: onBack, props: [{ t: 'barbell', at: 'shoulder', off: [9, 1] }] }
  if (isDb(x)) return { arm: hang, props: [{ t: 'dumbbell', at: 'hand' }] }
  return { arm: free, props: [] }
}
const seat = (x: number, y: number, w = 44): Prop => ({ t: 'bench', x, y, w })
const post = (x: number, top: number, armTo?: number): Prop => ({ t: 'line', pts: armTo == null ? [[x, 178], [x, top]] : [[x, 178], [x, top], [armTo, top]], w: 5 })

type Build = (x: Exercise, n: string) => Move

const T: Record<string, Build> = {
  squat: (x, n) => {
    const g = loaded(x, n, { u: 12, f: 16 }), box = /bench|box/.test(n)
    const down: Arm = g.props.length ? g.arm : { u: 80, f: 85 }
    return { cue: box ? 'Siéntate atrás hasta tocar el banco sin desplomarte; sube empujando el piso.' : 'Cadera atrás y abajo; rodillas siguen la punta del pie; espalda neutra.',
      a: { pelvis: [148, 103], torso: 174, arm: g.arm, leg: { foot: FEET } }, b: { pelvis: box ? [125, 141] : [127, 143], torso: 146, arm: down, leg: { foot: FEET } },
      props: [...(box ? [seat(92, 151, 44)] : []), ...g.props] }
  },
  squatFront: (x, n) => ({ cue: 'Carga al frente, codos altos y torso erguido; baja entre las rodillas.',
    a: { pelvis: [148, 103], torso: 176, arm: { u: 30, f: 170 }, leg: { foot: FEET } }, b: { pelvis: [130, 143], torso: 157, arm: { u: 30, f: 170 }, leg: { foot: FEET } },
    props: isDb(x) ? [{ t: 'dumbbell', at: 'hand' }] : [{ t: 'barbell', at: 'hand', r: 12 }] }),
  lunge: (x, n) => { const g = loaded(x, n, hang); return { cue: 'Baja en vertical; rodilla de adelante sobre el tobillo; torso erguido.',
    a: { pelvis: [143, 111], torso: 180, arm: g.arm, leg: { foot: [176, 175] }, legFar: { foot: [112, 169], toe: 58 } },
    b: { pelvis: [143, 139], torso: 178, arm: g.arm, leg: { foot: [176, 175] }, legFar: { foot: [106, 160], toe: 38 } }, props: g.props } },
  stepUp: (x, n) => { const g = loaded(x, n, hang); return { cue: 'Apoya todo el pie en el cajón y sube empujando con esa pierna, sin impulsarte con la de atrás.',
    a: { pelvis: [146, 112], torso: 168, arm: g.arm, leg: { foot: [168, 150] }, legFar: { foot: [128, 175] } },
    b: { pelvis: [166, 78], torso: 180, arm: g.arm, leg: { foot: [168, 150] }, legFar: { foot: [158, 150] } }, props: [{ t: 'bench', x: 150, y: 156, w: 52 }, ...g.props] } },
  legPress: () => ({ cue: 'Baja la plataforma con control hasta ~90° de rodilla; empuja sin bloquear las rodillas.',
    a: { pelvis: [95, 150], torso: 228, arm: { hand: [97, 151], side: -1 }, leg: { foot: [149, 106], toe: 222 } }, b: { pelvis: [95, 150], torso: 228, arm: { hand: [97, 151], side: -1 }, leg: { foot: [131, 121], toe: 222 } },
    props: [{ t: 'line', pts: [[108, 163], [58, 116]], w: 9 }, { t: 'line', pts: [[84, 168], [120, 168]], w: 9 }, { t: 'line', pts: [[78, 177], [222, 177]], w: 5 }, { t: 'line', pts: [[222, 177], [196, 70]], w: 5 }, { t: 'plate', len: 34 }], freeFeet: true }),
  legExtension: () => ({ cue: 'Extiende la rodilla sin despegar el muslo del asiento; baja lento.',
    a: { pelvis: [110, 128], torso: 190, arm: { hand: [112, 126], side: -1 }, leg: { foot: [150, 164] } }, b: { pelvis: [110, 128], torso: 190, arm: { hand: [112, 126], side: -1 }, leg: { foot: [182, 131], toe: 150 } },
    props: [seat(96, 136, 50), { t: 'line', pts: [[102, 136], [94, 84]], w: 7 }], freeFeet: true }),
  legCurlLying: () => ({ cue: 'Cadera pegada al banco; lleva los talones hacia los glúteos y baja controlando.',
    a: { pelvis: [150, 140], torso: 90, arm: { hand: [206, 154], side: 1 }, leg: { foot: [79, 143], toe: 180 } }, b: { pelvis: [150, 140], torso: 90, arm: { hand: [206, 154], side: 1 }, leg: { foot: [116, 108], toe: 250 } },
    props: [seat(100, 148, 112)], freeFeet: true }),
  legCurlSeated: () => ({ cue: 'Espalda en el respaldo; flexiona las rodillas llevando los talones abajo y atrás.',
    a: { pelvis: [110, 128], torso: 190, arm: { hand: [112, 126], side: -1 }, leg: { foot: [182, 131], toe: 150 } }, b: { pelvis: [110, 128], torso: 190, arm: { hand: [112, 126], side: -1 }, leg: { foot: [134, 160] } },
    props: [seat(96, 136, 50), { t: 'line', pts: [[102, 136], [94, 84]], w: 7 }], freeFeet: true }),
  deadlift: (x, n) => ({ cue: 'Barra pegada a las piernas, espalda neutra; empuja el piso y extiende cadera y rodillas a la vez.',
    a: { pelvis: [120, 128], torso: 120, arm: { u: 0, f: 0 }, leg: { foot: FEET } }, b: { pelvis: [150, 103], torso: 180, arm: { u: 3, f: 5 }, leg: { foot: FEET } },
    props: isDb(x) ? [{ t: 'dumbbell', at: 'hand' }] : x.eq === 'machine' ? [] : [{ t: 'barbell', at: 'hand', r: 15 }] }),
  hinge: (x, n) => { const gm = /good morning/.test(n); return { cue: gm ? 'Barra en la espalda alta; lleva la cadera atrás con rodillas casi fijas y espalda neutra.' : 'Cadera atrás, rodillas apenas flexionadas; baja la carga pegada a las piernas sin redondear la espalda.',
    a: { pelvis: [150, 103], torso: 180, arm: gm ? onBack : { u: 3, f: 5 }, leg: { foot: FEET } }, b: { pelvis: [126, 108], torso: 115, arm: gm ? onBack : { u: 0, f: 2 }, leg: { foot: FEET } },
    props: gm ? (isBar(x, n) ? [{ t: 'barbell', at: 'shoulder', off: [9, 1] }] : []) : isDb(x) ? [{ t: 'dumbbell', at: 'hand' }] : [{ t: 'barbell', at: 'hand', r: 13 }] } },
  hipThrust: (x, n) => { const bar = isBar(x, n); return { cue: 'Espalda alta apoyada; empuja con los talones hasta alinear rodilla, cadera y hombro.',
    a: { shoulder: [95, 127], torso: 226, arm: { hand: [-11, -43], side: 1, rel: true }, leg: { foot: [168, 175] } }, b: { shoulder: [95, 127], torso: 274, arm: { hand: [-11, -43], side: 1, rel: true }, leg: { foot: [168, 175] } },
    props: [seat(52, 132, 50), ...(bar ? [{ t: 'barbell', at: 'pelvis', off: [-11, 3] } as Prop] : [])] } },
  bridge: (x, n) => { const bar = isBar(x, n); return { cue: 'Hombros en el piso; sube la cadera apretando glúteos, sin arquear la zona lumbar.',
    a: { shoulder: [80, 171], torso: 272, head: [63, 168], arm: bar ? { hand: [-11, -43], side: 1, rel: true } : { hand: [118, 174], side: 1 }, leg: { foot: [166, 175] }, ...(/single leg/.test(n) ? { legFar: { foot: [198, 160] as V, toe: 180 } } : {}) },
    b: { shoulder: [80, 171], torso: 302, head: [63, 168], arm: bar ? { hand: [-11, -43], side: 1, rel: true } : { hand: [118, 174], side: 1 }, leg: { foot: [166, 175] }, ...(/single leg/.test(n) ? { legFar: { foot: [186, 120] as V, toe: 180 } } : {}) },
    props: bar ? [{ t: 'barbell', at: 'pelvis', off: [-11, 3] }] : [] } },
  calfStanding: (x, n) => { const g = loaded(x, n, hang); return { cue: 'Sube sobre la punta de los pies lo más alto posible; pausa arriba y baja el talón con control.',
    a: { pelvis: [150, 103], torso: 180, arm: g.arm, leg: { foot: [152, 175], toe: 90 } }, b: { pelvis: [151, 94], torso: 180, arm: g.arm, leg: { foot: [153, 166], toe: 53 } }, props: g.props, freeFeet: true } },
  calfSeated: () => ({ cue: 'Sentado con rodillas a 90°; eleva los talones al máximo y baja estirando la pantorrilla.',
    a: { pelvis: [112, 138], torso: 180, arm: { hand: [138, 128], side: -1 }, leg: { foot: [152, 175], toe: 90 } }, b: { pelvis: [112, 138], torso: 180, arm: { hand: [139, 122], side: -1 }, leg: { foot: [153, 166], toe: 53 } },
    props: [seat(92, 145, 40)], freeFeet: true }),
  bench: (x, n) => {
    const g = inHand(x, n, undefined, 10), cue = 'Escápulas juntas y pies firmes; baja al pecho con control y empuja sin despegar la cadera.'
    if (/floor/.test(n)) return { cue: 'Acostado en el piso; baja hasta que los codos toquen el suelo y empuja.', a: { pelvis: [150, 170], torso: 272, head: [86, 168], arm: { u: 183, f: 183 }, leg: { foot: [188, 175] } }, b: { pelvis: [150, 170], torso: 272, head: [86, 168], arm: { u: 85, f: 180 }, leg: { foot: [188, 175] } }, props: g }
    if (/incline/.test(n)) return { cue, a: { pelvis: [150, 142], torso: 236, arm: { u: 182, f: 182 }, leg: { foot: [186, 175] } }, b: { pelvis: [150, 142], torso: 236, arm: { u: 45, f: 180 }, leg: { foot: [186, 175] } },
      props: [{ t: 'line', pts: [[160, 157], [100, 117]], w: 7 }, { t: 'line', pts: [[150, 153], [178, 153]], w: 7 }, { t: 'line', pts: [[140, 158], [140, 178]], w: 4 }, ...g] }
    if (/decline/.test(n)) return { cue, a: { pelvis: [152, 124], torso: 286, head: [92, 141], arm: { u: 182, f: 182 }, leg: { foot: [186, 121], toe: 150 } }, b: { pelvis: [152, 124], torso: 286, head: [92, 141], arm: { u: 50, f: 180 }, leg: { foot: [186, 121], toe: 150 } },
      props: [{ t: 'line', pts: [[84, 150], [178, 123]], w: 7 }, { t: 'line', pts: [[100, 150], [100, 178]], w: 4 }, { t: 'line', pts: [[168, 128], [168, 178]], w: 4 }, ...g] }
    return { cue, a: { pelvis: [150, 127], torso: 270, head: [88, 124], arm: { u: 183, f: 183 }, leg: { foot: [190, 175] } }, b: { pelvis: [150, 127], torso: 270, head: [88, 124], arm: { u: 50, f: 180 }, leg: { foot: [190, 175] } }, props: [seat(76, 133, 92), ...g] }
  },
  chestPressSeated: () => ({ cue: 'Espalda en el respaldo; empuja al frente sin encoger los hombros y regresa con control.',
    a: { pelvis: [118, 142], torso: 186, arm: { hand: [128, 104], side: -1 }, leg: { foot: [156, 175] } }, b: { pelvis: [118, 142], torso: 186, arm: { hand: [160, 100], side: -1 }, leg: { foot: [156, 175] } },
    props: [seat(100, 149, 36), { t: 'line', pts: [[104, 150], [98, 92]], w: 7 }] }),
  pushup: (x, n) => {
    const cue = 'Cuerpo en línea de cabeza a talones; baja el pecho entre las manos y empuja sin hundir la cadera.'
    const mk = (ankle: V, hand: V, a: [V, number], b: [V, number], props: Prop[]): Move => ({ cue, props,
      a: { shoulder: a[0], torso: a[1], arm: { hand, side: -1 }, leg: { foot: ankle, toe: 0 } }, b: { shoulder: b[0], torso: b[1], arm: { hand, side: -1 }, leg: { foot: ankle, toe: 0 } } })
    if (/incline/.test(n)) return mk([104, 167], [196, 140], [[193.8, 92.2], 130.9], [[208.9, 114.2], 118], [seat(176, 143, 44)])
    if (/decline|feet elevated/.test(n)) return mk([78, 134], [196, 172], [[196, 123.5], 95.1], [[194.2, 158.7], 78], [seat(56, 142, 44)])
    return mk([80, 168], [190, 172], [[190, 123], 111.7], [[198, 156], 95.8], [])
  },
  dips: () => ({ cue: 'Baja flexionando los codos hasta ~90° con ligera inclinación del torso; empuja hasta extender.',
    a: { shoulder: [150, 64], torso: 180, arm: { hand: [150, 113], side: -1 }, leg: { foot: [128, 162], toe: 130 } }, b: { shoulder: [156, 90], torso: 166, arm: { hand: [150, 113], side: -1 }, leg: { foot: [122, 172], toe: 130 } },
    props: [{ t: 'line', pts: [[128, 117], [176, 117]], w: 5 }, { t: 'line', pts: [[170, 117], [170, 178]], w: 4 }], freeFeet: true }),
  benchDip: () => ({ cue: 'Manos en el banco detrás de ti; baja flexionando los codos hacia atrás hasta ~90° y empuja.',
    a: { shoulder: [116, 95], torso: 178, arm: { hand: [112, 143], side: -1 }, leg: { foot: [178, 170], toe: 180 } }, b: { shoulder: [120, 118], torso: 176, arm: { hand: [112, 143], side: -1 }, leg: { foot: [178, 170], toe: 180 } },
    props: [seat(70, 147, 48)] }),
  overheadPress: (x, n) => { const s = /seated|machine|leverage/.test(n), g = inHand(x, n); return { cue: 'Abdomen firme; empuja en vertical hasta extender los brazos sin arquear la espalda baja.',
    a: { pelvis: s ? [130, 138] : STAND_LOW, torso: 180, arm: { u: 36, f: 180 }, leg: { foot: s ? [170, 175] : FEET } }, b: { pelvis: s ? [130, 138] : STAND_LOW, torso: 180, arm: { u: 176, f: 180 }, leg: { foot: s ? [170, 175] : FEET } },
    props: [...(s ? [seat(108, 145, 44)] : []), ...g] } },
  frontRaise: (x, n) => { const oh = /over ?head|above head/.test(n), pv = oh ? STAND_LOW : STAND; return { cue: oh ? 'Brazos casi rectos; sube al frente hasta arriba de la cabeza sin arquear la espalda y baja con control.' : 'Brazos casi rectos; sube al frente hasta la altura de los hombros sin balancear el torso.',
    a: { pelvis: pv, torso: 180, arm: { u: 5, f: 8 }, leg: { foot: FEET } }, b: { pelvis: pv, torso: 180, arm: oh ? { u: 168, f: 172 } : { u: 92, f: 95 }, leg: { foot: FEET } }, props: inHand(x, n, [215, 172], 9) } },
  uprightRow: (x, n) => ({ cue: 'Sube la carga pegada al cuerpo guiando con los codos hasta la altura del pecho.',
    a: { pelvis: STAND, torso: 180, arm: { hand: [-8, -46], side: 1, rel: true }, leg: { foot: FEET } }, b: { pelvis: STAND, torso: 180, arm: { hand: [-10, -12], side: 1, rel: true }, leg: { foot: FEET } }, props: inHand(x, n, [215, 172], 9) }),
  pulldown: () => ({ cue: 'Pecho arriba; jala la barra hacia la clavícula llevando los codos abajo y atrás.',
    a: { pelvis: [140, 140], torso: 180, arm: { hand: [158, 48], side: -1 }, leg: { foot: [176, 175] } }, b: { pelvis: [140, 140], torso: 188, arm: { hand: [150, 98], side: -1 }, leg: { foot: [176, 175] } },
    props: [seat(118, 147, 44), post(198, 16, 160), { t: 'cable', from: [162, 18] }] }),
  pullup: () => ({ cue: 'Desde colgado con brazos extendidos, sube hasta pasar la barbilla sobre la barra; baja controlando.',
    a: { shoulder: [150, 71], torso: 180, arm: { hand: [150, 22], side: -1 }, leg: { foot: [138, 172], toe: 130 } }, b: { shoulder: [143, 33], torso: 176, arm: { hand: [150, 22], side: -1 }, leg: { foot: [130, 135], toe: 130 } },
    props: [{ t: 'line', pts: [[134, 20], [166, 20]], w: 5 }], freeFeet: true }),
  hangingLegRaise: () => ({ cue: 'Colgado sin balancearte; eleva las piernas con el abdomen y bájalas despacio.',
    a: { shoulder: [150, 71], torso: 180, arm: { hand: [150, 22], side: -1 }, leg: { foot: [146, 172] } }, b: { shoulder: [150, 71], torso: 180, arm: { hand: [150, 22], side: -1 }, leg: { foot: [212, 118], toe: 160 } },
    props: [{ t: 'line', pts: [[134, 20], [166, 20]], w: 5 }], freeFeet: true }),
  bentRow: (x, n) => ({ cue: 'Torso inclinado con espalda neutra; jala hacia el abdomen llevando los codos atrás.',
    a: { pelvis: [126, 108], torso: 112, arm: { hand: [168.6, 139.5], side: -1 }, leg: { foot: FEET } }, b: { pelvis: [126, 108], torso: 112, arm: { hand: [160, 113], side: -1 }, leg: { foot: FEET } }, props: inHand(x, n, undefined, 13) }),
  seatedRow: () => ({ cue: 'Pecho arriba; jala el agarre al abdomen llevando los codos atrás; no te balancees.',
    a: { pelvis: [105, 149], torso: 171, arm: { hand: [160, 114], side: -1 }, leg: { foot: [171, 150], toe: 180 } }, b: { pelvis: [105, 149], torso: 184, arm: { hand: [119, 121], side: -1 }, leg: { foot: [171, 150], toe: 180 } },
    props: [{ t: 'bench', x: 84, y: 157, w: 46, h: 23 }, { t: 'line', pts: [[180, 138], [180, 160]], w: 6 }, post(236, 96), { t: 'cable', from: [236, 118] }] }),
  facePull: () => ({ cue: 'Jala la cuerda hacia la cara separando las manos, con los codos altos.',
    a: { pelvis: [130, 103], torso: 182, arm: { hand: [176, 54], side: 1 }, leg: { foot: [132, 175] } }, b: { pelvis: [130, 103], torso: 182, arm: { hand: [142, 50], side: 1 }, leg: { foot: [132, 175] } },
    props: [post(238, 36), { t: 'cable', from: [236, 44] }] }),
  straightArmPulldown: () => ({ cue: 'Brazos casi rectos; lleva la barra en arco hasta los muslos usando los dorsales.',
    a: { pelvis: [136, 103], torso: 168, arm: { u: 118, f: 122 }, leg: { foot: [138, 175] } }, b: { pelvis: [136, 103], torso: 168, arm: { u: 8, f: 12 }, leg: { foot: [138, 175] } },
    props: [post(218, 22, 212), { t: 'cable', from: [212, 24] }] }),
  curl: (x, n) => { const s = /seated|machine/.test(n); return { cue: 'Codos pegados al costado; sube sin balancear el torso; baja con control.',
    a: { pelvis: s ? [130, 138] : STAND, torso: 180, arm: { u: 3, f: 10 }, leg: { foot: s ? [170, 175] : FEET } }, b: { pelvis: s ? [130, 138] : STAND, torso: 180, arm: { u: 7, f: 151 }, leg: { foot: s ? [170, 175] : FEET } },
    props: [...(s ? [seat(108, 145, 44)] : []), ...inHand(x, n, [220, 172], 10), ...(x.eq === 'cable' ? [post(222, 164)] : [])] } },
  preacherCurl: (x, n) => ({ cue: 'Brazo apoyado en el cojín; sube sin despegarlo y baja casi hasta extender.',
    a: { pelvis: [120, 140], torso: 168, arm: { u: 50, f: 56 }, leg: { foot: [160, 175] } }, b: { pelvis: [120, 140], torso: 168, arm: { u: 50, f: 172 }, leg: { foot: [160, 175] } },
    props: [seat(100, 147, 40), { t: 'line', pts: [[131, 107], [153, 128]], w: 7 }, { t: 'line', pts: [[150, 128], [150, 178]], w: 4 }, ...inHand(x, n, [220, 172], 9)] }),
  inclineCurl: (x, n) => ({ cue: 'Espalda en el banco inclinado, brazos colgando; flexiona sin adelantar los codos.',
    a: { pelvis: [140, 142], torso: 205, arm: { u: -4, f: 2 }, leg: { foot: [176, 175] } }, b: { pelvis: [140, 142], torso: 205, arm: { u: -2, f: 145 }, leg: { foot: [176, 175] } },
    props: [{ t: 'line', pts: [[138, 157], [106, 95]], w: 7 }, { t: 'line', pts: [[138, 153], [168, 153]], w: 7 }, { t: 'line', pts: [[150, 157], [150, 178]], w: 4 }, ...inHand(x, n)] }),
  pushdown: () => ({ cue: 'Brazo pegado al torso; solo se mueve el antebrazo hasta extender el codo.',
    a: { pelvis: [140, 103], torso: 172, arm: { u: 6, f: 118 }, leg: { foot: [142, 175] } }, b: { pelvis: [140, 103], torso: 172, arm: { u: 6, f: 10 }, leg: { foot: [142, 175] } }, props: [post(218, 22, 196), { t: 'cable', from: [196, 24] }] }),
  skullcrusher: (x, n) => ({ cue: 'Brazos casi verticales y quietos; flexiona solo el codo llevando la carga hacia la frente.',
    a: { pelvis: [150, 127], torso: 270, head: [88, 124], arm: { u: 188, f: 188 }, leg: { foot: [190, 175] } }, b: { pelvis: [150, 127], torso: 270, head: [88, 124], arm: { u: 196, f: 290 }, leg: { foot: [190, 175] } },
    props: [seat(76, 133, 92), ...inHand(x, n, [34, 150], 8)] }),
  overheadTriceps: (x, n) => { const s = /seated/.test(n); return { cue: 'Codos apuntando arriba y cerca de la cabeza; baja la carga detrás de la nuca y extiende.',
    a: { pelvis: s ? [130, 138] : STAND_LOW, torso: 180, arm: { u: 178, f: 290 }, leg: { foot: s ? [170, 175] : FEET } }, b: { pelvis: s ? [130, 138] : STAND_LOW, torso: 180, arm: { u: 178, f: 178 }, leg: { foot: s ? [170, 175] : FEET } },
    props: [...(s ? [seat(108, 145, 44)] : []), ...inHand(x, n, [92, 172], 8)] } },
  kickback: (x, n) => ({ cue: 'Torso inclinado y brazo paralelo al piso; extiende el codo hacia atrás sin mover el hombro.',
    a: { pelvis: [126, 108], torso: 112, arm: { u: -75, f: 0 }, leg: { foot: FEET } }, b: { pelvis: [126, 108], torso: 112, arm: { u: -75, f: -78 }, leg: { foot: FEET } }, props: inHand(x, n) }),
  crunch: () => ({ cue: 'Despega solo los hombros del piso contrayendo el abdomen; no jales el cuello.',
    a: { pelvis: [150, 170], torso: 272, arm: { hand: [3, 15], side: -1, rel: true }, leg: { foot: [186, 175] } }, b: { pelvis: [150, 170], torso: 250, arm: { hand: [3, 15], side: -1, rel: true }, leg: { foot: [186, 175] } }, props: [] }),
  situp: () => ({ cue: 'Sube el torso completo enrollando la columna; baja vértebra por vértebra.',
    a: { pelvis: [150, 170], torso: 272, arm: { hand: [3, 15], side: -1, rel: true }, leg: { foot: [186, 175] } }, b: { pelvis: [150, 170], torso: 208, arm: { hand: [3, 15], side: -1, rel: true }, leg: { foot: [186, 175] } }, props: [] }),
  pullover: (x, n) => { const bent = /bent-arm/.test(n); return { cue: 'Acostado en el banco; lleva la carga en arco por detrás de la cabeza sin cambiar la flexión del codo y regresa sobre el pecho.',
    a: { pelvis: [150, 127], torso: 270, head: [88, 124], arm: bent ? { u: 182, f: 216 } : { u: 181, f: 183 }, leg: { foot: [190, 175] } }, b: { pelvis: [150, 127], torso: 270, head: [88, 124], arm: bent ? { u: 256, f: 298 } : { u: 260, f: 266 }, leg: { foot: [190, 175] } },
    props: [seat(76, 133, 92), ...inHand(x, n, undefined, 8)] } },
  reverseCrunch: () => ({ cue: 'Rodillas flexionadas; despega la cadera del piso enrollando la pelvis hacia el pecho, sin impulso de piernas.',
    a: { pelvis: [112, 170], torso: 272, head: [50, 168], arm: { hand: [100, 175], side: 1 }, leg: { foot: [158, 152], toe: 110 } }, b: { pelvis: [112, 170], torso: 272, head: [50, 168], arm: { hand: [100, 175], side: 1 }, leg: { foot: [106, 118], toe: 200 } }, props: [], freeFeet: true }),
  cableCrunch: (x, n) => /standing/.test(n)
    ? { cue: 'De pie frente a la polea alta con la cuerda junto a la cabeza; flexiona la columna hacia abajo sin doblar la cadera de más.',
        a: { pelvis: [140, 104], torso: 176, arm: { hand: [-7, 13], side: -1, rel: true }, leg: { foot: [142, 175] } }, b: { pelvis: [140, 104], torso: 130, arm: { hand: [-7, 13], side: -1, rel: true }, leg: { foot: [142, 175] } }, props: [post(236, 14, 216), { t: 'cable', from: [216, 16] }] }
    : { cue: 'De rodillas con la cuerda junto a la cabeza; flexiona la columna llevando los codos hacia las rodillas, sin sentarte sobre los talones.',
        a: { pelvis: [140, 138], torso: 165, arm: { hand: [-7, 13], side: -1, rel: true }, leg: { foot: [104, 174], toe: 270 } }, b: { pelvis: [140, 138], torso: 112, arm: { hand: [-7, 13], side: -1, rel: true }, leg: { foot: [104, 174], toe: 270 } },
        props: [post(232, 22, 214), { t: 'cable', from: [214, 24] }] },
  hyperextension: () => ({ cue: 'Cadera en el borde del cojín; baja el tronco con la espalda recta y sube solo hasta alinear el cuerpo, sin arquear de más.',
    a: { pelvis: [156, 110], torso: 62, arm: { hand: [-9, -12], side: -1, rel: true }, leg: { foot: [112, 165], toe: 20 } }, b: { pelvis: [156, 110], torso: 141, arm: { hand: [-9, -12], side: -1, rel: true }, leg: { foot: [112, 165], toe: 20 } },
    props: [{ t: 'line', pts: [[136, 148], [160, 120]], w: 9 }, { t: 'line', pts: [[150, 136], [150, 178]], w: 5 }, { t: 'line', pts: [[100, 178], [176, 178]], w: 5 }, { t: 'line', pts: [[104, 176], [104, 160]], w: 5 }] }),
  invertedRow: () => ({ cue: 'Cuerpo en tabla, talones en el piso; jala el pecho hacia la barra juntando las escápulas y baja sin soltar la cadera.',
    a: { pelvis: [164, 158.7], torso: 256.5, arm: { hand: [120, 100], side: 1 }, leg: { foot: [236, 176], toe: 200 } }, b: { pelvis: [170.1, 142.4], torso: 243, arm: { hand: [120, 100], side: 1 }, leg: { foot: [236, 176], toe: 200 } },
    props: [{ t: 'line', pts: [[120, 178], [120, 96]], w: 5 }, { t: 'barbell', at: 'hand', r: 4 }] }),
  proneRow: (x, n) => ({ cue: 'Pecho apoyado en el banco inclinado; jala los codos hacia atrás juntando las escápulas y baja hasta extender.',
    a: { pelvis: [128, 122], torso: 130, arm: { u: 0, f: 2 }, leg: { foot: [86, 176] } }, b: { pelvis: [128, 122], torso: 130, arm: { u: -58, f: 24 }, leg: { foot: [86, 176] } },
    props: [{ t: 'line', pts: [[139, 133], [175, 103]], w: 8 }, { t: 'line', pts: [[158, 122], [158, 178]], w: 5 }, ...inHand(x, n, undefined, 9)] }),
  kickback_glute: (x) => ({ cue: 'Sujeto al poste y torso firme; lleva la pierna hacia atrás apretando el glúteo, sin arquear la zona lumbar.',
    a: { pelvis: [140, 104], torso: 166, arm: { hand: [182, 92], side: -1 }, leg: { foot: [146, 172], toe: 90 }, legFar: { foot: [142, 175] } }, b: { pelvis: [140, 104], torso: 166, arm: { hand: [182, 92], side: -1 }, leg: { foot: [100, 150], toe: 40 }, legFar: { foot: [142, 175] } },
    props: [post(186, 50), ...(x.eq === 'cable' || x.eq === 'band' ? [{ t: 'cable', from: [186, 172], to: 'foot' } as Prop] : [])], freeFeet: true }),
  standingLegCurl: () => ({ cue: 'De pie y sujeto al aparato; flexiona la rodilla llevando el talón al glúteo sin mover el muslo.',
    a: { pelvis: [150, 103], torso: 176, arm: { hand: [190, 88], side: -1 }, leg: { foot: [151, 176], toe: 90 }, legFar: { foot: [152, 175] } }, b: { pelvis: [150, 103], torso: 176, arm: { hand: [190, 88], side: -1 }, leg: { foot: [117, 147], toe: 10 }, legFar: { foot: [152, 175] } },
    props: [post(194, 50)], freeFeet: true }),
  rollout: (x, n) => ({ cue: 'De rodillas; rueda al frente con el abdomen firme hasta donde controles la espalda y regresa sin hundir la zona lumbar.',
    a: { pelvis: [112, 137], torso: 115, arm: { hand: [160, 167], side: -1 }, leg: { foot: [84, 174], toe: 270 } }, b: { pelvis: [138, 146], torso: 100, arm: { hand: [222, 167], side: -1 }, leg: { foot: [84, 174], toe: 270 } },
    props: [{ t: 'barbell', at: 'hand', r: 12 }] }),
  concentrationCurl: (x, n) => /standing/.test(n)
    ? { cue: 'Torso inclinado y brazo colgando en vertical; flexiona el codo sin balancear el hombro y baja hasta casi extender.',
        a: { pelvis: [126, 108], torso: 110, arm: { u: 0, f: 6 }, leg: { foot: FEET } }, b: { pelvis: [126, 108], torso: 110, arm: { u: 0, f: 150 }, leg: { foot: FEET } }, props: inHand(x, n, undefined, 8) }
    : { cue: 'Sentado, codo apoyado en la cara interna del muslo; sube girando la muñeca y baja hasta casi extender.',
        a: { pelvis: [130, 138], torso: 152, arm: { u: 6, f: 14 }, leg: { foot: [170, 175] } }, b: { pelvis: [130, 138], torso: 152, arm: { u: 6, f: 150 }, leg: { foot: [170, 175] } }, props: [seat(108, 145, 44), ...inHand(x, n, undefined, 8)] },
  altPress: (x, n) => ({ cue: 'Empuja un brazo en vertical mientras el otro espera a la altura del hombro; alterna sin inclinar el tronco.',
    a: { pelvis: STAND_LOW, torso: 180, arm: { u: 176, f: 180 }, armFar: { u: 36, f: 180 }, leg: { foot: FEET } }, b: { pelvis: STAND_LOW, torso: 180, arm: { u: 36, f: 180 }, armFar: { u: 176, f: 180 }, leg: { foot: FEET } }, props: inHand(x, n) }),
  tuckCrunch: () => ({ cue: 'Cadera y rodillas a 90°; despega los hombros del piso contrayendo el abdomen, sin balancear las piernas.',
    a: { pelvis: [150, 170], torso: 272, arm: { hand: [3, 15], side: -1, rel: true }, leg: { foot: [186, 132], toe: 180 } }, b: { pelvis: [150, 170], torso: 248, arm: { hand: [3, 15], side: -1, rel: true }, leg: { foot: [186, 132], toe: 180 } }, props: [] }),
  vUp: (x, n) => { const tuck = /cocoon/.test(n); return { cue: tuck ? 'Desde estirado, lleva las rodillas al pecho mientras subes el torso; regresa sin apoyar los pies.' : 'Sube piernas y torso a la vez hasta tocar las puntas de los pies; baja con control sin desplomarte.',
    a: { pelvis: [150, 170], torso: 272, arm: { u: 268, f: 268 }, leg: { foot: [222, 171], toe: 180 } }, b: { pelvis: [150, 170], torso: tuck ? 244 : 232, arm: tuck ? { u: 120, f: 110 } : { u: 150, f: 150 }, leg: { foot: tuck ? [178, 140] : [196, 114], toe: tuck ? 150 : 230 } }, props: [], freeFeet: true } },
  seatedTuck: () => ({ cue: 'Sentado en el borde y recargado hacia atrás; lleva las rodillas al pecho acercando el torso y extiende sin tocar el piso.',
    a: { pelvis: [124, 138], torso: 205, arm: { hand: [106, 142], side: 1 }, leg: { foot: [194, 150], toe: 110 } }, b: { pelvis: [124, 138], torso: 196, arm: { hand: [106, 142], side: 1 }, leg: { foot: [158, 132], toe: 110 } },
    props: [seat(92, 145, 50)], freeFeet: true }),
  seatedCrunch: (x) => ({ cue: 'Sentado y con la cadera fija; flexiona la columna llevando el pecho hacia la pelvis y regresa lento.',
    a: { pelvis: [130, 138], torso: 182, arm: { hand: [-7, 13], side: -1, rel: true }, leg: { foot: [170, 175] } }, b: { pelvis: [130, 138], torso: 140, arm: { hand: [-7, 13], side: -1, rel: true }, leg: { foot: [170, 175] } },
    props: [seat(108, 145, 44), ...(x.eq === 'cable' ? [post(92, 22, 110), { t: 'cable', from: [110, 24] } as Prop] : [])] }),
  inclineFrontRaise: (x, n) => ({ cue: 'Recargado en el banco inclinado; sube los brazos casi rectos al frente hasta la altura de los ojos y baja lento.',
    a: { pelvis: [140, 142], torso: 205, arm: { u: -4, f: 2 }, leg: { foot: [176, 175] } }, b: { pelvis: [140, 142], torso: 205, arm: { u: 96, f: 100 }, leg: { foot: [176, 175] } },
    props: [{ t: 'line', pts: [[138, 157], [106, 95]], w: 7 }, { t: 'line', pts: [[138, 153], [168, 153]], w: 7 }, { t: 'line', pts: [[150, 157], [150, 178]], w: 4 }, ...inHand(x, n)] }),
  pushPress: (x, n) => { const th = /thruster/.test(n); return { cue: th ? 'Baja a sentadilla con la carga en los hombros y, al subir, aprovecha el impulso para empujar arriba en un solo movimiento.' : 'Flexiona un poco las rodillas y extiéndelas con fuerza para ayudar a empujar la carga sobre la cabeza.',
    a: { pelvis: th ? [130, 146] : [143, 121], torso: th ? 158 : 177, arm: { u: 34, f: 176 }, leg: { foot: FEET } }, b: { pelvis: STAND_LOW, torso: 180, arm: { u: 176, f: 180 }, leg: { foot: FEET } }, props: inHand(x, n) } },
  standingPress: () => ({ cue: 'De espaldas a la polea y abdomen firme; empuja al frente hasta extender los brazos y regresa sin que el cable te jale.',
    a: { pelvis: [140, 104], torso: 174, arm: { u: -25, f: 95 }, leg: { foot: [142, 175] } }, b: { pelvis: [140, 104], torso: 174, arm: { u: 88, f: 92 }, leg: { foot: [142, 175] } }, props: [post(66, 56), { t: 'cable', from: [66, 70] }] }),
  svend: () => ({ cue: 'Aprieta los discos entre las palmas a la altura del pecho; extiende los brazos al frente sin soltar la presión y regresa.',
    a: { pelvis: STAND, torso: 180, arm: { u: 25, f: 150 }, leg: { foot: FEET } }, b: { pelvis: STAND, torso: 180, arm: { u: 86, f: 92 }, leg: { foot: FEET } }, props: [{ t: 'barbell', at: 'hand', r: 8 }] }),
  pullThrough: () => ({ cue: 'De espaldas a la polea baja, cuerda entre las piernas; lleva la cadera atrás con la espalda neutra y extiéndela apretando los glúteos.',
    a: { pelvis: [150, 103], torso: 180, arm: { hand: [4, -49], side: -1, rel: true }, leg: { foot: FEET } }, b: { pelvis: [126, 108], torso: 115, arm: { hand: [-24, -42], side: -1, rel: true }, leg: { foot: FEET } }, props: [post(52, 150), { t: 'cable', from: [52, 168] }] }),
  gluteHam: () => ({ cue: 'Tobillos sujetos y cuerpo en línea de rodilla a cabeza; baja al frente frenando con los isquiotibiales y regresa.',
    a: { pelvis: [120, 136], torso: 180, arm: { hand: [-12, -8], side: -1, rel: true }, leg: { foot: [84, 174], toe: 270 } }, b: { pelvis: [154.4, 158], torso: 100, arm: { hand: [-12, -8], side: -1, rel: true }, leg: { foot: [84, 174], toe: 270 } }, props: [{ t: 'line', pts: [[78, 166], [78, 178]], w: 6 }] }),
  reverseHyper: () => ({ cue: 'Torso apoyado y sujeto al banco; sube las piernas hasta alinearlas con el cuerpo apretando glúteos, sin impulso.',
    a: { pelvis: [130, 105], torso: 90, arm: { hand: [172, 128], side: 1 }, leg: { foot: [124, 174], toe: 250 } }, b: { pelvis: [130, 105], torso: 90, arm: { hand: [172, 128], side: 1 }, leg: { foot: [58, 104], toe: 360 } },
    props: [seat(126, 114, 72)], freeFeet: true }),
  singleLegDeadlift: (x, n) => ({ cue: 'Apoyado en una pierna con la rodilla apenas flexionada; inclina el torso y sube la otra pierna en línea con la espalda.',
    a: { pelvis: STAND, torso: 180, arm: { u: 2, f: 3 }, leg: { foot: FEET }, legFar: { foot: [150, 175], toe: 90 } }, b: { pelvis: [146, 106], torso: 100, arm: { u: 0, f: 0 }, leg: { foot: FEET }, legFar: { foot: [74, 100], toe: -10 } }, props: inHand(x, n, undefined, 9) }),
  bulgarian: (x, n) => { const g = loaded(x, n, hang); return { cue: 'Pie de atrás apoyado en el banco; baja en vertical cargando el peso en la pierna de adelante, con el torso erguido.',
    a: { pelvis: [142, 110], torso: 180, arm: g.arm, leg: { foot: [172, 175] }, legFar: { foot: [92, 140], toe: 300 } }, b: { pelvis: [138, 138], torso: 176, arm: g.arm, leg: { foot: [172, 175] }, legFar: { foot: [92, 140], toe: 300 } },
    props: [seat(60, 148, 44), ...g.props] } },
  kneelingSquat: () => ({ cue: 'De rodillas con la barra en la espalda; siéntate hacia los talones y sube extendiendo la cadera, apretando glúteos.',
    a: { pelvis: [94, 144], torso: 166, arm: onBack, leg: { foot: [84, 174], toe: 270 } }, b: { pelvis: [120, 136], torso: 178, arm: onBack, leg: { foot: [84, 174], toe: 270 } }, props: [{ t: 'barbell', at: 'shoulder', off: [9, 1] }] }),
  jumpSquat: (x, n) => { const g = loaded(x, n, { u: 10, f: 14 }); return { cue: 'Baja a sentadilla y salta en vertical extendiendo cadera, rodillas y tobillos; cae suave y enlaza la siguiente.',
    a: { pelvis: [127, 143], torso: 146, arm: g.props.length ? g.arm : { u: 40, f: 60 }, leg: { foot: FEET, toe: 90 } }, b: { pelvis: [150, 84], torso: 180, arm: g.arm, leg: { foot: [152, 157], toe: 30 } }, props: g.props, freeFeet: true } },
  calfPress: () => ({ cue: 'Solo la punta del pie en la plataforma y rodillas casi extendidas; empuja con los tobillos y baja estirando la pantorrilla.',
    a: { pelvis: [95, 150], torso: 228, arm: { hand: [97, 151], side: -1 }, leg: { foot: [149, 106], toe: 226 } }, b: { pelvis: [95, 150], torso: 228, arm: { hand: [97, 151], side: -1 }, leg: { foot: [150.5, 104.8], toe: 200 } },
    props: [{ t: 'line', pts: [[108, 163], [58, 116]], w: 9 }, { t: 'line', pts: [[84, 168], [120, 168]], w: 9 }, { t: 'line', pts: [[78, 177], [222, 177]], w: 5 }, { t: 'line', pts: [[222, 177], [196, 70]], w: 5 }, { t: 'plate', len: 34 }], freeFeet: true }),
  donkeyKick: () => ({ cue: 'En cuatro puntos con el abdomen firme; sube una pierna flexionada llevando la planta del pie al techo, sin arquear la espalda.',
    a: { pelvis: [130, 132], torso: 95, arm: { hand: [176, 176], side: -1 }, leg: { foot: [96, 172], toe: 270 }, legFar: { foot: [94, 172], toe: 270 } }, b: { pelvis: [130, 132], torso: 95, arm: { hand: [176, 176], side: -1 }, leg: { foot: [92, 98], toe: 270 }, legFar: { foot: [94, 172], toe: 270 } }, props: [], freeFeet: true }),
  seatedGoodMorning: () => ({ cue: 'Sentado con la barra en la espalda alta; inclina el torso desde la cadera con la espalda neutra y regresa.',
    a: { pelvis: [130, 138], torso: 180, arm: onBack, leg: { foot: [170, 175] } }, b: { pelvis: [130, 138], torso: 114, arm: onBack, leg: { foot: [170, 175] } }, props: [seat(108, 145, 44), { t: 'barbell', at: 'shoulder', off: [9, 1] }] }),
  dragCurl: (x, n) => ({ cue: 'Sube la barra pegada al cuerpo llevando los codos hacia atrás; no la separes del torso.',
    a: { pelvis: STAND, torso: 180, arm: { hand: [-6, -49], side: 1, rel: true }, leg: { foot: FEET } }, b: { pelvis: STAND, torso: 180, arm: { hand: [-9, -16], side: 1, rel: true }, leg: { foot: FEET } }, props: inHand(x, n, undefined, 10) }),
  proneCurl: (x, n) => ({ cue: 'Pecho apoyado en el banco inclinado y brazos colgando; flexiona los codos sin moverlos hacia atrás.',
    a: { pelvis: [128, 122], torso: 130, arm: { u: 0, f: 2 }, leg: { foot: [86, 176] } }, b: { pelvis: [128, 122], torso: 130, arm: { u: 2, f: 150 }, leg: { foot: [86, 176] } },
    props: [{ t: 'line', pts: [[139, 133], [175, 103]], w: 8 }, { t: 'line', pts: [[158, 122], [158, 178]], w: 5 }, ...inHand(x, n, undefined, 9)] }),
  lyingCurl: (x, n) => {
    if (/high pulley/.test(n)) return { cue: 'Acostado bajo la polea alta con los brazos verticales; flexiona solo los codos llevando la barra hacia la frente.',
      a: { pelvis: [150, 127], torso: 270, head: [88, 124], arm: { u: 182, f: 184 }, leg: { foot: [190, 175] } }, b: { pelvis: [150, 127], torso: 270, head: [88, 124], arm: { u: 182, f: 296 }, leg: { foot: [190, 175] } }, props: [seat(76, 133, 92), post(36, 22, 70), { t: 'cable', from: [70, 24] }] }
    if (x.eq === 'cable') return { cue: 'Acostado con los pies hacia la polea baja y los brazos pegados al cuerpo; flexiona los codos sin despegarlos del piso.',
      a: { pelvis: [150, 170], torso: 272, head: [86, 168], arm: { u: 92, f: 94 }, leg: { foot: [222, 172], toe: 180 } }, b: { pelvis: [150, 170], torso: 272, head: [86, 168], arm: { u: 92, f: 212 }, leg: { foot: [222, 172], toe: 180 } }, props: [post(252, 140), { t: 'cable', from: [252, 156] }] }
    return { cue: 'Acostado en el banco con los brazos colgando a los lados; flexiona los codos sin subirlos.',
      a: { pelvis: [150, 127], torso: 270, head: [88, 124], arm: { u: 8, f: 4 }, leg: { foot: [190, 175] } }, b: { pelvis: [150, 127], torso: 270, head: [88, 124], arm: { u: 8, f: 150 }, leg: { foot: [190, 175] } }, props: [seat(76, 133, 92), ...inHand(x, n)] }
  },
  wristCurl: (x, n) => {
    const cue = 'Antebrazos apoyados y quietos; mueve solo la muñeca en todo su recorrido, bajando lento.'
    if (/behind the back/.test(n)) return { cue: 'Barra detrás del cuerpo con los brazos rectos; flexiona solo las muñecas hacia arriba y baja lento.',
      a: { pelvis: STAND, torso: 180, arm: { u: -8, f: -4 }, wrist: 0, leg: { foot: FEET } }, b: { pelvis: STAND, torso: 180, arm: { u: -8, f: -4 }, wrist: -80, leg: { foot: FEET } }, props: inHand(x, n, undefined, 8) }
    return { cue, a: { pelvis: [130, 138], torso: 150, arm: { u: -5, f: 88 }, wrist: 50, leg: { foot: [170, 175] } }, b: { pelvis: [130, 138], torso: 150, arm: { u: -5, f: 88 }, wrist: 132, leg: { foot: [170, 175] } },
      props: [seat(108, 145, 44), ...inHand(x, n, [236, 172], 8)] }
  },
  legRaise: () => ({ cue: 'Zona lumbar pegada al apoyo; sube las piernas casi rectas y bájalas sin tocar el piso.',
    a: { pelvis: [112, 170], torso: 272, head: [50, 168], arm: { hand: [100, 175], side: 1 }, leg: { foot: [184, 170], toe: 150 } }, b: { pelvis: [112, 170], torso: 272, head: [50, 168], arm: { hand: [100, 175], side: 1 }, leg: { foot: [118, 98], toe: 250 } }, props: [], freeFeet: true }),
}

/** Asignaciones por nombre exacto: variantes que comparten patrón con una plantilla pero que las reglas generales excluyen. */
const EXACT: Record<string, string> = Object.fromEntries(Object.entries({
  legExtension: ['single-leg leg extension'], calfSeated: ['dumbbell seated one-leg calf raise'], calfStanding: ['rocking standing calf raise'], calfPress: ['calf press', 'calf press on the leg press machine'],
  bridge: ['single leg glute bridge'], dips: ['ring dips'], stepUp: ['step-up with knee raise'], squat: ['chair squat', 'squat with plate movers'], deadlift: ['leverage deadlift'],
  bench: ['board press', 'one arm floor press', 'one-arm kettlebell floor press', 'incline dumbbell bench with palms facing in'], pullover: ['wide-grip decline barbell pullover'],
  hinge: ['good morning off pins', 'hanging bar good morning', 'band good morning (pull through)'], pullThrough: ['pull through'], seatedGoodMorning: ['seated good mornings'],
  skullcrusher: ['cable lying triceps extension', 'incline barbell triceps extension', 'dumbbell tricep extension -pronated grip', 'one arm pronated dumbbell triceps extension', 'one arm supinated dumbbell triceps extension'],
  overheadTriceps: ['low cable triceps extension', 'speed band overhead triceps', 'standing low-pulley one-arm triceps extension'], pushdown: ['cable one arm tricep extension'],
  curl: ['cross body hammer curl'], inclineCurl: ['barbell curls lying against an incline'], preacherCurl: ['standing one-arm dumbbell curl over incline bench'], dragCurl: ['drag curl'], proneCurl: ['dumbbell prone incline curl'],
  lyingCurl: ['lying supine dumbbell curl', 'lying cable curl', 'lying close-grip bar curl on high pulley'], concentrationCurl: ['standing concentration curl'],
  pulldown: ['one arm lat pulldown'], pullup: ['gironda sternum chins'], bentRow: ['barbell rear delt row', 'straight bar bench mid rows'], proneRow: ['lying cambered barbell row'],
  situp: ['janda sit-up', 'weighted sit-ups - with bands'], legRaise: ['bottoms up'], reverseCrunch: ['cable reverse crunch'], tuckCrunch: ['tuck crunch'], vUp: ['jackknife sit-up', 'cocoons'],
  seatedTuck: ['seated leg tucks', 'seated flat bench leg pull-in'], seatedCrunch: ['ab crunch machine', 'cable seated crunch'], cableCrunch: ['standing rope crunch'],
  frontRaise: ['single dumbbell raise'], inclineFrontRaise: ['front incline dumbbell raise'], altPress: ['kettlebell seesaw press'], pushPress: ['double kettlebell push press', 'one-arm kettlebell push press', 'kettlebell thruster'],
  standingPress: ['standing cable chest press'], svend: ['svend press'], kickback_glute: ['leg lift'], donkeyKick: ['glute kickback'], gluteHam: ['glute ham raise', 'natural glute ham raise', 'floor glute-ham raise'],
  reverseHyper: ['reverse hyperextension'], singleLegDeadlift: ['kettlebell one-legged deadlift'], bulgarian: ['one leg barbell squat', 'smith single-leg split squat', 'suspended split squat'], kneelingSquat: ['kneeling squat'],
  jumpSquat: ['freehand jump squat', 'weighted jump squat'],
  wristCurl: ['cable wrist curl', 'finger curls', 'palms-down dumbbell wrist curl over a bench', 'palms-down wrist curl over a bench', 'palms-up barbell wrist curl over a bench', 'palms-up dumbbell wrist curl over a bench', 'seated dumbbell palms-down wrist curl', 'seated dumbbell palms-up wrist curl', 'seated one-arm dumbbell palms-down wrist curl', 'seated one-arm dumbbell palms-up wrist curl', 'seated palm-up barbell wrist curl', 'seated palms-down barbell wrist curl', 'seated two-arm palms-up low-pulley wrist curl', 'standing palms-up barbell behind the back wrist curl'],
}).flatMap(([t, names]) => names.map((nm) => [nm, t])))
export const EXACT_NAMES = Object.keys(EXACT)

const has = (n: string, re: RegExp) => re.test(n)
/** Variantes que la vista de perfil no puede representar bien o cuyo patrón es distinto: se quedan con foto. */
const SKIP = /one[- ]leg|single[- ]leg|pistol|jump|walk(?!ing lunge)|carry|throw|slam|twist|rotation|windmill|get-up|snatch|clean|jerk|swing|sled|rope climb|muscle up|kipping|isometric|plyo|handstand|side (bend|plank|lunge|split)|oblique|around the world|cuban|wiper|crawl|sprint|figure 8|pass (between|through)|pirate|car driver|bradford|rocky|jammer|landmine|chain handle|balance|turkish|bottoms|spell|scaption|pull apart|external|internal|suspended|\brings?\b|board|otis|gorilla|cocoon|jackknife|frog|air bike|heel touch|dead bug|flutter|exercise ball|physioball|bosu|renegade|see-?saw|alternating floor|leg-over|extended range|one arm floor|svend|tate|jm press|anti-gravity|para press|to the side|thruster|speed band/

export function templateFor(x: Exercise): string | null {
  if (x.c !== 'strength' && x.c !== 'powerlifting') return null
  const n = x.e.toLowerCase(), p = x.p[0]
  if (EXACT[n]) return EXACT[n]
  const legs0 = ['quadriceps', 'glutes', 'hamstrings'].includes(p)
  if (legs0 && /^front squat \(clean grip\)$/.test(n)) return 'squatFront' // «clean grip» no es una cargada
  if (/^one-legged cable kickback$|^hip extension with bands$/.test(n)) return 'kickback_glute'
  if (/^standing leg curl$/.test(n)) return 'standingLegCurl'
  if (/^(inverted row( with straps)?|suspended row|bodyweight mid row)$/.test(n)) return 'invertedRow'
  if (p === 'shoulders' && /^(standing )?alternating (dumbbell|kettlebell|cable shoulder) press$/.test(n)) return 'altPress'
  if (has(n, SKIP)) return null
  const legs = ['quadriceps', 'glutes', 'hamstrings'].includes(p)
  if (/^(narrow stance )?leg press$/.test(n)) return 'legPress'
  if (/^leg extensions?$/.test(n)) return 'legExtension'
  if (/lying leg curls?$/.test(n)) return 'legCurlLying'
  if (/^seated leg curl$|seated band hamstring curl/.test(n)) return 'legCurlSeated'
  if (p === 'calves' && /seated calf raise/.test(n)) return 'calfSeated'
  if (p === 'calves' && /calf raise/.test(n) && !/donkey|rocking|reverse|press/.test(n)) return 'calfStanding'
  if (/hip thrust/.test(n)) return 'hipThrust'
  if (p === 'glutes' && /glute bridge|butt lift|hip lift/.test(n)) return 'bridge'
  if (legs && /step ups?$/.test(n)) return 'stepUp'
  if (legs && /lunges?$|rear lunge|back lunge|split squat/.test(n)) return 'lunge'
  if (legs && /front (barbell )?squat|front squats|goblet/.test(n)) return 'squatFront'
  if (legs && /squats?( |$)/.test(n) && !/hack|sissy|jefferson|zercher|kneeling|overhead|lying machine|plie|chair|plate movers|front/.test(n)) return 'squat'
  if (/pullover$/.test(n) && ['chest', 'lats'].includes(p) && !/decline|front raise/.test(n)) return 'pullover'
  if (/^hyperextensions \(back extensions\)$/.test(n)) return 'hyperextension'
  if (/^dumbbell incline row$|^incline bench pull$|^lying t-bar row$/.test(n)) return 'proneRow'
  if (/good morning/.test(n) && !/seated|pins|hanging|pull through/.test(n)) return 'hinge'
  if (/stiff[- ]leg|romanian/.test(n) && /deadlift/.test(n)) return 'hinge'
  if (/deadlift|rack pulls?/.test(n) && !/cable|leverage|side/.test(n)) return 'deadlift'
  if (/push[- ]?ups?/.test(n) && ['chest', 'triceps'].includes(p)) return 'pushup'
  if (/^dips - |parallel bar dip/.test(n)) return 'dips'
  if (p === 'triceps' && /bench dips?$/.test(n)) return 'benchDip'
  if (p === 'chest' && /^(leverage|machine) .*(chest|bench) press|^cable chest press$|^incline cable chest press$/.test(n)) return 'chestPressSeated'
  if (['chest', 'triceps'].includes(p) && /press/.test(n) && /bench|floor|close-grip|neck|guillotine|pin|chain|incline|decline/.test(n) && !/shoulder|cable|leverage|^machine|seated|standing|kettlebell|skull|to chin|behind the head/.test(n)) return 'bench'
  if (p === 'triceps') {
    if (/pushdown/.test(n) && !/incline/.test(n)) return 'pushdown'
    if (/skull ?crusher|lying.*tricep.*(extension|press)|lying triceps press|triceps press to chin|decline (dumbbell|ez bar) triceps extension/.test(n) && !/cable/.test(n)) return 'skullcrusher'
    if (/kickback|bent-over.*triceps extension/.test(n)) return 'kickback'
    if (/overhead.*tricep|tricep.*overhead|standing (dumbbell|one-arm dumbbell|towel|overhead barbell) triceps extension|seated triceps press|dumbbell one-arm triceps extension/.test(n) && !/cable incline|low/.test(n)) return 'overheadTriceps'
    return null
  }
  if (p === 'shoulders') {
    if (/press/.test(n) && !/alternating|one-arm kettlebell|push press|bent press/.test(n)) return 'overheadPress'
    if (/front.*raise|^dumbbell raise$/.test(n) && !/incline|side|lying|pullover/.test(n)) return 'frontRaise'
    if (/face pull/.test(n)) return 'facePull'
    if (/upright.*row/.test(n)) return 'uprightRow'
    return null
  }
  if (p === 'traps' && /upright.*row/.test(n)) return 'uprightRow'
  if (['lats', 'middle back'].includes(p)) {
    if (/straight-arm pulldown/.test(n)) return 'straightArmPulldown'
    if (/pulldowns?( |$)/.test(n) && !/incline|one arm/.test(n)) return 'pulldown'
    if (/pull[- ]?ups?|chin-?ups?|grip chin$/.test(n) && !/scapular|gironda|side to side/.test(n)) return 'pullup'
    if (/^seated cable rows$|seated one-arm cable pulley rows/.test(n)) return 'seatedRow'
    if (/rows?( |$)/.test(n) && /bent[- ]over|one-arm dumbbell row|kettlebell row|t-bar row with handle|long bar row/.test(n)) return 'bentRow'
    return null
  }
  if (p === 'biceps' && /curl/.test(n)) {
    if (/preacher|spider/.test(n)) return 'preacherCurl'
    if (/incline/.test(n) && !/prone|against|over incline/.test(n)) return 'inclineCurl'
    if (/^concentration curls$|^seated close-grip concentration barbell curl$/.test(n)) return 'concentrationCurl'
    if (!/concentration|lying|prone|high cable|overhead|cross body|drag|high bench|against|over incline/.test(n)) return 'curl'
    return null
  }
  if (p === 'abdominals') {
    if (/hanging (leg raise|pike)|knee\/hip raise/.test(n)) return 'hangingLegRaise'
    if (/flat bench lying leg raise|leg pull-in$/.test(n) && !/seated/.test(n)) return 'legRaise'
    if (/sit-?ups?/.test(n) && !/press|bands|janda/.test(n)) return 'situp'
    if (/^reverse crunch$|^bent-knee hip raise$/.test(n)) return 'reverseCrunch'
    if (/^cable crunch$|^rope crunch$/.test(n)) return 'cableCrunch'
    if (/^ab roller$|^barbell ab rollout - on knees$/.test(n)) return 'rollout'
    if (/crunch/.test(n) && !/cable|rope|machine|reverse|standing|kneeling|tuck|cross|legs on|decline/.test(n)) return 'crunch'
  }
  return null
}

const cache = new Map<string, Move | null>()
export function buildMove(x: Exercise): Move | null {
  if (!cache.has(x.id)) { const t = templateFor(x); cache.set(x.id, t ? T[t](x, x.e.toLowerCase()) : null) }
  return cache.get(x.id)!
}
export const TEMPLATE_NAMES = Object.keys(T)

/** ¿Este ejercicio tiene animación esquemática? */
export const animated = (x: Exercise) => x.id in MOVES_IDS || templateFor(x) !== null
