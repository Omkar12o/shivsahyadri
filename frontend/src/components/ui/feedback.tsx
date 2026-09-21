import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Inbox, AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/utils'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-saffron', className)} aria-hidden="true" />
}

export function LoadingScreen({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-gray-500">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-saffron border-t-transparent" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionTo,
  onAction,
}: {
  title: string
  description?: string
  icon?: ReactNode
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/60 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-saffron/10 text-saffron">
        {icon ?? <Inbox className="h-7 w-7" aria-hidden="true" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-gray-500">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary mt-5">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button onClick={onAction} className="btn-primary mt-5">
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/60 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-gray-600">{description}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-5">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  actionTo,
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  actionLabel?: string
  actionTo?: string
  className?: string
}) {
  return (
    <div className={cn('mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        {eyebrow && <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-saffron">{eyebrow}</p>}
        <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-gray-600">{subtitle}</p>}
      </div>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="text-sm font-semibold text-saffron hover:text-primary-700">
          {actionLabel} →
        </Link>
      )}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
