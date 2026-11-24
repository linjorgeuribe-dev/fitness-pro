import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Share2, Trash2, Trophy } from 'lucide-react'
import { useState } from 'react'
import { db } from '../lib/db'
import { fmtW, toDisp, useProfile, useSessions } from '../lib/store'
import { exById, useCatalog } from '../lib/catalog'
import { doneSets, personalRecords, sessionMinutes, sessionVolume } from '../engine/analytics'
import { e1rm } from '../engine/calc'
import { Button, Card, Empty, Page, Sheet, Stat } from '../components/ui'

export default function Summary() {
  const { id } = useParams(); const nav = useNavigate()
  const profile = useProfile()!, all = useSessions(); useCatalog()
  const s = useLiveQuery(async () => (await db.sessions.get(id!)) ?? null, [id], undefined)
  const [confirm, setConfirm] = useState(false), [note, setNote] = useState('')
  if (s === undefined) return <Page title="Resumen"><p className="text-mute" role="status">Cargando…</p></Page>
  if (s === null) return <Page title="Resumen"><Empty title="No encontramos esta sesión"><Link to="/progress" className="font-bold text-ember">Ver historial</Link></Empty></Page>
  const U = profile.units
  const before = personalRecords(all.filter((x) => x.start < s.start))
  const prs = s.items.flatMap((it) => {
    const best = Math.max(0, ...it.sets.filter((x) => x.done && !x.warm && x.w && x.r).map((x) => e1rm(x.w!, x.r!))); const b = before.get(it.exId)
    return best > 0 && b && best > b.e1rm + 1e-6 ? [{ exId: it.exId, best }] : []
  })
  const prevSame = all.find((x) => x.start < s.start && x.dayName === s.dayName && x.routineId === s.routineId)
  const vol = toDisp(sessionVolume(s), U) ?? 0, pv = prevSame ? toDisp(sessionVolume(prevSame), U) ?? 0 : null
  const date = new Date(s.start).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
  const share = async () => {
    const text = `${s.dayName} · ${date}\n${sessionMinutes(s)} min · ${doneSets(s).length} series · ${Math.round(vol)} ${U} de volumen\n\n` + s.items.map((it) => `${exById(it.exId)?.n ?? it.exId}: ${it.sets.filter((x) => x.done).map((x) => `${fmtW(x.w, U)}×${x.r}`).join(', ')}`).join('\n')
    try { if (navigator.share) await navigator.share({ title: 'Mi entrenamiento', text }); else { await navigator.clipboard.writeText(text); setNote('Resumen copiado al portapapeles.') } }
    catch (e: any) { if (e?.name !== 'AbortError') setNote('No se pudo compartir desde este navegador.') }
  }
  return (
    <Page title={s.dayName}>
      <p className="-mt-3 mb-4 text-sm capitalize text-mute">{date}</p>
      <div className="space-y-4">
        <Card className="grid grid-cols-3 gap-3"><Stat label="minutos" value={sessionMinutes(s)} /><Stat label="series" value={doneSets(s).length} /><Stat label={`volumen (${U})`} value={Math.round(vol).toLocaleString('es-MX')} /></Card>
        {pv != null && pv > 0 && <Card><p className="text-sm">Frente a tu última sesión de <b>{s.dayName}</b>: <b className={vol >= pv ? 'text-ok' : 'text-amber'}>{vol >= pv ? '+' : ''}{Math.round(((vol - pv) / pv) * 100)}% de volumen</b>. <span className="text-mute">Menos volumen no siempre es peor: también cuentan el descanso y la técnica.</span></p></Card>}
        {prs.length > 0 && <Card className="border-amber/60"><h2 className="flex items-center gap-2 font-extrabold"><Trophy size={20} className="text-amber" aria-hidden /> Nuevos récords (1RM estimado)</h2>
          <ul className="mt-2 space-y-1 text-sm">{prs.map((p) => <li key={p.exId} className="flex justify-between gap-3"><span>{exById(p.exId)?.n}</span><span className="num font-bold">{fmtW(p.best, U)} {U}</span></li>)}</ul></Card>}
        <Card><h2 className="font-extrabold">Detalle</h2>
          <ul className="mt-2 divide-y divide-line">{s.items.map((it) => <li key={it.exId} className="py-3"><Link to={`/explore/${encodeURIComponent(it.exId)}`} className="font-bold">{exById(it.exId)?.n ?? it.exId}</Link>
            <p className="num mt-1 text-sm text-mute">{it.sets.filter((x) => x.done).map((x) => `${x.warm ? 'C ' : ''}${fmtW(x.w, U)}×${x.r}${x.rir != null ? ` (RIR ${x.rir})` : ''}`).join('   ')}</p>
            {it.note && <p className="mt-1 text-sm italic text-mute">«{it.note}»</p>}</li>)}</ul></Card>
        {note && <p className="text-sm text-mute" role="status">{note}</p>}
        <div className="flex gap-3"><Button className="flex-1" onClick={share}><Share2 size={18} /> Compartir</Button><Button variant="primary" className="flex-1" onClick={() => nav('/')}>Listo</Button></div>
        <button className="mx-auto flex min-h-11 items-center gap-2 px-4 text-sm font-semibold text-mute" onClick={() => setConfirm(true)}><Trash2 size={16} /> Eliminar esta sesión</button>
      </div>
      <Sheet open={confirm} onClose={() => setConfirm(false)} title="¿Eliminar esta sesión?">
        <p className="text-sm text-mute">Se quitará de tu historial y de tus estadísticas. No se puede deshacer.</p>
        <div className="mt-4 flex gap-3"><Button className="flex-1" onClick={() => setConfirm(false)}>Cancelar</Button><Button variant="danger" className="flex-1" onClick={async () => { await db.sessions.delete(s.id); nav('/progress', { replace: true }) }}>Eliminar</Button></div>
      </Sheet>
    </Page>
  )
}
