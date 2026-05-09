import type { Team } from '@/lib/types'

export function flagSrc(iso: string | null | undefined, size: number = 40): string {
  if (!iso) return ''
  const w = size <= 20 ? 'w20' : size <= 40 ? 'w40' : size <= 80 ? 'w80' : 'w160'
  return `https://flagcdn.com/${w}/${iso.toLowerCase()}.png`
}

export default function Flag({
  team,
  size = 24,
  className = '',
}: {
  team: { iso_code: string | null; name?: string } | null
  size?: number
  className?: string
}) {
  if (!team?.iso_code) {
    return (
      <span
        className={`inline-flex items-center justify-center bg-white/10 border border-white/20 rounded-sm ${className}`}
        style={{ width: size * 1.33, height: size }}
        aria-hidden="true"
        title={team?.name ?? 'sin equipo'}
      >
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" className="opacity-40">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 22v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    )
  }
  
  const displayName = team.name ?? team.iso_code.toUpperCase()
  
  return (
    <img
      src={flagSrc(team.iso_code, size * 2)}
      alt={displayName}
      width={size * 1.33}
      height={size}
      className={`inline-block rounded-sm shadow-sm object-cover ${className}`}
      style={{ width: size * 1.33, height: size }}
      loading="lazy"
      onError={(e) => {
        const target = e.currentTarget
        target.style.display = 'none'
        const fallback = document.createElement('span')
        fallback.className = `inline-flex items-center justify-center bg-white/10 border border-white/20 rounded-sm ${className}`
        fallback.style.width = `${size * 1.33}px`
        fallback.style.height = `${size}px`
        fallback.innerHTML = `<svg width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="none" class="opacity-40"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 22v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        target.parentNode?.insertBefore(fallback, target)
      }}
      title={displayName}
    />
  )
}

export function TeamPill({
  team,
  align = 'left',
  size = 'md',
}: {
  team: Pick<Team, 'iso_code' | 'name'>
  align?: 'left' | 'right'
  size?: 'sm' | 'md'
}) {
  const sizeClasses = size === 'sm'
    ? 'px-2 py-1 gap-1.5 text-[10px]'
    : 'px-3 py-1.5 gap-2 text-xs'
  const flagSize = size === 'sm' ? 14 : 18
  return (
    <div className={`bg-white rounded-full inline-flex items-center font-extrabold tracking-wide text-slate-900 ${sizeClasses} ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      <Flag team={team} size={flagSize} />
      <span className="uppercase truncate">{team.name}</span>
    </div>
  )
}
