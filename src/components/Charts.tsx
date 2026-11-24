/** Gráficas SVG ligeras (sin dependencias). */
export function LineChart({ points, unit = '', height = 150 }: { points: { x: number; y: number }[]; unit?: string; height?: number }) {
  if (points.length < 2) return <p className="py-8 text-center text-sm text-mute">Se necesitan al menos 2 registros para trazar la tendencia.</p>
  const W = 320, H = height, pad = 26
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y)
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  const sx = (x: number) => pad + ((x - x0) / (x1 - x0 || 1)) * (W - pad * 1.5)
  const sy = (y: number) => H - pad - ((y - y0) / (y1 - y0 || 1)) * (H - pad * 1.8)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(' ')
  const fmt = (t: number) => new Date(t).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  const last = points[points.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Tendencia de ${fmt(x0)} a ${fmt(x1)}: de ${points[0].y.toFixed(1)} a ${last.y.toFixed(1)} ${unit}`}>
      <line x1={pad} x2={W - 8} y1={sy(y0)} y2={sy(y0)} stroke="var(--line)" /><line x1={pad} x2={W - 8} y1={sy(y1)} y2={sy(y1)} stroke="var(--line)" strokeDasharray="3 4" />
      <text x={2} y={sy(y1) + 4} fontSize="10" fill="var(--mute)">{Math.round(y1)}</text><text x={2} y={sy(y0) + 4} fontSize="10" fill="var(--mute)">{Math.round(y0)}</text>
      <path d={d} fill="none" stroke="var(--ember)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={i === points.length - 1 ? 4.5 : 2.5} fill="var(--ember)"><title>{`${fmt(p.x)}: ${p.y.toFixed(1)} ${unit}`}</title></circle>)}
      <text x={pad} y={H - 4} fontSize="10" fill="var(--mute)">{fmt(x0)}</text><text x={W - 8} y={H - 4} fontSize="10" fill="var(--mute)" textAnchor="end">{fmt(x1)}</text>
    </svg>
  )
}

export function Bars({ data, unit = '' }: { data: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex h-36 items-end gap-1.5" role="img" aria-label={data.map((d) => `${d.label}: ${Math.round(d.value)} ${unit}`).join(', ')}>
      {data.map((d, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${d.label}: ${Math.round(d.value)} ${unit}`}>
          <span className="num text-xs text-mute">{d.value ? Math.round(d.value) : ''}</span>
          <div className="w-full rounded-t-md" style={{ height: `${Math.max(2, (d.value / max) * 78)}%`, background: i === data.length - 1 ? 'var(--ember)' : 'var(--line)' }} />
          <span className="text-[10px] font-semibold text-mute">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
