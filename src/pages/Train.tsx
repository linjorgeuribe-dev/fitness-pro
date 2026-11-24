import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ListPlus, Play, Sparkles, Star, Trash2, Upload } from 'lucide-react'
import { db, uid } from '../lib/db'
import { startSession, useActive, useProfile, useRoutines } from '../lib/store'
import { loadCatalog } from '../lib/catalog'
import { generateRoutine } from '../engine/generator'
import { GOAL } from '../lib/labels'
import type { Goal, Routine } from '../lib/types'
import { Button, Card, Chip, Empty, Field, Page, Sheet, inputCls } from '../components/ui'

function validRoutine(r: any): r is Routine {
  return r && typeof r.name === 'string' && Array.isArray(r.days) && r.days.length > 0 && r.days.every((d: any) => typeof d.name === 'string' && Array.isArray(d.items) &&
    d.items.every((i: any) => typeof i.exId === 'string' && [i.sets, i.repMin, i.repMax, i.rest].every((n) => Number.isFinite(n) && n >= 0)))
}

export default function Train() {
  const profile = useProfile()!, routines = useRoutines(), active = useActive()
  const nav = useNavigate()
  const [gen, setGen] = useState(false)
  const [days, setDays] = useState(profile.days), [minutes, setMinutes] = useState(profile.minutes), [goal, setGoal] = useState<Goal>(profile.goal)
  const [msg, setMsg] = useState('')
  const [own, setOwn] = useState(false), [ownName, setOwnName] = useState(''), [ownDays, setOwnDays] = useState(3)
  const [del, setDel] = useState<Routine | null>(null)
  const createOwn = async (e: React.FormEvent) => {
    e.preventDefault()
    const now = Date.now()
    const r: Routine = { id: uid(), name: ownName.trim() || 'Mi rutina', split: 'Personalizada', days: Array.from({ length: ownDays }, (_, i) => ({ name: `Día ${i + 1}`, items: [] })), fav: false, createdAt: now, updatedAt: now, nextDay: 0, generated: false }
    await db.routines.put(r); setOwn(false); setOwnName(''); nav(`/routine/${r.id}`)
  }
  const file = useRef<HTMLInputElement>(null)

  const create = async () => {
    const r = generateRoutine({ ...profile, days, minutes, goal }, await loadCatalog())
    await db.routines.put(r); setGen(false); nav(`/routine/${r.id}`)
  }
  const onImport = async (f?: File) => {
    if (!f) return
    try {
      const data = JSON.parse(await f.text()); const r = data.routine ?? data
      if (!validRoutine(r)) throw new Error()
      const cat = new Set((await loadCatalog()).map((x) => x.id))
      const missing = r.days.flatMap((d) => d.items).filter((i) => !cat.has(i.exId)).length
      if (missing) throw new Error(`La rutina usa ${missing} ejercicios que no existen en el catálogo.`)
      const now = Date.now()
      await db.routines.put({ ...r, id: uid(), fav: false, generated: false, nextDay: 0, createdAt: now, updatedAt: now, split: r.split ?? 'Importada' })
      setMsg(`Rutina «${r.name}» importada.`)
    } catch (e: any) { setMsg(e?.message || 'El archivo no es una rutina válida de Fitness Pro.') }
    if (file.current) file.current.value = ''
  }

  return (
    <Page title="Entrenar">
      <div className="space-y-4">
        {active && <Card className="border-ember bg-ember/10"><p className="font-extrabold">{active.dayName} en curso</p>
          <Button variant="primary" size="lg" className="mt-3 w-full" onClick={() => nav('/workout')}><Play size={20} fill="currentColor" /> Continuar entrenamiento</Button></Card>}

        <Button size="lg" variant="primary" className="w-full" onClick={() => setGen(true)}><Sparkles size={20} /> Generar rutina automática</Button>
        <div className="grid grid-cols-2 gap-3">
          <Button size="lg" onClick={() => setOwn(true)}><ListPlus size={20} /> Crear la mía</Button>
          <Button size="lg" disabled={!!active} onClick={async () => { await startSession(null); nav('/workout') }}>Entreno libre</Button>
        </div>

        <section>
          <div className="mb-2 flex items-center justify-between"><h2 className="font-extrabold">Mis rutinas</h2>
            <button onClick={() => file.current?.click()} className="flex min-h-11 items-center gap-1.5 text-sm font-bold text-ember"><Upload size={16} /> Importar</button>
            <input ref={file} type="file" accept="application/json,.json" className="hidden" aria-label="Importar rutina desde archivo" onChange={(e) => onImport(e.target.files?.[0])} /></div>
          {msg && <p className="mb-2 text-sm text-mute" role="status">{msg}</p>}
          {routines.length === 0 ? <Empty title="Sin rutinas todavía">Genera una rutina a tu medida o importa un archivo compartido.</Empty> : (
            <ul className="space-y-2">{routines.map((r) => (
              <li key={r.id} className="flex items-stretch gap-2"><Link to={`/routine/${r.id}`} className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
                <div className="min-w-0 flex-1"><p className="flex items-center gap-2 truncate font-bold">{r.fav && <Star size={16} className="shrink-0 text-amber" fill="currentColor" aria-label="Favorita" />}{r.name}</p>
                  <p className="truncate text-sm text-mute">{r.days.length} días · siguiente: {r.days[r.nextDay % r.days.length]?.name}</p></div>
                <ChevronRight className="shrink-0 text-mute" aria-hidden /></Link>
                <button aria-label={`Eliminar rutina ${r.name}`} onClick={() => setDel(r)} className="grid w-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface text-bad"><Trash2 size={18} /></button></li>))}</ul>)}
        </section>
      </div>

      <Sheet open={own} onClose={() => setOwn(false)} title="Crear mi rutina">
        <form onSubmit={createOwn} className="space-y-5">
          <Field label="Nombre"><input className={inputCls} maxLength={60} value={ownName} onChange={(e) => setOwnName(e.target.value)} placeholder="Ej. Pierna y glúteo" /></Field>
          <fieldset><legend className="mb-2 text-sm font-semibold">¿Cuántos días distintos tiene?</legend><div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5, 6, 7].map((d) => <Chip key={d} type="button" on={ownDays === d} onClick={() => setOwnDays(d)} aria-label={`${d} ${d === 1 ? 'día' : 'días'}`}>{d}</Chip>)}</div></fieldset>
          <p className="text-sm text-mute">En el siguiente paso eliges los ejercicios de cada día. Después puedes agregar o quitar días.</p>
          <Button type="submit" variant="primary" size="lg" className="w-full">Elegir ejercicios</Button>
        </form>
      </Sheet>
      <Sheet open={!!del} onClose={() => setDel(null)} title="¿Eliminar esta rutina?">
        <p className="text-sm text-mute">Se eliminará «{del?.name}». Tus entrenamientos ya registrados se conservan en el historial.</p>
        <div className="mt-4 flex gap-3"><Button className="flex-1" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" className="flex-1" onClick={async () => { if (del) await db.routines.delete(del.id); setDel(null) }}>Eliminar rutina</Button></div>
      </Sheet>

      <Sheet open={gen} onClose={() => setGen(false)} title="Generar rutina">
        <div className="space-y-5">
          <fieldset><legend className="mb-2 text-sm font-semibold">Objetivo</legend><div className="flex flex-wrap gap-2">{(Object.keys(GOAL) as Goal[]).map((g) => <Chip key={g} on={goal === g} onClick={() => setGoal(g)}>{GOAL[g]}</Chip>)}</div></fieldset>
          <fieldset><legend className="mb-2 text-sm font-semibold">Días por semana</legend><div className="flex gap-2">{[2, 3, 4, 5, 6].map((d) => <Chip key={d} on={days === d} onClick={() => setDays(d)} aria-label={`${d} días`}>{d}</Chip>)}</div></fieldset>
          <fieldset><legend className="mb-2 text-sm font-semibold">Tiempo por sesión</legend><div className="flex flex-wrap gap-2">{[20, 30, 45, 60, 75, 90].map((m) => <Chip key={m} on={minutes === m} onClick={() => setMinutes(m)}>{m} min</Chip>)}</div></fieldset>
          <p className="text-sm text-mute">Se arma con reglas fijas según tu nivel y el equipo de tu perfil ({profile.equipment.length} tipos). Después puedes editar cada ejercicio.</p>
          <Button variant="primary" size="lg" className="w-full" onClick={create}>Crear rutina</Button>
        </div>
      </Sheet>
    </Page>
  )
}
