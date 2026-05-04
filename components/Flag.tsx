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
  team: Pick<Team, 'iso_code' | 'name'> | null
  size?: number
  className?: string
}) {
  if (!team?.iso_code) {
    return (
      <span
        className={`inline-block bg-white/15 rounded-sm ${className}`}
        style={{ width: size * 1.33, height: size }}
        aria-hidden="true"
        title={team ? `${team.name} - sin iso_code` : 'sin equipo'}
      />
    )
  }
  return (
    <img
      src={flagSrc(team.iso_code, size * 2)}
      alt={team.name}
      width={size * 1.33}
      height={size}
      className={`inline-block rounded-sm shadow-sm object-cover ${className}`}
      style={{ width: size * 1.33, height: size }}
      loading="lazy"
      title={`${team.name} (${team.iso_code})`}
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
