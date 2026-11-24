import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Download, Play, Plus, Printer, Share2, Star, Trash2 } from 'lucide-react'
import { db, uid } from '../lib/db'
import { startSession, useActive, useProfile } from '../lib/store'
import { exById, useCatalog } from '../lib/catalog'
import { prescribe } from '../engine/prescription'
import type { Routine, RoutineItem } from '../lib/types'
import { Button, Card, Empty, Page, Sheet, inputCls } from '../components/ui'
import { ExercisePicker } from './Explore'

export const download = (name: string, text: string, type = 'application/json') => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
const routineText = (r: Routine) => `${r.name}\n\n` + r.days.map((d) => `${d.name}\n` + d.items.map((i) => `• ${exById(i.exId)?.n ?? i.exId}: ${i.sets} × ${i.repMin}–${i.repMax} (descanso ${i.rest}s)`).join('\n')).join('\n\n')

function NumBox({ label, value, onChange, min = 0, max = 999, step = 1 }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number }) {
  return <label className="block text-center"><span className="block text-[11px] font-semibold uppercase text-mute">{label}</span>
    <input type="number" inputMode="numeric" min={min} max={max} step={step} value={value} className="num mt-1 h-12 w-full rounded-xl border border-line bg-raised text-center text-xl font-bold"
      onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n))) }} /></label>
}

export default function RoutineView() {
  const { id } = useParams(); const nav = useNavigate()
  const profile = useProfile()!, active = useActive()
  useCatalog()
  const r = useLiveQuery(async () => (await db.routines.get(id!)) ?? null, [id], undefined)
  const [addTo, setAddTo] = useState<number | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [note, setNote] = useState('')
  const back = <button onClick={() => nav('/train')} aria-label="Volver" className="grid size-11 shrink-0 place-items-center rounded-full bg-raised"><ArrowLeft size={20} /></button>
  if (r === undefined) return <Page title="Rutina" back={back}><p className="text-mute" role="status">Cargando…</p></Page>
  if (r === null) return <Page title="Rutina" back={back}><Empty title="Esta rutina ya no existe" /></Page>

  const save = (patch: Partial<Routine>) => db.routines.update(r.id, { ...patch, updatedAt: Date.now() })
  const setItems = (di: number, fn: (items: RoutineItem[]) => RoutineItem[]) => save({ days: r.days.map((d, i) => (i === di ? { ...d, items: fn([...d.items]) } : d)) })
  const move = (di: number, i: number, dir: -1 | 1) => setItems(di, (it) => { const j = i + dir; if (j < 0 || j >= it.length) return it;[it[i], it[j]] = [it[j], it[i]]; return it })
  const share = async () => {
    const text = routineText(r)
    try { if (navigator.share) await navigator.share({ title: r.name, text }); else { await navigator.clipboard.writeText(text); setNote('Rutina copiada al portapapeles.') } }
    catch (e: any) { if (e?.name !== 'AbortError') setNote('No se pudo compartir desde este navegador. Usa «Exportar».') }
  }

  return (
    <Page title={r.name} back={back} action={<button aria-label={r.fav ? 'Quitar de favoritas' : 'Marcar como favorita'} aria-pressed={r.fav} onClick={() => save({ fav: !r.fav })} className="grid size-11 shrink-0 place-items-center rounded-full bg-raised"><Star size={20} className={r.fav ? 'text-amber' : ''} fill={r.fav ? 'currentColor' : 'none'} /></button>}>
      <div className="space-y-4">
        <label className="no-print block"><span className="sr-only">Nombre de la rutina</span><input className={inputCls} value={r.name} maxLength={60} onChange={(e) => save({ name: e.target.value })} /></label>
        <div className="no-print flex flex-wrap gap-2">
          <Button size="sm" onClick={share}><Share2 size={16} /> Compartir</Button>
          <Button size="sm" onClick={() => download(`${r.name.replace(/[^\w áéíóúñ-]/gi, '')}.json`, JSON.stringify({ app: 'fitness-pro', routine: r }, null, 2))}><Download size={16} /> Exportar</Button>
          <Button size="sm" onClick={() => window.print()}><Printer size={16} /> Imprimir</Button>
          <Button size="sm" onClick={async () => { const now = Date.now(); const c = { ...r, id: uid(), name: r.name + ' (copia)', fav: false, createdAt: now, updatedAt: now }; await db.routines.put(c); nav(`/routine/${c.id}`) }}><Copy size={16} /> Duplicar</Button>
          <Button size="sm" variant="danger" onClick={() => setConfirm(true)}><Trash2 size={16} /> Eliminar</Button>
        </div>
        {note && <p className="text-sm text-mute" role="status">{note}</p>}

        {r.days.map((d, di) => (
          <Card key={di}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold">{d.name}{r.nextDay % r.days.length === di && <span className="ml-2 rounded-full bg-ember/20 px-2 py-0.5 text-xs text-ember">Siguiente</span>}</h2>
              <Button size="sm" variant="primary" className="no-print" disabled={!!active || d.items.length === 0} onClick={async () => { await startSession(r, di); nav('/workout') }}><Play size={16} fill="currentColor" /> Iniciar</Button>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {d.items.map((it, i) => (
                <li key={it.exId} className="py-3">
                  <div className="flex items-start gap-2">
                    <p className="min-w-0 flex-1 font-bold leading-snug">{exById(it.exId)?.n ?? it.exId}</p>
                    <div className="no-print flex shrink-0">
                      <button aria-label="Subir" disabled={i === 0} onClick={() => move(di, i, -1)} className="grid size-10 place-items-center rounded-full disabled:opacity-30"><ArrowUp size={18} /></button>
                      <button aria-label="Bajar" disabled={i === d.items.length - 1} onClick={() => move(di, i, 1)} className="grid size-10 place-items-center rounded-full disabled:opacity-30"><ArrowDown size={18} /></button>
                      <button aria-label={`Quitar ${exById(it.exId)?.n ?? ''}`} onClick={() => setItems(di, (x) => x.filter((_, j) => j !== i))} className="grid size-10 place-items-center rounded-full text-bad"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    <NumBox label="Series" value={it.sets} min={1} max={10} onChange={(n) => setItems(di, (x) => (x[i] = { ...x[i], sets: n }, x))} />
                    <NumBox label="Reps mín" value={it.repMin} min={1} max={50} onChange={(n) => setItems(di, (x) => (x[i] = { ...x[i], repMin: n, repMax: Math.max(n, x[i].repMax) }, x))} />
                    <NumBox label="Reps máx" value={it.repMax} min={1} max={50} onChange={(n) => setItems(di, (x) => (x[i] = { ...x[i], repMax: n, repMin: Math.min(n, x[i].repMin) }, x))} />
                    <NumBox label="Desc. (s)" value={it.rest} min={0} max={600} step={15} onChange={(n) => setItems(di, (x) => (x[i] = { ...x[i], rest: n }, x))} />
                  </div>
                </li>))}
            </ul>
            {d.items.length === 0 && <p className="mt-2 text-sm text-mute">Este día no tiene ejercicios.</p>}
            <Button size="sm" className="no-print mt-2" onClick={() => setAddTo(di)}><Plus size={16} /> Agregar ejercicio</Button>
          </Card>
        ))}
      </div>

      <Sheet open={addTo !== null} onClose={() => setAddTo(null)} title="Agregar ejercicio">
        <ExercisePicker onPick={(ex) => {
          const di = addTo!
          if (!r.days[di].items.some((i) => i.exId === ex.id)) setItems(di, (x) => [...x, { exId: ex.id, ...prescribe(profile.goal, profile.level, ex.m === 'compound') }])
          setAddTo(null)
        }} />
      </Sheet>
      <Sheet open={confirm} onClose={() => setConfirm(false)} title="¿Eliminar esta rutina?">
        <p className="text-sm text-mute">Tus entrenamientos registrados con ella se conservan en el historial.</p>
        <div className="mt-4 flex gap-3"><Button className="flex-1" onClick={() => setConfirm(false)}>Cancelar</Button>
          <Button variant="danger" className="flex-1" onClick={async () => { await db.routines.delete(r.id); nav('/train') }}>Eliminar rutina</Button></div>
      </Sheet>
    </Page>
  )
}
