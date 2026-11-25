import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, Search, SlidersHorizontal, X } from 'lucide-react'
import { searchExercises, useCatalog } from '../lib/catalog'
import { CATEGORY, EQUIP, EQUIPS, LEVEL, MUSCLE, MUSCLES } from '../lib/labels'
import type { Equip, Exercise, Muscle } from '../lib/types'
import { Button, Card, Chip, Empty, Page, Sheet, cx, inputCls } from '../components/ui'
import { ExerciseMedia } from '../components/ExerciseMedia'
import { BodyMap } from '../components/BodyMap'

export function ExerciseRow({ ex, onPick, right, picked }: { ex: Exercise; onPick?: (ex: Exercise) => void; right?: React.ReactNode; picked?: boolean }) {
  const body = <>
    <ExerciseMedia ex={ex} animate={false} className="w-24 shrink-0 !rounded-xl" />
    <div className="min-w-0 flex-1"><p className="line-clamp-2 font-bold leading-snug">{ex.n}</p>
      <p className="mt-0.5 truncate text-sm text-mute">{MUSCLE[ex.p[0]]} · {EQUIP[ex.eq]}</p>
      <p className="text-xs font-semibold text-mute">{LEVEL[ex.lv]}</p></div>{right}
    {picked !== undefined && <span className={cx('grid size-9 shrink-0 place-items-center rounded-full border-2', picked ? 'border-ok bg-ok text-black' : 'border-line text-transparent')} aria-hidden><Check size={18} strokeWidth={3} /></span>}</>
  const cls = cx('flex w-full items-center gap-3 rounded-2xl border bg-surface p-2 text-left', picked ? 'border-ok' : 'border-line')
  return onPick ? <button type="button" className={cls} aria-pressed={picked} onClick={() => onPick(ex)}>{body}</button> : <Link to={`/explore/${encodeURIComponent(ex.id)}`} className={cls}>{body}</Link>
}

/** Al armar una rutina se suelen elegir varios ejercicios del mismo grupo: el selector recuerda músculo y filtros entre aperturas. */
const pickerMemory: { muscle: Muscle | null; eq: Equip[]; lv: number | null; cat: string | null } = { muscle: null, eq: [], lv: null, cat: null }

export function ExercisePicker({ onPick, initialMuscle, selected }: { onPick?: (ex: Exercise) => void; initialMuscle?: Muscle; selected?: Set<string> }) {
  const { items, error, ready } = useCatalog()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(onPick ? '' : params.get('q') ?? '')
  const [muscle, setMuscle] = useState<Muscle | null>(initialMuscle ?? (onPick ? pickerMemory.muscle : (params.get('m') as Muscle | null)))
  const [eq, setEq] = useState<Equip[]>(onPick ? pickerMemory.eq : [])
  const [lv, setLv] = useState<number | null>(onPick ? pickerMemory.lv : null)
  const [cat, setCat] = useState<string | null>(onPick ? pickerMemory.cat : null)
  useEffect(() => { if (onPick) Object.assign(pickerMemory, { muscle, eq, lv, cat }) }, [onPick, muscle, eq, lv, cat])
  const [view, setView] = useState<'list' | 'map'>('list')
  const [filters, setFilters] = useState(false)
  const [limit, setLimit] = useState(30)

  const list = useMemo(() => searchExercises(items, q).filter((x) =>
    (!muscle || x.p.includes(muscle) || x.s.includes(muscle)) && (!eq.length || eq.includes(x.eq)) && (!lv || x.lv === lv) && (!cat || x.c === cat))
    .sort((a, b) => (muscle ? +b.p.includes(muscle) - +a.p.includes(muscle) : 0) || a.n.localeCompare(b.n, 'es')), [items, q, muscle, eq, lv, cat])
  const nFilters = eq.length + (lv ? 1 : 0) + (cat ? 1 : 0)
  const pickMuscle = (m: Muscle | null) => { setMuscle(m); setLimit(30); if (!onPick) setParams(m ? { m } : {}, { replace: true }) }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" aria-hidden />
          <input type="search" aria-label="Buscar ejercicio" placeholder="Buscar: press, sentadilla, curl…" className={cx(inputCls, 'pl-11')} value={q} onChange={(e) => { setQ(e.target.value); setLimit(30) }} /></div>
        <Button onClick={() => setFilters(true)} aria-label={`Filtros${nFilters ? ` (${nFilters} activos)` : ''}`} className="relative"><SlidersHorizontal size={20} />{nFilters > 0 && <span className="num absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-ember text-xs text-ember-ink">{nFilters}</span>}</Button>
      </div>
      <div className="mt-3 flex gap-2" role="tablist" aria-label="Vista">
        <Chip role="tab" aria-selected={view === 'list'} on={view === 'list'} onClick={() => setView('list')}>Lista</Chip>
        <Chip role="tab" aria-selected={view === 'map'} on={view === 'map'} onClick={() => setView('map')}>Mapa muscular</Chip>
        {muscle && <button onClick={() => pickMuscle(null)} className="ml-auto flex min-h-10 items-center gap-1 rounded-full bg-raised px-3 text-sm font-bold">{MUSCLE[muscle]} <X size={16} aria-label="Quitar filtro de músculo" /></button>}
      </div>

      {view === 'map' && <Card className="mt-3"><BodyMap selected={muscle} onSelect={(m) => { pickMuscle(m); setView('list') }} />
        <p className="mt-2 text-center text-sm text-mute">Toca un músculo para ver sus ejercicios.</p></Card>}

      {view === 'list' && <>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Filtrar por músculo">
          {MUSCLES.map((m) => <Chip key={m} on={muscle === m} onClick={() => pickMuscle(muscle === m ? null : m)}>{MUSCLE[m]}</Chip>)}</div>
        <p className="mt-3 text-sm text-mute" aria-live="polite">{ready ? `${list.length} ejercicios` : 'Cargando catálogo…'}</p>
        {error && <p className="mt-3 text-sm text-bad" role="alert">{error}</p>}
        <div className="mt-2 space-y-2">
          {list.slice(0, limit).map((x) => <ExerciseRow key={x.id} ex={x} onPick={onPick} picked={selected ? selected.has(x.id) : undefined} />)}
          {ready && !error && list.length === 0 && <Empty title="Sin resultados">Prueba con otra palabra o quita algún filtro.</Empty>}
          {list.length > limit && <Button className="w-full" onClick={() => setLimit(limit + 30)}>Mostrar más</Button>}
        </div>
      </>}

      <Sheet open={filters} onClose={() => setFilters(false)} title="Filtros">
        <div className="space-y-5">
          <fieldset><legend className="mb-2 text-sm font-semibold">Equipo</legend><div className="flex flex-wrap gap-2">{EQUIPS.map((e) => <Chip key={e} on={eq.includes(e)} onClick={() => setEq(eq.includes(e) ? eq.filter((x) => x !== e) : [...eq, e])}>{EQUIP[e]}</Chip>)}</div></fieldset>
          <fieldset><legend className="mb-2 text-sm font-semibold">Dificultad</legend><div className="flex flex-wrap gap-2">{[1, 2, 3].map((l) => <Chip key={l} on={lv === l} onClick={() => setLv(lv === l ? null : l)}>{LEVEL[l as 1]}</Chip>)}</div></fieldset>
          <fieldset><legend className="mb-2 text-sm font-semibold">Tipo</legend><div className="flex flex-wrap gap-2">{Object.entries(CATEGORY).map(([k, v]) => <Chip key={k} on={cat === k} onClick={() => setCat(cat === k ? null : k)}>{v}</Chip>)}</div></fieldset>
          <div className="flex gap-3"><Button className="flex-1" onClick={() => { setEq([]); setLv(null); setCat(null) }}>Limpiar</Button><Button variant="primary" className="flex-1" onClick={() => setFilters(false)}>Ver {list.length}</Button></div>
        </div>
      </Sheet>
    </div>
  )
}

export default function Explore() { return <Page title="Explorar ejercicios"><ExercisePicker /></Page> }
