import { useState } from 'react'
import { CloudCheck, CloudOff, RefreshCw } from 'lucide-react'
import { deleteAccount, signIn, signOut, syncNow, useAccount } from '../lib/sync'
import { Button, Card, Field, Sheet, inputCls } from './ui'

/** Formulario de acceso; se usa en Perfil y en el onboarding («Ya tengo cuenta»). */
export function SignInForm({ onDone, initial = 'login' as 'login' | 'register' }: { onDone?: () => void; initial?: 'login' | 'register' }) {
  const [mode, setMode] = useState(initial), [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await signIn(mode, email, password); onDone?.() } catch (x: any) { setErr(x?.message ?? 'No se pudo completar.') } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Correo"><input className={inputCls} type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label="Contraseña" hint={mode === 'register' ? 'Mínimo 10 caracteres. Guárdala bien: todavía no hay recuperación por correo.' : undefined}>
        <input className={inputCls} type="password" required minLength={mode === 'register' ? 10 : 1} maxLength={200} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
      {err && <p className="text-sm text-bad" role="alert">{err}</p>}
      <Button type="submit" variant="primary" className="w-full" disabled={busy}>{busy ? 'Un momento…' : mode === 'register' ? 'Crear cuenta y sincronizar' : 'Iniciar sesión'}</Button>
      <button type="button" className="mx-auto block min-h-11 px-3 text-sm font-semibold text-ember" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr('') }}>
        {mode === 'login' ? '¿No tienes cuenta? Crear una' : 'Ya tengo cuenta'}</button>
    </form>
  )
}

export function AccountCard() {
  const acct = useAccount()
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState(''), [del, setDel] = useState(false), [pw, setPw] = useState('')
  const run = async (fn: () => Promise<void>, ok: string) => { setBusy(true); setMsg(''); try { await fn(); setMsg(ok) } catch (x: any) { setMsg(x?.message ?? 'No se pudo completar.') } finally { setBusy(false) } }
  if (acct === undefined) return null
  return (
    <Card>
      <h2 className="flex items-center gap-2 font-extrabold">{acct ? <CloudCheck size={20} className="text-ok" aria-hidden /> : <CloudOff size={20} className="text-mute" aria-hidden />} Cuenta y sincronización</h2>
      {!acct ? <>
        <p className="mb-4 mt-1 text-sm text-mute">Opcional. Con una cuenta, tus rutinas e historial se respaldan y aparecen en tus otros dispositivos. Sin cuenta, la app funciona igual y todo queda solo aquí.</p>
        <SignInForm initial="register" />
      </> : <>
        <p className="mt-1 text-sm">Sesión iniciada como <b>{acct.email}</b></p>
        <p className="text-sm text-mute" aria-live="polite">{acct.lastSync ? `Última sincronización: ${new Date(acct.lastSync).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}` : 'Aún sin sincronizar.'}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => run(syncNow, 'Sincronizado.')}><RefreshCw size={16} className={busy ? 'animate-spin' : ''} /> Sincronizar ahora</Button>
          <Button disabled={busy} onClick={() => run(signOut, 'Sesión cerrada. Tus datos siguen en este dispositivo.')}>Cerrar sesión</Button>
          <Button variant="danger" disabled={busy} onClick={() => setDel(true)}>Eliminar cuenta</Button>
        </div>
      </>}
      {msg && <p className="mt-3 text-sm" role="status">{msg}</p>}
      <Sheet open={del} onClose={() => setDel(false)} title="¿Eliminar tu cuenta?">
        <p className="text-sm text-mute">Se borran del servidor tu cuenta y todos tus datos sincronizados. Lo que hay en este dispositivo se conserva. No se puede deshacer.</p>
        <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); run(async () => { await deleteAccount(pw); setDel(false); setPw('') }, 'Cuenta eliminada del servidor.') }}>
          <Field label="Confirma tu contraseña"><input className={inputCls} type="password" required autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          {del && msg && <p className="text-sm text-bad" role="alert">{msg}</p>}
          <div className="flex gap-3"><Button type="button" className="flex-1" onClick={() => setDel(false)}>Cancelar</Button><Button type="submit" variant="danger" className="flex-1" disabled={busy}>Eliminar cuenta</Button></div>
        </form>
      </Sheet>
    </Card>
  )
}
