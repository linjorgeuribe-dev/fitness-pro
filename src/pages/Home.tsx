import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Play, TriangleAlert } from 'lucide-react'
import { useActive, useProfile, useRoutinesMaybe, useSessions, startSession } from '../lib/store'
import { exById, useCatalog } from '../lib/catalog'
import { DAY, imbalances, muscleSets, sessionMinutes, startOfWeek } from '../engine/analytics'
import { Button, Card, Page, Stat } from '../components/ui'
import { BodyMap } from '../components/BodyMap'
import { MUSCLE } from '../lib/labels'
import type { Muscle } from '../lib/types'

export default function Home() {
  const profile = useProfile()!, routinesQ = useRoutinesMaybe(), routines = routinesQ ?? [], sessions = useSessions(), active = useActive()
  const { ready } = useCatalog()
  const nav = useNavigate()
  const routine = routines.find((r) => r.fav) ?? routines[0]
  const day = routine?.days[routine.nextDay % routine.days.length]
  const wk = startOfWeek(Date.now())
  const week = sessions.filter((s) => s.start >= wk)
  const vol = useMemo(() => (ready ? muscleSets(sessions.filter((s) => s.start >= Date.now() - 7 * DAY), exById) : {}), [sessions, ready]) as Partial<Record<Muscle, number>>
  const max = Math.max(1, ...Object.values(vol))
  const heat = Object.fromEntries(Object.entries(vol).map(([m, v]) => [m, v / max]))
  const alerts = useMemo(() => (ready ? imbalances(muscleSets(sessions.filter((s) => s.start >= Date.now() - 28 * DAY), exById)) : []), [sessions, ready])
  const top = (Object.entries(vol) as [Muscle, number][]).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const hour = new Date().getHours()

  return (
    <Page title={`${hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'}${profile.name ? ', ' + profile.name : ''}`}>
      <div className="space-y-4">
        {active ? (
          <Card className="rise border-ember bg-ember/10">
            <p className="text-xs font-bold uppercase tracking-wider text-ember">Entrenamiento en curso</p>
            <p className="mt-1 text-xl font-extrabold">{active.dayName}</p>
            <p className="text-sm text-mute">Iniciado hace {sessionMinutes(active)} min · guardado automáticamente</p>
            <Button variant="primary" size="lg" className="mt-4 w-full" onClick={() => nav('/workout')}><Play size={20} fill="currentColor" /> Continuar</Button>
          </Card>
        ) : day ? (
          <Card className="rise">
            <p className="text-xs font-bold uppercase tracking-wider text-mute">Hoy toca · {routine.name}</p>
            <p className="mt-1 text-2xl font-extrabold">{day.name}</p>
            <p className="mt-1 text-sm text-mute">{day.items.length} ejercicios · {day.items.reduce((a, i) => a + i.sets, 0)} series · ~{profile.minutes} min</p>
            <ul className="mt-3 space-y-1 text-sm">{day.items.slice(0, 4).map((i) => <li key={i.exId} className="flex justify-between gap-3"><span className="truncate">{exById(i.exId)?.n ?? '…'}</span><span className="num shrink-0 text-mute">{i.sets} × {i.repMin}–{i.repMax}</span></li>)}
              {day.items.length > 4 && <li className="text-mute">+ {day.items.length - 4} más</li>}</ul>
            <Button variant="primary" size="lg" className="mt-4 w-full" onClick={async () => { await startSession(routine, routine.nextDay % routine.days.length); nav('/workout') }}><Play size={20} fill="currentColor" /> Empezar entrenamiento</Button>
          </Card>
        ) : routinesQ === undefined || active === undefined ? null : (
          <Card><p className="font-bold">Aún no tienes una rutina</p><p className="mt-1 text-sm text-mute">Genera una según tu objetivo o empieza un entrenamiento libre.</p>
            <Link to="/train" className="mt-3 inline-flex min-h-12 items-center gap-2 font-bold text-ember">Ir a Entrenar <ArrowRight size={18} /></Link></Card>
        )}

        <Card>
          <div className="flex items-center justify-between"><h2 className="font-extrabold">Esta semana</h2><Link to="/progress" className="flex min-h-11 items-center text-sm font-bold text-ember">Ver progreso</Link></div>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <Stat label={`de ${profile.days} sesiones`} value={week.length} />
            <Stat label="minutos" value={week.reduce((a, s) => a + sessionMinutes(s), 0)} />
            <Stat label="series" value={week.reduce((a, s) => a + s.items.reduce((b, i) => b + i.sets.filter((x) => x.done && !x.warm).length, 0), 0)} />
          </div>
        </Card>

        <Card>
          <h2 className="font-extrabold">Músculos trabajados · últimos 7 días</h2>
          {top.length === 0 ? <p className="mt-2 text-sm text-mute">Cuando registres tu primer entrenamiento, aquí verás qué zonas has trabajado y cuáles faltan.</p> : (
            <div className="mt-3 grid grid-cols-[1fr_1fr] items-center gap-3">
              <BodyMap compact heat={heat} />
              <ul className="space-y-2 text-sm">{top.map(([m, v]) => <li key={m} className="flex justify-between gap-2"><span>{MUSCLE[m]}</span><span className="num text-mute">{Math.round(v)} series</span></li>)}</ul>
            </div>)}
        </Card>

        {alerts.map((a) => (
          <Card key={a} className="flex gap-3"><TriangleAlert className="mt-0.5 shrink-0 text-amber" size={20} aria-hidden />
            <div><p className="font-bold">Posible desequilibrio (4 semanas)</p><p className="text-sm text-mute">{a} Considera equilibrar el volumen.</p></div></Card>
        ))}
      </div>
    </Page>
  )
}
