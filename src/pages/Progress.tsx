import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { db, today, uid } from '../lib/db'
import { fmtW, fromDisp, toDisp, useProfile, useSessions } from '../lib/store'
import { exById, useCatalog } from '../lib/catalog'
import { DAY, doneSets, lastTrained, muscleSets, personalRecords, recoveryPct, sessionMinutes, sessionVolume, startOfWeek, toCSV } from '../engine/analytics'
import { MUSCLE, MUSCLES } from '../lib/labels'
import type { Muscle } from '../lib/types'
import { Button, Card, Chip, Empty, Page, Sheet, Stat, cx, inputCls } from '../components/ui'
import { Bars, LineChart } from '../components/Charts'
import { BodyMap } from '../components/BodyMap'
import { download } from './RoutineView'

const PERIODS = [{ k: 7, l: '7 días' }, { k: 30, l: '30 días' }, { k: 90, l: '90 días' }, { k: 0, l: 'Todo' }]

export default function Progress() {
  const profile = useProfile()!, sessions = useSessions(); const { ready } = useCatalog()
  const body = useLiveQuery(() => db.body.orderBy('date').toArray(), [], [])
  const U = profile.units
  const [period, setPeriod] = useState(30)
  const [muscle, setMuscle] = useState<Muscle | null>(null)
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [bw, setBw] = useState('')
  const now = Date.now()
  const inP = useMemo(() => sessions.filter((s) => !period || s.start >= now - period * DAY), [sessions, period]) // eslint-disable-line
  const vol = useMemo(() => (ready ? muscleSets(inP, exById) : {}) as Partial<Record<Muscle, number>>, [inP, ready])
  const max = Math.max(1, ...Object.values(vol))
  const last = useMemo(() => (ready ? lastTrained(sessions, exById) : {}) as Partial<Record<Muscle, number>>, [sessions, ready])
  const prs = useMemo(() => [...personalRecords(sessions).values()].sort((a, b) => b.date - a.date), [sessions])
  const weeks = useMemo(() => Array.from({ length: 8 }, (_, i) => { const a = startOfWeek(now) - (7 - i) * 7 * DAY; return { label: new Date(a).toLocaleDateString('es-MX', { day: 'numeric', month: 'numeric' }), value: sessions.filter((s) => s.start >= a && s.start < a + 7 * DAY).length } }), [sessions]) // eslint-disable-line
  const adherence = Math.round((weeks.slice(-4).reduce((a, w) => a + Math.min(w.value, profile.days), 0) / (profile.days * 4)) * 100)
  const trainedDays = new Set(sessions.map((s) => new Date(s.start).toDateString()))
  const first = (month.getDay() + 6) % 7, dim = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()

  const mInfo = muscle && (() => {
    const t = last[muscle]; const hrs = t ? (now - t) / 3_600_000 : null
    const lastS = t ? sessions.find((s) => (s.end ?? s.start) === t) : null
    const setsThat = lastS ? lastS.items.filter((i) => exById(i.exId)?.p.includes(muscle)).reduce((a, i) => a + i.sets.filter((x) => x.done && !x.warm).length, 0) : 0
    const wk = muscleSets(sessions.filter((s) => s.start >= now - 7 * DAY), exById)[muscle] ?? 0
    const freq = sessions.filter((s) => s.start >= now - 28 * DAY && s.items.some((i) => exById(i.exId)?.p.includes(muscle))).length / 4
    return { hrs, rec: hrs == null ? null : recoveryPct(hrs, setsThat), wk, freq }
  })()

  const addBw = async () => { const v = Number(bw); if (!v || v <= 0 || v > 700) return; const date = today()
    const ex = await db.body.where('date').equals(date).first(); await db.body.put({ id: ex?.id ?? uid(), date, weightKg: fromDisp(v, U) }); setBw('') }

  return (
    <Page title="Progreso" action={<Button size="sm" disabled={!sessions.length} onClick={() => download(`fitness-pro-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + toCSV(sessions.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, sets: i.sets.map((x) => ({ ...x, w: toDisp(x.w, U) })) })) })), exById, U), 'text/csv')}><Download size={16} /> CSV</Button>}>
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Periodo">{PERIODS.map((p) => <Chip key={p.k} on={period === p.k} onClick={() => setPeriod(p.k)}>{p.l}</Chip>)}</div>
        {sessions.length === 0 && <Empty title="Todavía no hay datos">Completa tu primer entrenamiento y aquí verás tu volumen, récords y tendencias.</Empty>}
        <Card className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4">
          <Stat label="entrenamientos" value={inP.length} /><Stat label="horas" value={(inP.reduce((a, s) => a + sessionMinutes(s), 0) / 60).toFixed(1)} />
          <Stat label={`volumen (${U})`} value={Math.round(toDisp(inP.reduce((a, s) => a + sessionVolume(s), 0), U) ?? 0).toLocaleString('es-MX')} />
          <Stat label="series efectivas" value={inP.reduce((a, s) => a + doneSets(s).length, 0)} />
        </Card>
        <Card><div className="flex items-baseline justify-between"><h2 className="font-extrabold">Sesiones por semana</h2><span className="text-sm text-mute">Adherencia 4 sem: <b className="num text-base text-ink">{adherence}%</b></span></div>
          <div className="mt-3"><Bars data={weeks} unit="sesiones" /></div><p className="mt-2 text-xs text-mute">Meta: {profile.days} por semana. Los días de descanso son parte del plan.</p></Card>

        <Card><h2 className="font-extrabold">Distribución muscular</h2><p className="text-sm text-mute">Series en el periodo. Toca un músculo para ver su detalle.</p>
          <div className="mt-2"><BodyMap selected={muscle} onSelect={setMuscle} heat={Object.fromEntries(Object.entries(vol).map(([m, v]) => [m, v / max]))} /></div>
          <ul className="mt-3 space-y-1.5">{MUSCLES.filter((m) => vol[m]).sort((a, b) => vol[b]! - vol[a]!).map((m) => (
            <li key={m}><button onClick={() => setMuscle(m)} className="grid min-h-9 w-full grid-cols-[7.5rem_1fr_2.5rem] items-center gap-2 text-left text-sm"><span className="truncate">{MUSCLE[m]}</span>
              <span className="h-2.5 rounded-full bg-raised"><span className="block h-full rounded-full bg-ember" style={{ width: `${(vol[m]! / max) * 100}%` }} /></span><span className="num text-right text-mute">{Math.round(vol[m]!)}</span></button></li>))}</ul>
        </Card>

        <Card><div className="flex items-center justify-between"><h2 className="font-extrabold capitalize">{month.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</h2>
          <div className="flex"><button aria-label="Mes anterior" className="grid size-11 place-items-center" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button><button aria-label="Mes siguiente" className="grid size-11 place-items-center" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button></div></div>
          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i} className="font-semibold text-mute" aria-hidden>{d}</span>)}
            {Array.from({ length: first }, (_, i) => <span key={'e' + i} />)}
            {Array.from({ length: dim }, (_, i) => { const d = new Date(month.getFullYear(), month.getMonth(), i + 1); const on = trainedDays.has(d.toDateString()); const today = d.toDateString() === new Date().toDateString()
              return <span key={i} aria-label={`${i + 1}${on ? ': entrenaste' : ''}`} className={cx('num grid aspect-square place-items-center rounded-full text-sm', on ? 'bg-ember font-bold text-ember-ink' : '', today && !on && 'ring-2 ring-line')}>{i + 1}</span> })}</div></Card>

        <Card><h2 className="font-extrabold">Peso corporal</h2>
          <div className="mt-2"><LineChart points={body.map((b) => ({ x: new Date(b.date + 'T12:00').getTime(), y: toDisp(b.weightKg, U)! }))} unit={U} /></div>
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); addBw() }}><input className={inputCls} type="number" inputMode="decimal" step="0.1" min={0} aria-label={`Peso de hoy en ${U}`} placeholder={`Peso de hoy (${U})`} value={bw} onChange={(e) => setBw(e.target.value)} /><Button type="submit" variant="primary" disabled={!bw}>Guardar</Button></form></Card>

        <Card><h2 className="font-extrabold">Récords personales</h2>
          {prs.length === 0 ? <p className="mt-2 text-sm text-mute">Tus mejores marcas aparecerán aquí.</p> : <ul className="mt-2 divide-y divide-line">{prs.slice(0, 12).map((p) => <li key={p.exId}><Link to={`/explore/${encodeURIComponent(p.exId)}`} className="flex min-h-12 items-center justify-between gap-3 py-2 text-sm"><span className="min-w-0 truncate">{exById(p.exId)?.n ?? p.exId}</span><span className="num shrink-0 text-right"><b className="text-base">{fmtW(p.weight, U)} × {p.reps}</b><span className="block text-xs text-mute">1RM est. {fmtW(p.e1rm, U)} {U}</span></span></Link></li>)}</ul>}</Card>

        <Card><h2 className="font-extrabold">Historial</h2>
          {inP.length === 0 ? <p className="mt-2 text-sm text-mute">Sin sesiones en este periodo.</p> : <ul className="mt-2 divide-y divide-line">{inP.slice(0, 30).map((s) => <li key={s.id}><Link to={`/session/${s.id}`} className="flex min-h-14 items-center justify-between gap-3 py-2"><span><span className="block font-bold">{s.dayName}</span><span className="text-sm capitalize text-mute">{new Date(s.start).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} · {sessionMinutes(s)} min</span></span><span className="num text-sm text-mute">{doneSets(s).length} series</span></Link></li>)}</ul>}</Card>
      </div>

      <Sheet open={!!muscle} onClose={() => setMuscle(null)} title={muscle ? MUSCLE[muscle] : ''}>
        {mInfo && muscle && <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3"><Stat label="series · 7 días" value={Math.round(mInfo.wk)} /><Stat label="veces / semana" value={mInfo.freq.toFixed(1)} /><Stat label="desde última" value={mInfo.hrs == null ? '—' : mInfo.hrs < 48 ? Math.round(mInfo.hrs) : Math.round(mInfo.hrs / 24)} unit={mInfo.hrs == null ? '' : mInfo.hrs < 48 ? 'h' : 'd'} /></div>
          {mInfo.rec != null && <div><div className="flex justify-between text-sm font-semibold"><span>Recuperación estimada</span><span className="num">{mInfo.rec}%</span></div>
            <div className="mt-1 h-2.5 rounded-full bg-raised"><div className={cx('h-full rounded-full', mInfo.rec >= 100 ? 'bg-ok' : 'bg-amber')} style={{ width: `${mInfo.rec}%` }} /></div>
            <p className="mt-2 text-xs text-mute">Estimación orientativa a partir del tiempo y las series registradas; no es una medición médica. Escucha a tu cuerpo.</p></div>}
          <Link to={`/explore?m=${encodeURIComponent(muscle)}`} className="flex min-h-12 items-center justify-center rounded-2xl bg-ember font-bold text-ember-ink">Ver ejercicios de {MUSCLE[muscle].toLowerCase()}</Link>
        </div>}
      </Sheet>
    </Page>
  )
}
