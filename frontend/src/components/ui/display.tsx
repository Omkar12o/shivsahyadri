import type { ReactNode } from 'react'
import { Music, CalendarDays, Image as ImageIcon, Heart, Users, Megaphone, Globe } from 'lucide-react'
import { cn, getAvatarColor, getInitials } from '@/utils'
import { useCountdown } from '@/hooks'

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-24 w-24 text-2xl',
  }
  return src ? (
    <img
      src={src}
      alt={name}
      className={cn('rounded-2xl object-cover', sizes[size], className)}
      loading="lazy"
    />
  ) : (
    <div
      className={cn(
        'flex items-center justify-center rounded-2xl font-semibold text-white',
        getAvatarColor(name),
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  )
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <span className={cn('badge bg-gray-100 text-gray-700', className)}>{children}</span>
}

export function StatCard({
  label,
  value,
  icon,
  accent = 'saffron',
  hint,
}: {
  label: string
  value: number | string
  icon: ReactNode
  accent?: 'saffron' | 'green' | 'blue' | 'purple' | 'red' | 'amber'
  hint?: string
}) {
  const accents = {
    saffron: 'bg-saffron/10 text-saffron',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
  }
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', accents[accent])}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export const QUICK_ACTION_ICONS: { value: string; label: string; icon: typeof Music }[] = [
  { value: 'music', label: 'Music / Aarti', icon: Music },
  { value: 'calendar', label: 'Calendar / Programs', icon: CalendarDays },
  { value: 'image', label: 'Image / Gallery', icon: ImageIcon },
  { value: 'heart', label: 'Heart / Donation', icon: Heart },
  { value: 'users', label: 'Users / Members', icon: Users },
  { value: 'megaphone', label: 'Megaphone / Announcement', icon: Megaphone },
  { value: 'globe', label: 'Globe / Website', icon: Globe },
]

export function QuickActionIcon({ name, className }: { name: string; className?: string }) {
  const found = QUICK_ACTION_ICONS.find((o) => o.value === name)
  const Icon = found?.icon ?? Heart
  return <Icon className={className} aria-hidden="true" />
}

export function Countdown({ target, className }: { target?: string | null; className?: string }) {
  const countdown = useCountdown(target)

  if (!countdown) return null

  const units = [
    { label: 'Days', value: countdown.days },
    { label: 'Hours', value: countdown.hours },
    { label: 'Minutes', value: countdown.minutes },
    { label: 'Seconds', value: countdown.seconds },
  ]

  return (
    <div className={cn('flex gap-3', className)}>
      {units.map((unit) => (
        <div
          key={unit.label}
          className="flex min-w-[68px] flex-col items-center rounded-2xl bg-white/15 px-3 py-3 backdrop-blur-sm"
        >
          <span className="text-2xl font-bold text-white tabular-nums md:text-3xl">
            {String(unit.value).padStart(2, '0')}
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-white/80">{unit.label}</span>
        </div>
      ))}
    </div>
  )
}
