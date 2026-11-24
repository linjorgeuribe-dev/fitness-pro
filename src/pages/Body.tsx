import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, Droplets, Lock, Plus, Trash2 } from 'lucide-react'
import { db, today, uid } from '../lib/db'
import { useProfile } from '../lib/store'
import type { DayLog, FoodEntry, Measure, Photo } from '../lib/types'
import { kcalFromMacros, navyBodyFat, sumFoods, targets } from '../engine/nutrition'
import { Button, Card, Chip, Empty, Field, Page, Sheet, cx, inputCls } from '../components/ui'
import { Bars, LineChart } from '../components/Charts'

const blank = (id: string): DayLog => ({ id, foods: [], waterMl: 0, sleepH: null, energy: null, recovery: null })
const shift = (id: string, n: number) => { const d = new Date(id + 'T12:00'); d.setDate(d.getDate() + n); return today(d) }
const nice = (id: string) => (id === today() ? 'Hoy' : id === shift(today(), -1) ? 'Ayer' : new Date(id + 'T12:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }))

function Meter({ label, value, goal, unit }: { label: string; value: number; goal?: number; unit: string }) {
  const pct = goal ? Math.min(100, (value / goal) * 100) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2"><span className="text-sm font-semibold">{label}</span>
        <span className="num text-lg font-bold">{Math.round(value)}{goal ? <span className="text-sm text-mute"> / {goal}</span> : null} <span className="text-sm text-mute">{unit}</span></span></div>
      {goal ? <div className="mt-1 h-2.5 rounded-full bg-raised" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.round(value)}><div className={cx('h-full rounded-full', value > goal * 1.1 ? 'bg-amber' : 'bg-ember')} style={{ width: `${pct}%` }} /></div> : null}
    </div>
  )
}
const Scale = ({ label, value, onChange }: { label: string; value: number | null; onChange: (n: number | null) => void }) => (
  <fieldset><legend className="mb-2 text-sm font-semibold">{label}</legend>
    <div className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => <Chip key={n} on={value === n} aria-label={`${label}: ${n} de 5`} onClick={() => onChange(value === n ? null : n)}>{n}</Chip>)}</div></fieldset>
)

function Today() {
  const profile = useProfile()!
  const [date, setDate] = useState(today())
  const day = useLiveQuery(async () => (await db.days.get(date)) ?? blank(date), [date], blank(date))
  const week = useLiveQuery(async () => { const ids = Array.from({ length: 7 }, (_, i) => shift(today(), i - 6)); const rows = await db.days.bulkGet(ids); return ids.map((id, i) => ({ id, d: rows[i] })) }, [], [])
  const t = useMemo(() => targets({ ...profile, days: profile.days }), [profile])
  const [f, setF] = useState({ name: '', kcal: '', p: '', c: '', f: '' })
  // Lee y escribe dentro de una transacción: dos toques seguidos no se pisan con un estado de pantalla atrasado.
  const save = (change: (d: DayLog) => Partial<DayLog>) => db.transaction('rw', db.days, async () => { const cur = (await db.days.get(date)) ?? blank(date); await db.days.put({ ...cur, ...change(cur) }) })
  const tot = sumFoods(day.foods)
  const n = (s: string) => Math.max(0, Number(s) || 0)
  const auto = kcalFromMacros(n(f.p), n(f.c), n(f.f))
  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const entry: FoodEntry = { name: f.name.trim().slice(0, 60), kcal: f.kcal === '' ? auto : Math.round(n(f.kcal)), p: n(f.p), c: n(f.c), f: n(f.f) }
    if (!entry.name || (entry.kcal === 0 && entry.p + entry.c + entry.f === 0)) return
    save((d) => ({ foods: [...d.foods, entry] })); setF({ name: '', kcal: '', p: '', c: '', f: '' })
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button aria-label="Día anterior" className="grid size-11 place-items-center rounded-full bg-raised" onClick={() => setDate(shift(date, -1))}><ChevronLeft /></button>
        <p className="font-extrabold capitalize" aria-live="polite">{nice(date)}</p>
        <button aria-label="Día siguiente" disabled={date >= today()} className="grid size-11 place-items-center rounded-full bg-raised disabled:opacity-30" onClick={() => setDate(shift(date, 1))}><ChevronRight /></button>
      </div>

      <Card className="space-y-3">
        <h2 className="font-extrabold">Nutrición</h2>
        <Meter label="Calorías" value={tot.kcal} goal={t?.kcal} unit="kcal" />
        <Meter label="Proteína" value={tot.p} goal={t?.protein} unit="g" />
        <div className="grid grid-cols-2 gap-4"><Meter label="Carbohidratos" value={tot.c} goal={t?.carbs} unit="g" /><Meter label="Grasas" value={tot.f} goal={t?.fat} unit="g" /></div>
        {t ? <>
          <p className="text-xs text-mute">Objetivos orientativos para «{profile.goal === 'fatloss' ? 'reducir grasa' : profile.goal === 'hypertrophy' ? 'ganar músculo' : 'tu objetivo'}»: gasto estimado {t.tdee} kcal/día (Mifflin-St Jeor). Son estimaciones, no una prescripción; ajústalos con un profesional de la nutrición si tienes una condición médica.</p>
          {t.notes.map((x) => <p key={x} className="text-xs text-amber">{x}</p>)}
        </> : <p className="text-sm text-mute">Para ver objetivos de calorías y macros, completa edad, estatura y peso en <Link to="/profile" className="font-bold text-ember">tu perfil</Link>. Mientras tanto puedes registrar lo que comes.</p>}
      </Card>

      <Card>
        <h2 className="font-extrabold">Agregar alimento</h2>
        <form onSubmit={add} className="mt-3 space-y-3">
          <Field label="Alimento o comida"><input className={inputCls} required maxLength={60} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ej. pechuga con arroz" /></Field>
          <div className="grid grid-cols-4 gap-2">
            {([['p', 'Prot. (g)'], ['c', 'Carb. (g)'], ['f', 'Grasa (g)'], ['kcal', 'kcal']] as const).map(([k, l]) => (
              <label key={k} className="block text-center"><span className="block text-[11px] font-semibold uppercase text-mute">{l}</span>
                <input type="number" inputMode="decimal" min={0} max={k === 'kcal' ? 10000 : 1000} step="any" value={f[k]} placeholder={k === 'kcal' && auto ? String(auto) : ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="num mt-1 h-12 w-full rounded-xl border border-line bg-raised text-center text-xl font-bold placeholder:text-mute/60" /></label>))}
          </div>
          <p className="text-xs text-mute">Toma los valores de la etiqueta del producto. Si dejas kcal vacío se calcula con los macros (4/4/9).</p>
          <Button type="submit" variant="primary" className="w-full"><Plus size={18} /> Agregar</Button>
        </form>
        {day.foods.length > 0 && <ul className="mt-4 divide-y divide-line">{day.foods.map((x, i) => (
          <li key={i} className="flex items-center gap-3 py-2"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{x.name}</p><p className="num text-sm text-mute">{x.kcal} kcal · P {x.p} · C {x.c} · G {x.f}</p></div>
            <button aria-label={`Quitar ${x.name}`} className="grid size-11 place-items-center rounded-full text-bad" onClick={() => save((d) => ({ foods: d.foods.filter((_, j) => j !== i) }))}><Trash2 size={18} /></button></li>))}</ul>}
      </Card>

      <Card>
        <h2 className="flex items-center gap-2 font-extrabold"><Droplets size={20} className="text-ember" aria-hidden /> Agua</h2>
        <div className="mt-2"><Meter label="Hoy" value={day.waterMl} goal={t?.waterMl} unit="ml" /></div>
        <div className="mt-3 flex gap-2"><Button className="flex-1" onClick={() => save((d) => ({ waterMl: d.waterMl + 250 }))}>+250 ml</Button><Button className="flex-1" onClick={() => save((d) => ({ waterMl: d.waterMl + 500 }))}>+500 ml</Button>
          <Button aria-label="Restar 250 ml" disabled={day.waterMl <= 0} onClick={() => save((d) => ({ waterMl: Math.max(0, d.waterMl - 250) }))}>−250</Button></div>
        {t && <p className="mt-2 text-xs text-mute">Referencia general (~35 ml por kg); con calor o entrenamientos largos se necesita más.</p>}
      </Card>

      <Card className="space-y-4">
        <h2 className="font-extrabold">Sueño y recuperación</h2>
        <Field label="Horas de sueño (anoche)"><input className={inputCls} type="number" inputMode="decimal" min={0} max={24} step="0.5" value={day.sleepH ?? ''} onChange={(e) => { const v = e.target.value === '' ? null : Math.min(24, Math.max(0, Number(e.target.value))); save(() => ({ sleepH: v })) }} /></Field>
        <Scale label="Nivel de energía" value={day.energy} onChange={(v) => save(() => ({ energy: v }))} />
        <Scale label="Qué tan recuperado te sientes" value={day.recovery} onChange={(v) => save(() => ({ recovery: v }))} />
      </Card>

      <Card><h2 className="font-extrabold">Calorías · últimos 7 días</h2>
        <div className="mt-3"><Bars unit="kcal" data={week.map(({ id, d }) => ({ label: new Date(id + 'T12:00').toLocaleDateString('es-MX', { weekday: 'narrow' }), value: d ? sumFoods(d.foods).kcal : 0 }))} /></div></Card>
    </div>
  )
}

const FIELDS: [keyof Omit<Measure, 'id' | 'date'>, string][] = [['waist', 'Cintura'], ['chest', 'Pecho'], ['hip', 'Cadera'], ['neck', 'Cuello'], ['arm', 'Brazo'], ['thigh', 'Muslo'], ['calf', 'Pantorrilla']]
function Measures() {
  const profile = useProfile()!
  const rows = useLiveQuery(() => db.measures.orderBy('date').toArray(), [], [] as Measure[])
  const [v, setV] = useState<Record<string, string>>({})
  const last = rows[rows.length - 1]
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const m: Measure = { id: (await db.measures.where('date').equals(today()).first())?.id ?? uid(), date: today() }
    for (const [k] of FIELDS) { const n = Number(v[k]); if (v[k] && n > 0 && n < 300) m[k] = Math.round(n * 10) / 10 }
    if (Object.keys(m).length <= 2) return
    await db.measures.put(m); setV({})
  }
  const bf = last && profile.sex && profile.heightCm && last.neck && last.waist ? navyBodyFat(profile.sex, profile.heightCm, last.neck, last.waist, last.hip) : null
  return (
    <div className="space-y-4">
      <Card><h2 className="font-extrabold">Registrar medidas de hoy (cm)</h2>
        <form onSubmit={submit} className="mt-3"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{FIELDS.map(([k, l]) => <Field key={k} label={l}><input className={inputCls} type="number" inputMode="decimal" min={0} max={300} step="0.1" value={v[k] ?? ''} placeholder={last?.[k] != null ? String(last[k]) : ''} onChange={(e) => setV({ ...v, [k]: e.target.value })} /></Field>)}</div>
          <p className="mt-2 text-xs text-mute">Llena solo las que midas. Mide siempre a la misma hora y en el mismo punto.</p>
          <Button type="submit" variant="primary" className="mt-3 w-full">Guardar medidas</Button></form></Card>
      <Card><h2 className="font-extrabold">Composición corporal estimada</h2>
        {bf != null ? <><p className="mt-2"><b className="num text-4xl">{bf}%</b> <span className="text-mute">de grasa corporal</span></p><p className="mt-1 text-xs text-mute">Estimación por circunferencias (método de la Marina de EE. UU.), con error típico de ±3–4 puntos. No es una medición clínica; sirve para ver tendencia, no el valor exacto.</p></>
          : <p className="mt-2 text-sm text-mute">Para estimarla se necesitan cuello y cintura{profile.sex === 'f' ? ', cadera' : ''}, además de estatura y sexo en <Link to="/profile" className="font-bold text-ember">tu perfil</Link>.</p>}</Card>
      <Card><h2 className="font-extrabold">Cintura</h2><div className="mt-2"><LineChart unit="cm" points={rows.filter((r) => r.waist).map((r) => ({ x: new Date(r.date + 'T12:00').getTime(), y: r.waist! }))} /></div></Card>
      <Card><h2 className="font-extrabold">Historial</h2>
        {rows.length === 0 ? <p className="mt-2 text-sm text-mute">Aún no hay medidas registradas.</p> : <ul className="mt-2 divide-y divide-line">{[...rows].reverse().slice(0, 20).map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2"><div className="min-w-0 flex-1"><p className="text-sm font-semibold capitalize">{nice(r.date)}</p><p className="num text-sm text-mute">{FIELDS.filter(([k]) => r[k] != null).map(([k, l]) => `${l} ${r[k]}`).join(' · ')}</p></div>
            <button aria-label={`Eliminar medidas del ${r.date}`} className="grid size-11 place-items-center rounded-full text-bad" onClick={() => db.measures.delete(r.id)}><Trash2 size={18} /></button></li>))}</ul>}</Card>
    </div>
  )
}

/** Reduce la foto a un máximo de 1280 px y JPEG para no llenar el almacenamiento del teléfono. */
async function shrink(file: File): Promise<Blob> {
  const img = await createImageBitmap(file)
  const k = Math.min(1, 1280 / Math.max(img.width, img.height))
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  return new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('No se pudo procesar la imagen'))), 'image/jpeg', 0.82))
}
function Thumb({ p, onOpen }: { p: Photo; onOpen: (url: string) => void }) {
  const [url, setUrl] = useState('')
  useEffect(() => { const u = URL.createObjectURL(p.blob); setUrl(u); return () => URL.revokeObjectURL(u) }, [p.blob])
  return <button className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-raised" onClick={() => url && onOpen(url)} aria-label={`Ver foto del ${p.date}`}>
    {url && <img src={url} alt="" className="size-full object-cover" />}<span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-xs font-semibold capitalize text-white">{nice(p.date)}</span></button>
}
function Photos() {
  const photos = useLiveQuery(() => db.photos.orderBy('date').reverse().toArray(), [], [] as Photo[])
  const input = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState(''), [open, setOpen] = useState<{ url: string; id: string } | null>(null)
  const onFile = async (f?: File) => { if (!f) return; setErr(''); try { await db.photos.put({ id: uid(), date: today(), blob: await shrink(f) }) } catch { setErr('No se pudo guardar la foto. Prueba con otra imagen.') } if (input.current) input.current.value = '' }
  return (
    <div className="space-y-4">
      <Card className="flex gap-3"><Lock size={20} className="mt-0.5 shrink-0 text-ok" aria-hidden /><p className="text-sm text-mute">Tus fotos se guardan <b className="text-ink">solo en este dispositivo</b>: no se suben a tu cuenta, no se sincronizan ni se incluyen en el respaldo. Si borras los datos de la app, se pierden.</p></Card>
      <Button variant="primary" size="lg" className="w-full" onClick={() => input.current?.click()}><Camera size={20} /> Agregar foto de progreso</Button>
      <input ref={input} type="file" accept="image/*" className="hidden" aria-label="Elegir foto de progreso" onChange={(e) => onFile(e.target.files?.[0])} />
      {err && <p className="text-sm text-bad" role="alert">{err}</p>}
      {photos.length === 0 ? <Empty title="Sin fotos todavía">Una foto cada 2–4 semanas, con la misma luz y postura, muestra cambios que la báscula no.</Empty>
        : <div className="grid grid-cols-3 gap-2">{photos.map((p) => <Thumb key={p.id} p={p} onOpen={(url) => setOpen({ url, id: p.id })} />)}</div>}
      <Sheet open={!!open} onClose={() => setOpen(null)} title="Foto de progreso">
        {open && <><img src={open.url} alt="Foto de progreso" className="max-h-[60dvh] w-full rounded-2xl object-contain" />
          <Button variant="danger" className="mt-3 w-full" onClick={async () => { await db.photos.delete(open.id); setOpen(null) }}><Trash2 size={16} /> Eliminar foto</Button></>}
      </Sheet>
    </div>
  )
}

export default function Body() {
  const nav = useNavigate()
  const [tab, setTab] = useState<'hoy' | 'medidas' | 'fotos'>('hoy')
  return (
    <Page title="Nutrición y cuerpo" back={<button onClick={() => nav(-1)} aria-label="Volver" className="grid size-11 shrink-0 place-items-center rounded-full bg-raised"><ArrowLeft size={20} /></button>}>
      <div className="mb-4 flex gap-2" role="tablist">{([['hoy', 'Diario'], ['medidas', 'Medidas'], ['fotos', 'Fotos']] as const).map(([k, l]) => <Chip key={k} role="tab" aria-selected={tab === k} on={tab === k} onClick={() => setTab(k)}>{l}</Chip>)}</div>
      {tab === 'hoy' ? <Today /> : tab === 'medidas' ? <Measures /> : <Photos />}
    </Page>
  )
}
