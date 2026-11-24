import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { X } from 'lucide-react'

const cx = (...a: (string | false | undefined | null)[]) => a.filter(Boolean).join(' ')
export { cx }

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'soft' | 'ghost' | 'danger'; size?: 'md' | 'lg' | 'sm' }
export function Button({ variant = 'soft', size = 'md', className, ...p }: BtnProps) {
  return <button {...p} className={cx(
    'inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[.98] disabled:opacity-40 disabled:pointer-events-none',
    size === 'lg' ? 'min-h-14 px-6 text-base' : size === 'sm' ? 'min-h-10 px-3 text-sm' : 'min-h-12 px-4 text-sm',
    variant === 'primary' && 'bg-ember text-ember-ink',
    variant === 'soft' && 'bg-raised text-ink',
    variant === 'ghost' && 'text-ink hover:bg-raised',
    variant === 'danger' && 'bg-raised text-bad',
    className)} />
}

export function Card({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cx('rounded-card bg-surface border border-line p-4', className)}>{children}</div>
}

export function Chip({ on, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean }) {
  return <button {...p} aria-pressed={on} className={cx('min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition',
    on ? 'bg-ember text-ember-ink border-ember' : 'bg-surface border-line text-ink')}>{children}</button>
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k); document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60" aria-hidden onClick={onClose} />
      <div className="sheet relative max-h-[88dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-surface p-5 pb-safe md:rounded-3xl border border-line">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="grid size-11 place-items-center rounded-full bg-raised"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="rounded-card border border-dashed border-line p-6 text-center"><p className="font-bold">{title}</p><div className="mt-1 text-sm text-mute">{children}</div></div>
}

export function Stat({ label, value, unit }: { label: string; value: ReactNode; unit?: string }) {
  return <div><div className="num text-4xl font-bold leading-none">{value}{unit && <span className="ml-1 text-base text-mute">{unit}</span>}</div><div className="mt-1 text-xs font-semibold uppercase tracking-wider text-mute">{label}</div></div>
}

export function Page({ title, action, children, back }: { title: string; action?: ReactNode; children: ReactNode; back?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 md:pb-10 md:pt-8">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">{back}<h1 className="truncate text-2xl font-extrabold tracking-tight">{title}</h1></div>
        {action}
      </header>
      {children}
    </div>
  )
}

export const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <label className="block"><span className="mb-1.5 block text-sm font-semibold">{label}</span>{children}{hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}</label>
)
export const inputCls = 'w-full min-h-12 rounded-2xl border border-line bg-raised px-4 text-base text-ink placeholder:text-mute'
