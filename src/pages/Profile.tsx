import { useRef, useState } from 'react'
import { db, exportAll, importAll, wipeAll } from '../lib/db'
import { useProfile } from '../lib/store'
import type { Profile } from '../lib/types'
import { Button, Card, Chip, Field, Page, Sheet, inputCls } from '../components/ui'
import { ProfileForm } from './Onboarding'
import { AccountCard } from '../components/AccountCard'
import { useAccount } from '../lib/sync'
import { download } from './RoutineView'
import { e1rm, kgToLb, lbToKg, plates, PLATES_KG, PLATES_LB } from '../engine/calc'

function Tools({ units }: { units: 'kg' | 'lb' }) {
  const [target, setTarget] = useState(units === 'kg' ? '100' : '225'), [bar, setBar] = useState(units === 'kg' ? 20 : 45)
  const [w, setW] = useState(''), [r, setR] = useState(''), [conv, setConv] = useState('')
  const pl = plates(Number(target) || 0, bar, units === 'kg' ? PLATES_KG : PLATES_LB)
  const orm = e1rm(Number(w), Number(r))
  return (
    <div className="space-y-4">
      <Card><h2 className="font-extrabold">Calculadora de discos</h2>
        <div className="mt-3 grid grid-cols-2 gap-3"><Field label={`Peso total (${units})`}><input className={inputCls} type="number" inputMode="decimal" min={0} value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
          <Field label="Barra"><select className={inputCls} value={bar} onChange={(e) => setBar(Number(e.target.value))}>{(units === 'kg' ? [20, 15, 10] : [45, 35, 25]).map((b) => <option key={b} value={b}>{b} {units}</option>)}</select></Field></div>
        <div className="mt-3 flex min-h-12 flex-wrap items-center gap-2" aria-live="polite">{pl.perSide.length === 0 ? <span className="text-sm text-mute">Solo la barra.</span> : <><span className="text-sm text-mute">Por lado:</span>{pl.perSide.map((p, i) => <span key={i} className="num grid h-11 min-w-11 place-items-center rounded-xl bg-ember px-2 text-lg font-bold text-ember-ink">{p}</span>)}</>}</div>
        {!pl.exact && Number(target) > bar && <p className="mt-2 text-sm text-amber">Con discos estándar lo más cercano por debajo es {pl.total} {units}.</p>}</Card>
      <Card><h2 className="font-extrabold">1RM estimado</h2>
        <div className="mt-3 grid grid-cols-2 gap-3"><Field label={`Peso (${units})`}><input className={inputCls} type="number" inputMode="decimal" min={0} value={w} onChange={(e) => setW(e.target.value)} /></Field><Field label="Repeticiones"><input className={inputCls} type="number" inputMode="numeric" min={1} max={30} value={r} onChange={(e) => setR(e.target.value)} /></Field></div>
        {orm > 0 && <><p className="mt-3" aria-live="polite">Estimación: <b className="num text-3xl">{orm.toFixed(1)}</b> {units}</p>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center text-sm">{[95, 90, 85, 80, 75, 70, 65, 60].map((p) => <div key={p} className="rounded-xl bg-raised py-2"><div className="num text-lg font-bold">{(orm * p / 100).toFixed(1)}</div><div className="text-xs text-mute">{p}%</div></div>)}</div>
          <p className="mt-2 text-xs text-mute">Fórmula de Epley. Es una estimación: pierde precisión con más de 10 repeticiones y no sustituye una prueba supervisada.</p></>}</Card>
      <Card><h2 className="font-extrabold">Conversor kg ↔ lb</h2>
        <input className={inputCls + ' mt-3'} type="number" inputMode="decimal" min={0} aria-label="Cantidad a convertir" placeholder="Cantidad" value={conv} onChange={(e) => setConv(e.target.value)} />
        {Number(conv) > 0 && <p className="num mt-3 text-lg" aria-live="polite">{conv} kg = <b>{kgToLb(Number(conv)).toFixed(1)} lb</b> · {conv} lb = <b>{lbToKg(Number(conv)).toFixed(1)} kg</b></p>}</Card>
    </div>
  )
}

export default function ProfilePage() {
  const profile = useProfile()!
  const [tab, setTab] = useState<'perfil' | 'herramientas' | 'datos'>('perfil')
  const [msg, setMsg] = useState(''), [confirm, setConfirm] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const acct = useAccount()
  const set = (patch: Partial<Profile>) => { if (patch.equipment && patch.equipment.length === 0) return; db.profile.update('me', patch) }
  const onImport = async (f?: File) => { if (!f) return; try { await importAll(JSON.parse(await f.text())); setMsg('Respaldo restaurado.') } catch (e: any) { setMsg(e?.message?.startsWith('El archivo') ? e.message : 'No se pudo leer el archivo de respaldo.') } if (file.current) file.current.value = '' }
  return (
    <Page title="Perfil">
      <div className="mb-4 flex gap-2" role="tablist">{(['perfil', 'herramientas', 'datos'] as const).map((t) => <Chip key={t} role="tab" aria-selected={tab === t} on={tab === t} onClick={() => setTab(t)}><span className="capitalize">{t === 'datos' ? 'Ajustes y datos' : t}</span></Chip>)}</div>
      {tab === 'perfil' && <><ProfileForm p={profile} set={set} /><p className="mt-4 text-sm text-mute">Los cambios se guardan al instante. Para aplicar un nuevo objetivo o equipo a tu plan, genera una rutina nueva desde Entrenar.</p></>}
      {tab === 'herramientas' && <Tools units={profile.units} />}
      {tab === 'datos' && <div className="space-y-4">
        <Card><h2 className="font-extrabold">Apariencia y avisos</h2>
          <div className="mt-3 flex gap-2">{(['dark', 'light'] as const).map((t) => <Chip key={t} on={profile.theme === t} onClick={() => set({ theme: t })}>{t === 'dark' ? 'Oscuro' : 'Claro'}</Chip>)}</div>
          <label className="mt-4 flex min-h-12 items-center justify-between gap-3"><span><span className="font-semibold">Sonido al terminar el descanso</span><span className="block text-sm text-mute">También vibra en teléfonos compatibles.</span></span>
            <input type="checkbox" className="size-6 accent-[var(--ember)]" checked={profile.restSound} onChange={(e) => set({ restSound: e.target.checked })} /></label></Card>
        <AccountCard />
        <Card><h2 className="font-extrabold">Tus datos</h2><p className="mt-1 text-sm text-mute">{acct ? 'Tus datos se guardan en este dispositivo y se sincronizan con tu cuenta.' : 'Todo se guarda en este dispositivo; sin cuenta, nada se envía a un servidor. Haz un respaldo antes de cambiar de teléfono o borrar datos del navegador.'}</p>
          <div className="mt-3 flex flex-wrap gap-2"><Button onClick={async () => download(`fitness-pro-respaldo-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(await exportAll()))}>Descargar respaldo</Button>
            <Button onClick={() => file.current?.click()}>Restaurar respaldo</Button><input ref={file} type="file" accept="application/json,.json" className="hidden" aria-label="Archivo de respaldo" onChange={(e) => onImport(e.target.files?.[0])} />
            <Button variant="danger" onClick={() => setConfirm(true)}>Borrar datos de este dispositivo</Button></div>
          {msg && <p className="mt-3 text-sm" role="status">{msg}</p>}</Card>
        <Card><h2 className="font-extrabold">Acerca de</h2><p className="mt-1 text-sm text-mute">Fitness Pro v0.5.1. Catálogo y fotografías: free-exercise-db (dominio público, Unlicense). Las recomendaciones son orientativas y no sustituyen la valoración de un profesional de la salud o del ejercicio.</p></Card>
      </div>}
      <Sheet open={confirm} onClose={() => setConfirm(false)} title="¿Borrar los datos de este dispositivo?">
        <p className="text-sm text-mute">Se eliminarán tu perfil, rutinas e historial de este dispositivo{acct ? ' y se cerrará la sesión; lo ya sincronizado en tu cuenta no se toca' : '. No se puede deshacer; descarga un respaldo antes si quieres conservarlos'}.</p>
        <div className="mt-4 flex gap-3"><Button className="flex-1" onClick={() => setConfirm(false)}>Cancelar</Button><Button variant="danger" className="flex-1" onClick={async () => { if (acct) await fetch('/api/logout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }).catch(() => {}); await wipeAll(); localStorage.clear(); location.href = '/' }}>Borrar todo</Button></div>
      </Sheet>
    </Page>
  )
}
