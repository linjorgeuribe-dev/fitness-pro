import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { db, requestPersistence } from '../lib/db'
import { DEFAULT_PROFILE } from '../lib/store'
import type { Equip, Goal, Level, Muscle, Profile } from '../lib/types'
import { EQUIP, EQUIPS, GOAL, LEVEL, MUSCLE } from '../lib/labels'
import { Button, Chip, Field, inputCls, cx } from '../components/ui'
import { loadCatalog } from '../lib/catalog'
import { generateRoutine } from '../engine/generator'
import { lbToKg } from '../engine/calc'

const LEVEL_HELP = { 1: 'Menos de 1 año entrenando con constancia', 2: '1 a 3 años con técnica sólida', 3: 'Más de 3 años y progresión planificada' }
const PRIORITY: Muscle[] = ['chest', 'lats', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals']
const PRESETS: { label: string; eq: Equip[] }[] = [
  { label: 'Gimnasio completo', eq: ['barbell', 'dumbbell', 'cable', 'machine', 'body', 'ezbar', 'kettlebell', 'band', 'medball', 'ball', 'foam', 'other'] },
  { label: 'Casa con mancuernas', eq: ['dumbbell', 'body', 'band'] },
  { label: 'Solo peso corporal', eq: ['body'] },
]

export function ProfileForm({ p, set, step }: { p: Profile; set: (patch: Partial<Profile>) => void; step?: number }) {
  const show = (n: number) => step === undefined || step === n
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const num = (v: string) => (v === '' ? undefined : Math.max(0, Number(v)))
  return (
    <div className="space-y-6">
      {show(0) && <fieldset className="space-y-3"><legend className="mb-3 text-sm font-semibold">Objetivo principal</legend>
        <div className="grid gap-2 sm:grid-cols-2">{(Object.keys(GOAL) as Goal[]).map((g) => (
          <button key={g} type="button" aria-pressed={p.goal === g} onClick={() => set({ goal: g })}
            className={cx('flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left font-bold', p.goal === g ? 'border-ember bg-ember/15' : 'border-line bg-surface')}>
            {GOAL[g]}{p.goal === g && <Check size={18} className="text-ember" aria-hidden />}</button>))}</div></fieldset>}
      {show(1) && <>
        <fieldset><legend className="mb-3 text-sm font-semibold">Experiencia</legend>
          <div className="space-y-2">{([1, 2, 3] as Level[]).map((l) => (
            <button key={l} type="button" aria-pressed={p.level === l} onClick={() => set({ level: l })}
              className={cx('block w-full rounded-2xl border px-4 py-3 text-left', p.level === l ? 'border-ember bg-ember/15' : 'border-line bg-surface')}>
              <span className="font-bold">{LEVEL[l]}</span><span className="block text-sm text-mute">{LEVEL_HELP[l]}</span></button>))}</div></fieldset>
        <fieldset><legend className="mb-3 text-sm font-semibold">Días por semana</legend>
          <div className="flex gap-2">{[2, 3, 4, 5, 6].map((d) => <Chip key={d} type="button" on={p.days === d} onClick={() => set({ days: d })} aria-label={`${d} días`}>{d}</Chip>)}</div></fieldset>
        <fieldset><legend className="mb-3 text-sm font-semibold">Tiempo por sesión</legend>
          <div className="flex flex-wrap gap-2">{[30, 45, 60, 75, 90].map((m) => <Chip key={m} type="button" on={p.minutes === m} onClick={() => set({ minutes: m })}>{m} min</Chip>)}</div></fieldset>
      </>}
      {show(2) && <>
        <fieldset><legend className="mb-3 text-sm font-semibold">Equipo disponible</legend>
          <div className="mb-3 flex flex-wrap gap-2">{PRESETS.map((s) => <Button key={s.label} type="button" size="sm" onClick={() => set({ equipment: s.eq })}>{s.label}</Button>)}</div>
          <div className="flex flex-wrap gap-2">{EQUIPS.map((e) => <Chip key={e} type="button" on={p.equipment.includes(e)} onClick={() => set({ equipment: toggle(p.equipment, e) })}>{EQUIP[e]}</Chip>)}</div>
          {p.equipment.length === 0 && <p className="mt-2 text-sm text-bad" role="alert">Elige al menos una opción (por ejemplo, peso corporal).</p>}</fieldset>
        <fieldset><legend className="mb-1 text-sm font-semibold">Músculos prioritarios <span className="font-normal text-mute">(opcional, máx. 3)</span></legend>
          <div className="mt-2 flex flex-wrap gap-2">{PRIORITY.map((m) => <Chip key={m} type="button" on={p.priority.includes(m)} disabled={!p.priority.includes(m) && p.priority.length >= 3} onClick={() => set({ priority: toggle(p.priority, m) })}>{MUSCLE[m]}</Chip>)}</div></fieldset>
      </>}
      {show(3) && <>
        <Field label="Nombre (opcional)"><input className={inputCls} value={p.name} maxLength={40} autoComplete="given-name" onChange={(e) => set({ name: e.target.value })} /></Field>
        <fieldset><legend className="mb-3 text-sm font-semibold">Unidades</legend>
          <div className="flex gap-2">{(['kg', 'lb'] as const).map((u) => <Chip key={u} type="button" on={p.units === u} onClick={() => set({ units: u })}>{u === 'kg' ? 'Kilogramos' : 'Libras'}</Chip>)}</div></fieldset>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Edad"><input className={inputCls} type="number" inputMode="numeric" min={14} max={99} value={p.age ?? ''} onChange={(e) => set({ age: num(e.target.value) })} /></Field>
          <Field label="Estatura (cm)"><input className={inputCls} type="number" inputMode="numeric" min={100} max={230} value={p.heightCm ?? ''} onChange={(e) => set({ heightCm: num(e.target.value) })} /></Field>
          <Field label={`Peso (${p.units})`}><input className={inputCls} type="number" inputMode="decimal" min={0} step="0.1"
            value={p.weightKg == null ? '' : +(p.units === 'lb' ? p.weightKg / 0.45359237 : p.weightKg).toFixed(1)}
            onChange={(e) => { const v = num(e.target.value); set({ weightKg: v == null ? undefined : p.units === 'lb' ? lbToKg(v) : v }) }} /></Field>
        </div>
        <Field label="Limitaciones físicas (opcional)" hint="Solo para tu referencia. La app no diagnostica ni sustituye a un profesional de la salud.">
          <input className={inputCls} value={p.limitations} maxLength={200} onChange={(e) => set({ limitations: e.target.value })} placeholder="Ej. molestia en hombro derecho" /></Field>
      </>}
    </div>
  )
}

const TITLES = ['¿Qué quieres lograr?', 'Tu experiencia y tu semana', '¿Con qué entrenas?', 'Últimos datos']

export default function Onboarding() {
  const [p, setP] = useState<Profile>({ ...DEFAULT_PROFILE })
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }))
  const finish = async () => {
    setBusy(true); setErr('')
    try {
      const profile = { ...p, createdAt: Date.now() }
      const catalog = await loadCatalog()
      const routine = generateRoutine(profile, catalog)
      await db.transaction('rw', db.profile, db.routines, async () => { await db.profile.put(profile); await db.routines.put(routine) })
      requestPersistence()
    } catch { setErr('No se pudo guardar tu perfil. Revisa tu conexión e inténtalo de nuevo.'); setBusy(false) }
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pb-6 pt-8" data-theme="dark">
      <div className="mb-6 flex items-center gap-3"><img src="/icon.svg" alt="" className="size-9" /><span className="text-lg font-extrabold">Fitness Pro</span>
        <span className="ml-auto text-sm font-semibold text-mute" aria-live="polite">Paso {step + 1} de 4</span></div>
      <div className="mb-6 h-1.5 rounded-full bg-raised" aria-hidden><div className="h-full rounded-full bg-ember transition-all" style={{ width: `${(step + 1) * 25}%` }} /></div>
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">{TITLES[step]}</h1>
      <div className="rise flex-1" key={step}><ProfileForm p={p} set={set} step={step} /></div>
      {err && <p className="mt-4 text-sm text-bad" role="alert">{err}</p>}
      <div className="sticky bottom-0 mt-6 flex gap-3 bg-bg py-3">
        {step > 0 && <Button size="lg" onClick={() => setStep(step - 1)} aria-label="Atrás"><ArrowLeft size={20} /></Button>}
        {step < 3
          ? <Button size="lg" variant="primary" className="flex-1" disabled={step === 2 && p.equipment.length === 0} onClick={() => setStep(step + 1)}>Continuar <ArrowRight size={20} /></Button>
          : <Button size="lg" variant="primary" className="flex-1" disabled={busy} onClick={finish}>{busy ? 'Creando tu rutina…' : 'Crear mi rutina'}</Button>}
      </div>
    </main>
  )
}
