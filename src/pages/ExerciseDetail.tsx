import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { loadInstructions, useCatalog } from '../lib/catalog'
import { CATEGORY, EQUIP, FORCE, LEVEL, MECH, MUSCLE } from '../lib/labels'
import { useProfile, useSessions, fmtW } from '../lib/store'
import { prescribe } from '../engine/prescription'
import { exerciseHistory, personalRecords } from '../engine/analytics'
import { e1rm } from '../engine/calc'
import { alternatives } from '../engine/generator'
import { Card, Empty, Page } from '../components/ui'
import { ExerciseFrames, ExerciseMedia } from '../components/ExerciseMedia'
import { BodyMap } from '../components/BodyMap'
import { LineChart } from '../components/Charts'
import { ExerciseRow } from './Explore'
import type { Exercise } from '../lib/types'

export function ExerciseInfo({ ex, compact }: { ex: Exercise; compact?: boolean }) {
  const [steps, setSteps] = useState<string[] | null>(null)
  const [err, setErr] = useState(false)
  useEffect(() => { let on = true; setSteps(null); loadInstructions().then((d) => on && setSteps(d[ex.id] ?? [])).catch(() => on && setErr(true)); return () => { on = false } }, [ex.id])
  return (
    <div className="space-y-4">
      <ExerciseMedia ex={ex} />
      {!compact && <ExerciseFrames ex={ex} />}
      <div className="flex flex-wrap gap-2 text-xs font-bold">
        {[LEVEL[ex.lv], EQUIP[ex.eq], CATEGORY[ex.c], MECH[ex.m], FORCE[ex.f]].filter(Boolean).map((t) => <span key={t} className="rounded-full bg-raised px-3 py-1.5">{t}</span>)}
      </div>
      <Card>
        <h2 className="font-extrabold">Músculos</h2>
        <div className="mt-2 grid grid-cols-2 items-center gap-3">
          <BodyMap compact primary={ex.p} secondary={ex.s} />
          <ul className="space-y-2 text-sm">
            <li><span className="mr-2 inline-block size-3 rounded-full bg-ember" aria-hidden /><b>Principal:</b> {ex.p.map((m) => MUSCLE[m]).join(', ')}</li>
            {ex.s.length > 0 && <li><span className="mr-2 inline-block size-3 rounded-full bg-amber" aria-hidden /><b>Secundarios:</b> {ex.s.map((m) => MUSCLE[m]).join(', ')}</li>}
          </ul>
        </div>
      </Card>
      <Card>
        <h2 className="font-extrabold">Ejecución paso a paso</h2>
        {err ? <p className="mt-2 text-sm text-bad" role="alert">No se pudieron cargar las instrucciones. Revisa tu conexión.</p>
          : !steps ? <p className="mt-2 text-sm text-mute" role="status">Cargando…</p>
          : <ol className="mt-3 space-y-3">{steps.map((s, i) => <li key={i} className="flex gap-3 text-[15px] leading-relaxed"><span className="num grid size-7 shrink-0 place-items-center rounded-full bg-raised text-sm font-bold">{i + 1}</span><span>{s}</span></li>)}</ol>}
      </Card>
    </div>
  )
}

export default function ExerciseDetail() {
  const { id } = useParams(); const nav = useNavigate()
  const { items, ready, error } = useCatalog()
  const profile = useProfile()!, sessions = useSessions()
  const ex = items.find((x) => x.id === id)
  const hist = useMemo(() => (ex ? exerciseHistory(sessions, ex.id) : []), [sessions, ex])
  const alts = useMemo(() => (ex ? alternatives(ex, items, profile.equipment, new Set(), 4) : []), [ex, items, profile.equipment])
  const back = <button onClick={() => nav(-1)} aria-label="Volver" className="grid size-11 shrink-0 place-items-center rounded-full bg-raised"><ArrowLeft size={20} /></button>
  if (!ready) return <Page title="Ejercicio" back={back}><p className="text-mute" role="status">Cargando…</p></Page>
  if (!ex) return <Page title="Ejercicio" back={back}><Empty title={error ?? 'No encontramos este ejercicio'}><Link to="/explore" className="font-bold text-ember">Volver a explorar</Link></Empty></Page>
  const rx = prescribe(profile.goal, profile.level, ex.m === 'compound')
  const pr = personalRecords(sessions).get(ex.id)
  const k = profile.units === 'lb' ? 1 / 0.45359237 : 1
  const pts = [...hist].reverse().map((h) => ({ x: h.date, y: Math.max(0, ...h.sets.filter((s) => s.done && s.w && s.r).map((s) => e1rm(s.w!, s.r!))) * k })).filter((p) => p.y > 0)
  return (
    <Page title={ex.n} back={back}>
      <p className="-mt-3 mb-4 text-sm text-mute" lang="en">{ex.e}</p>
      <div className="space-y-4">
        <ExerciseInfo ex={ex} />
        {ex.c === 'strength' && <Card>
          <h2 className="font-extrabold">Recomendación para tu objetivo</h2>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {[['Series', rx.sets], ['Reps', `${rx.repMin}–${rx.repMax}`], ['Descanso', `${rx.rest}s`], ['RIR', rx.rir]].map(([l, v]) => <div key={l} className="rounded-2xl bg-raised py-3"><div className="num text-2xl font-bold">{v}</div><div className="text-[11px] font-semibold uppercase text-mute">{l}</div></div>)}
          </div>
          <p className="mt-3 text-sm text-mute">Punto de partida orientativo (ACSM/NSCA), no una regla fija. RIR = repeticiones que te quedan «en reserva» al terminar la serie.</p>
        </Card>}
        <Card>
          <h2 className="font-extrabold">Tu historial</h2>
          {hist.length === 0 ? <p className="mt-2 text-sm text-mute">Aún no has registrado este ejercicio.</p> : <>
            {pr && <p className="mt-2 text-sm">Mejor marca: <b className="num text-lg">{fmtW(pr.weight, profile.units)} {profile.units} × {pr.reps}</b> <span className="text-mute">· 1RM estimado {fmtW(pr.e1rm, profile.units)} {profile.units}</span></p>}
            <div className="mt-2"><LineChart points={pts} unit={`${profile.units} (1RM est.)`} /></div>
            <ul className="mt-2 divide-y divide-line text-sm">{hist.slice(0, 5).map((h) => <li key={h.date} className="flex justify-between gap-3 py-2"><span className="text-mute">{new Date(h.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span><span className="num text-right">{h.sets.filter((s) => s.done).map((s) => `${fmtW(s.w, profile.units)}×${s.r ?? '—'}`).join('  ')}</span></li>)}</ul>
          </>}
        </Card>
        {alts.length > 0 && <section><h2 className="mb-2 font-extrabold">Alternativas con tu equipo</h2><div className="space-y-2">{alts.map((a) => <ExerciseRow key={a.id} ex={a} />)}</div></section>}
        <p className="text-xs text-mute">Fotos e instrucciones base: free-exercise-db (dominio público). Traducción revisada automáticamente; estado de contenido: en revisión.</p>
      </div>
    </Page>
  )
}
