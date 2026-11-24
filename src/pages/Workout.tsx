import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, Check, ChevronDown, Info, Pause, Play, Plus, Repeat, StickyNote, Timer, Trash2, TrendingUp, X } from 'lucide-react'
import { discardSession, finishSession, fmtW, fromDisp, saveSession, toDisp, useActive, useProfile, useSessions } from '../lib/store'
import { exById, useCatalog } from '../lib/catalog'
import { exerciseHistory, personalRecords } from '../engine/analytics'
import { increment, suggest, type Suggestion } from '../engine/overload'
import { alternatives } from '../engine/generator'
import { prescribe } from '../engine/prescription'
import { e1rm } from '../engine/calc'
import type { Exercise, Session, SessionItem, SetLog } from '../lib/types'
import { Button, Empty, Sheet, cx } from '../components/ui'
import { ExerciseInfo } from './ExerciseDetail'
import { ExercisePicker, ExerciseRow } from './Explore'

const LOWER = new Set(['quadriceps', 'hamstrings', 'glutes', 'calves', 'lower back', 'adductors', 'abductors'])
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

function beep() {
  try {
    const C = window.AudioContext || (window as any).webkitAudioContext; const ctx = new C()
    ;[0, 0.25].forEach((t) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.25, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.2) })
    setTimeout(() => ctx.close(), 800)
  } catch { /* audio no disponible */ }
}

/** Temporizador de descanso basado en hora de fin (sobrevive a recargas y a que la pantalla se bloquee). */
function useRest(sound: boolean) {
  const read = () => { try { return JSON.parse(localStorage.getItem('rest') || 'null') as { end: number; total: number } | null } catch { return null } }
  const [rest, setRest] = useState(read)
  const [now, setNow] = useState(Date.now())
  const fired = useRef(false)
  useEffect(() => { if (!rest) return; const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t) }, [rest])
  const left = rest ? Math.max(0, (rest.end - now) / 1000) : 0
  useEffect(() => {
    if (rest && left <= 0 && !fired.current) { fired.current = true; if (sound) beep(); navigator.vibrate?.([200, 100, 200]) }
  }, [left, rest, sound])
  const set = (v: { end: number; total: number } | null) => { fired.current = false; v ? localStorage.setItem('rest', JSON.stringify(v)) : localStorage.removeItem('rest'); setRest(v); setNow(Date.now()) }
  return { rest, left, start: (sec: number) => sec > 0 && set({ end: Date.now() + sec * 1000, total: sec }), add: (sec: number) => rest && set({ end: Math.max(Date.now(), rest.end) + sec * 1000, total: rest.total + Math.max(0, sec) }), stop: () => set(null) }
}

function NumInput({ value, onChange, label, placeholder, step, decimal }: { value: number | null; onChange: (n: number | null) => void; label: string; placeholder?: string; step: number; decimal?: boolean }) {
  const [txt, setTxt] = useState(value == null ? '' : String(value))
  useEffect(() => { if (value !== (txt === '' ? null : Number(txt))) setTxt(value == null ? '' : String(value)) }, [value]) // eslint-disable-line
  return <input type="number" inputMode={decimal ? 'decimal' : 'numeric'} min={0} step={step} aria-label={label} placeholder={placeholder} value={txt}
    onFocus={(e) => e.target.select()}
    onChange={(e) => { setTxt(e.target.value); const n = e.target.value === '' ? null : Number(e.target.value); onChange(n != null && Number.isFinite(n) && n >= 0 ? n : null) }}
    className="num h-14 w-full min-w-0 rounded-xl border border-line bg-raised text-center text-2xl font-bold placeholder:text-mute/60" />
}

export default function Workout() {
  const s = useActive(), profile = useProfile()!, history = useSessions()
  const { items: catalog } = useCatalog()
  const nav = useNavigate()
  const U = profile.units
  const timer = useRest(profile.restSound)
  const [open, setOpen] = useState(0)
  const [sheet, setSheet] = useState<null | { t: 'info' | 'swap' | 'note' | 'why'; i: number } | { t: 'add' | 'finish' | 'discard' }>(null)
  const [, tick] = useState(0)
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t) }, [])
  // Mantener la pantalla encendida durante el entrenamiento cuando el navegador lo permite
  useEffect(() => { let lock: any; const req = () => (navigator as any).wakeLock?.request('screen').then((l: any) => (lock = l)).catch(() => {}); req(); const v = () => document.visibilityState === 'visible' && req(); document.addEventListener('visibilitychange', v); return () => { document.removeEventListener('visibilitychange', v); lock?.release?.() } }, [])
  const prs = useMemo(() => personalRecords(history), [history])

  if (s === undefined) return <div className="p-8 text-center text-mute" role="status">Cargando…</div>
  if (s === null) return <div className="mx-auto max-w-xl p-6"><Empty title="No hay un entrenamiento en curso"><Button variant="primary" className="mt-3" onClick={() => nav('/train')}>Ir a Entrenar</Button></Empty></div>

  const update = (fn: (d: Session) => void) => { const d: Session = structuredClone(s); fn(d); saveSession(d) }
  const elapsed = ((s.pausedAt ?? Date.now()) - s.start - s.pausedMs) / 1000
  const togglePause = () => update((d) => { if (d.pausedAt) { d.pausedMs += Date.now() - d.pausedAt; d.pausedAt = null } else d.pausedAt = Date.now() })
  const doneCount = s.items.reduce((a, it) => a + it.sets.filter((x) => x.done).length, 0)
  const totalCount = s.items.reduce((a, it) => a + it.sets.length, 0)

  const prev = (exId: string) => exerciseHistory(history, exId)
  const hint = (it: SessionItem, ex: Exercise | undefined): Suggestion | null => {
    if (!ex) return null
    const h = prev(it.exId).map((p) => ({ sets: p.sets.map((x) => ({ ...x, w: toDisp(x.w, U) })) }))
    return suggest(h, it.target, increment(ex.eq, U, LOWER.has(ex.p[0])))
  }
  const completeSet = (ii: number, si: number, prevSet?: SetLog) => {
    const it = s.items[ii], x = it.sets[si]
    if (x.done) return update((d) => { d.items[ii].sets[si].done = false })
    const w = x.w ?? prevSet?.w ?? (si > 0 ? it.sets[si - 1].w : null) ?? 0
    const r = x.r ?? prevSet?.r ?? (si > 0 ? it.sets[si - 1].r : null) ?? it.target.repMin
    update((d) => { Object.assign(d.items[ii].sets[si], { w, r, done: true }) })
    const last = si === it.sets.length - 1
    timer.start(it.target.rest)
    if (last && ii < s.items.length - 1 && it.sets.every((y, j) => j === si || y.done)) setOpen(ii + 1)
  }

  return (
    <div className="mx-auto min-h-dvh max-w-3xl pb-44">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-extrabold">{s.dayName}</h1>
            <p className="num text-sm text-mute" aria-live="off"><span className={s.pausedAt ? 'text-amber' : ''}>{mmss(elapsed)}{s.pausedAt ? ' · en pausa' : ''}</span> · {doneCount}/{totalCount} series</p></div>
          <button onClick={togglePause} aria-label={s.pausedAt ? 'Reanudar' : 'Pausar'} className="grid size-12 place-items-center rounded-full bg-raised">{s.pausedAt ? <Play size={20} /> : <Pause size={20} />}</button>
          <Button variant="primary" onClick={() => setSheet({ t: 'finish' })}>Finalizar</Button>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-raised" role="progressbar" aria-label="Avance de la sesión" aria-valuemin={0} aria-valuemax={totalCount} aria-valuenow={doneCount}><div className="h-full bg-ember transition-all" style={{ width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%` }} /></div>
      </header>

      <div className="space-y-3 px-4 pt-4">
        {s.items.length === 0 && <Empty title="Agrega tu primer ejercicio">Busca en el catálogo y registra tus series.</Empty>}
        {s.items.map((it, ii) => {
          const ex = exById(it.exId); const h = prev(it.exId)[0]; const sug = hint(it, ex); const isOpen = open === ii
          const done = it.sets.filter((x) => x.done).length
          const pr = prs.get(it.exId)
          return (
            <section key={it.exId} className={cx('rounded-card border bg-surface', isOpen ? 'border-ember/60' : 'border-line')}>
              <button className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : ii)}>
                <span className={cx('num grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold', done === it.sets.length && done > 0 ? 'bg-ok text-black' : 'bg-raised')}>{done === it.sets.length && done > 0 ? <Check size={18} /> : ii + 1}</span>
                <span className="min-w-0 flex-1"><span className="line-clamp-2 font-bold leading-snug">{ex?.n ?? it.exId}</span>
                  <span className="num block text-sm text-mute">{it.target.sets} × {it.target.repMin}–{it.target.repMax} · RIR {it.target.rir} · {done}/{it.sets.length}</span></span>
                <ChevronDown className={cx('shrink-0 text-mute transition', isOpen && 'rotate-180')} aria-hidden />
              </button>
              {isOpen && (
                <div className="rise px-3 pb-4">
                  <div className="mb-3 flex gap-1 overflow-x-auto">
                    <Button size="sm" onClick={() => setSheet({ t: 'info', i: ii })}><Info size={16} /> Técnica</Button>
                    <Button size="sm" onClick={() => setSheet({ t: 'swap', i: ii })}><Repeat size={16} /> Sustituir</Button>
                    <Button size="sm" onClick={() => setSheet({ t: 'note', i: ii })}><StickyNote size={16} /> Nota{it.note ? ' •' : ''}</Button>
                    <Button size="sm" aria-label="Mover arriba" disabled={ii === 0} onClick={() => { update((d) => { [d.items[ii - 1], d.items[ii]] = [d.items[ii], d.items[ii - 1]] }); setOpen(ii - 1) }}><ArrowUp size={16} /></Button>
                    <Button size="sm" aria-label="Mover abajo" disabled={ii === s.items.length - 1} onClick={() => { update((d) => { [d.items[ii + 1], d.items[ii]] = [d.items[ii], d.items[ii + 1]] }); setOpen(ii + 1) }}><ArrowDown size={16} /></Button>
                    <Button size="sm" variant="danger" aria-label="Quitar ejercicio" onClick={() => { update((d) => { d.items.splice(ii, 1) }); setOpen(Math.max(0, ii - 1)) }}><Trash2 size={16} /></Button>
                  </div>
                  {sug && sug.action !== 'start' && (
                    <button onClick={() => setSheet({ t: 'why', i: ii })} className="mb-3 flex min-h-12 w-full items-center gap-2 rounded-xl bg-raised px-3 text-left text-sm">
                      <TrendingUp size={18} className={sug.action === 'increase' ? 'text-ok' : 'text-amber'} aria-hidden />
                      <span className="flex-1"><b>{{ increase: 'Sube a', hold: 'Mantén', reduce: 'Baja a', deload: 'Descarga:', start: '' }[sug.action]} {sug.weight} {U}</b> <span className="text-mute">· ¿por qué?</span></span>
                    </button>)}
                  {(h || pr) && <p className="mb-2 px-1 text-xs text-mute">{h && <>Sesión anterior: <span className="num">{h.sets.filter((x) => x.done).map((x) => `${fmtW(x.w, U)}×${x.r}`).join('  ')}</span></>}{pr && <> · Récord: <span className="num">{fmtW(pr.weight, U)}×{pr.reps}</span></>}</p>}
                  <div className="grid grid-cols-[2rem_1fr_1fr_3.5rem_3.5rem] items-center gap-2 px-1 text-center text-[11px] font-semibold uppercase text-mute"><span>#</span><span>{U}</span><span>Reps</span><span>RIR</span><span>Hecho</span></div>
                  {it.sets.map((x, si) => {
                    const p = h?.sets.filter((y) => y.done)[si]
                    const isPr = !!(x.done && !x.warm && x.w && x.r && pr) && e1rm(x.w!, x.r!) > pr!.e1rm + 1e-6
                    return (
                      <div key={si} className={cx('mt-2 grid grid-cols-[2rem_1fr_1fr_3.5rem_3.5rem] items-center gap-2 rounded-xl px-1', x.done && 'opacity-80')}>
                        <button aria-label={`Serie ${si + 1}: ${x.warm ? 'calentamiento' : 'efectiva'}. Cambiar tipo`} onClick={() => update((d) => { d.items[ii].sets[si].warm = !x.warm })} className={cx('num grid h-14 place-items-center rounded-xl text-lg font-bold', x.warm ? 'text-amber' : '')}>{x.warm ? 'C' : si + 1 - it.sets.slice(0, si).filter((y) => y.warm).length}</button>
                        <NumInput label={`Peso serie ${si + 1} (${U})`} step={U === 'kg' ? 0.5 : 1} decimal value={toDisp(x.w, U)} placeholder={p ? fmtW(p.w, U) : sug?.weight != null ? String(sug.weight) : ''} onChange={(n) => update((d) => { d.items[ii].sets[si].w = n == null ? null : fromDisp(n, U) })} />
                        <NumInput label={`Repeticiones serie ${si + 1}`} step={1} value={x.r} placeholder={p?.r != null ? String(p.r) : String(it.target.repMin)} onChange={(n) => update((d) => { d.items[ii].sets[si].r = n == null ? null : Math.round(n) })} />
                        <select aria-label={`RIR serie ${si + 1}`} value={x.rir ?? ''} onChange={(e) => update((d) => { d.items[ii].sets[si].rir = e.target.value === '' ? null : Number(e.target.value) })} className="num h-14 rounded-xl border border-line bg-raised text-center text-lg font-bold">
                          <option value="">–</option>{[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}{n === 5 ? '+' : ''}</option>)}</select>
                        <button aria-label={x.done ? `Desmarcar serie ${si + 1}` : `Completar serie ${si + 1}`} aria-pressed={x.done} onClick={() => completeSet(ii, si, p)}
                          className={cx('relative grid h-14 place-items-center rounded-xl border-2 transition active:scale-95', x.done ? 'border-ok bg-ok text-black' : 'border-line bg-raised text-mute/50')}><Check size={26} strokeWidth={3} />
                          {isPr && <span className="absolute -right-1 -top-2 rounded-full bg-amber px-1.5 text-[10px] font-extrabold text-black">PR</span>}</button>
                      </div>)
                  })}
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => update((d) => { const l = d.items[ii].sets.at(-1); d.items[ii].sets.push({ w: l?.w ?? null, r: null, rir: null, done: false }) })}><Plus size={16} /> Serie</Button>
                    <Button size="sm" className="flex-1" disabled={it.sets.length <= 1} onClick={() => update((d) => { d.items[ii].sets.pop() })}>Quitar última</Button>
                  </div>
                </div>)}
            </section>)
        })}
        <Button className="w-full" size="lg" onClick={() => setSheet({ t: 'add' })}><Plus size={20} /> Agregar ejercicio</Button>
        <button className="mx-auto block min-h-11 px-4 text-sm font-semibold text-mute underline" onClick={() => setSheet({ t: 'discard' })}>Descartar entrenamiento</button>
      </div>

      {timer.rest && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-safe" role="timer" aria-label="Descanso">
          <div className="h-1 bg-raised"><div className="h-full bg-ember transition-all duration-300" style={{ width: `${Math.min(100, (timer.left / timer.rest.total) * 100)}%` }} /></div>
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 pt-3">
            <Timer size={22} className={timer.left <= 0 ? 'text-ok' : 'text-ember'} aria-hidden />
            <span className="num flex-1 text-4xl font-bold" aria-live={timer.left <= 0 ? 'assertive' : 'off'}>{timer.left <= 0 ? '¡Listo!' : mmss(Math.ceil(timer.left))}</span>
            <Button size="sm" onClick={() => timer.add(-15)} aria-label="Restar 15 segundos">−15</Button>
            <Button size="sm" onClick={() => timer.add(15)} aria-label="Sumar 15 segundos">+15</Button>
            <Button size="sm" variant="primary" onClick={timer.stop}>{timer.left <= 0 ? 'Cerrar' : 'Saltar'}</Button>
          </div>
        </div>)}

      <Sheet open={sheet?.t === 'info'} onClose={() => setSheet(null)} title={(sheet && 'i' in sheet && exById(s.items[sheet.i]?.exId)?.n) || 'Técnica'}>
        {sheet && 'i' in sheet && exById(s.items[sheet.i]?.exId) && <ExerciseInfo ex={exById(s.items[sheet.i].exId)!} compact />}
      </Sheet>
      <Sheet open={sheet?.t === 'why'} onClose={() => setSheet(null)} title="Sugerencia de carga">
        {sheet && 'i' in sheet && s.items[sheet.i] && (() => { const g = hint(s.items[sheet.i], exById(s.items[sheet.i].exId)); return g && <>
          <p className="leading-relaxed">{g.reason}</p>
          <p className="mt-3 text-sm text-mute">Es una sugerencia basada en tus registros. Tú decides el peso: la app nunca lo cambia por su cuenta.</p>
          {g.weight != null && <Button variant="primary" className="mt-4 w-full" onClick={() => { const i = sheet.i; update((d) => { for (const x of d.items[i].sets) if (!x.done && !x.warm) x.w = fromDisp(g.weight!, U) }); setSheet(null) }}>Usar {g.weight} {U} en las series pendientes</Button>}</> })()}
      </Sheet>
      <Sheet open={sheet?.t === 'note'} onClose={() => setSheet(null)} title="Nota del ejercicio">
        {sheet && 'i' in sheet && s.items[sheet.i] && <textarea autoFocus rows={4} maxLength={500} aria-label="Nota" defaultValue={s.items[sheet.i].note} onBlur={(e) => { const i = sheet.i, v = e.target.value; update((d) => { d.items[i].note = v }) }} className="w-full rounded-2xl border border-line bg-raised p-4" placeholder="Ej. agarre más cerrado, molestia en la última serie…" />}
        <Button variant="primary" className="mt-3 w-full" onClick={() => setSheet(null)}>Guardar</Button>
      </Sheet>
      <Sheet open={sheet?.t === 'swap'} onClose={() => setSheet(null)} title="Sustituir ejercicio">
        {sheet && 'i' in sheet && (() => { const cur = exById(s.items[sheet.i]?.exId); if (!cur) return null
          const alts = alternatives(cur, catalog, profile.equipment, new Set(s.items.map((x) => x.exId)))
          return alts.length === 0 ? <Empty title="Sin alternativas con tu equipo">Agrega más equipo en tu perfil o elige otro ejercicio manualmente.</Empty> : <>
            <p className="mb-3 text-sm text-mute">Mismo músculo principal que {cur.n}. Las series que ya hiciste se conservan con el ejercicio original.</p>
            <div className="space-y-2">{alts.map((a) => <ExerciseRow key={a.id} ex={a} onPick={(ex) => { const i = sheet.i; update((d) => {
              // Las series ya hechas se quedan con el ejercicio original; las pendientes pasan al sustituto.
              const cur = d.items[i], done = cur.sets.filter((x) => x.done), pending = cur.sets.filter((x) => !x.done).map((x) => ({ ...x, w: null, r: null }))
              const next = { ...cur, exId: ex.id, note: '', sets: pending.length ? pending : [{ w: null, r: null, rir: null, done: false }] }
              if (done.length) d.items.splice(i, 1, { ...cur, sets: done }, next); else d.items[i] = next
            }); if (s.items[sheet.i].sets.some((x) => x.done)) setOpen(sheet.i + 1); setSheet(null) }} />)}</div></> })()}
      </Sheet>
      <Sheet open={sheet?.t === 'add'} onClose={() => setSheet(null)} title="Agregar ejercicio">
        <ExercisePicker onPick={(ex) => {
          if (!s.items.some((i) => i.exId === ex.id)) { const t = prescribe(profile.goal, profile.level, ex.m === 'compound'); update((d) => { d.items.push({ exId: ex.id, target: t, note: '', sets: Array.from({ length: t.sets }, () => ({ w: null, r: null, rir: null, done: false })) }) }); setOpen(s.items.length) }
          setSheet(null) }} />
      </Sheet>
      <Sheet open={sheet?.t === 'finish'} onClose={() => setSheet(null)} title="¿Finalizar entrenamiento?">
        {doneCount === 0 ? <p className="text-sm text-mute">No has completado ninguna serie. Marca al menos una o descarta el entrenamiento.</p>
          : <p className="text-sm text-mute">{doneCount} series completadas{totalCount - doneCount > 0 ? `; las ${totalCount - doneCount} pendientes no se guardarán` : ''}.</p>}
        <div className="mt-4 flex gap-3"><Button className="flex-1" onClick={() => setSheet(null)}>Seguir entrenando</Button>
          <Button variant="primary" className="flex-1" disabled={doneCount === 0} onClick={async () => { const d = await finishSession(s); timer.stop(); nav(`/session/${d.id}`, { replace: true }) }}>Finalizar</Button></div>
      </Sheet>
      <Sheet open={sheet?.t === 'discard'} onClose={() => setSheet(null)} title="¿Descartar entrenamiento?">
        <p className="text-sm text-mute">Se borrarán las series registradas en esta sesión. Esta acción no se puede deshacer.</p>
        <div className="mt-4 flex gap-3"><Button className="flex-1" onClick={() => setSheet(null)}><X size={16} /> Cancelar</Button>
          <Button variant="danger" className="flex-1" onClick={async () => { await discardSession(s.id); timer.stop(); nav('/train', { replace: true }) }}>Descartar</Button></div>
      </Sheet>
    </div>
  )
}
