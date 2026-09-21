import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/utils'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: React.ReactNode
  confirmLabel?: string
  /** When set, the user must type this exact text to enable the confirm button (2-step hard delete). */
  requireText?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  requireText,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (open) setTyped('')
  }, [open])

  if (!open) return null

  const needsText = Boolean(requireText)
  const enabled = !needsText || typed === requireText

  return (
    <div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <div className="text-sm text-gray-600 mt-1">{message}</div>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 text-xl px-1" aria-label="Close">
            ✕
          </button>
        </div>

        {needsText && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Type <span className="font-mono font-bold text-red-600">{requireText}</span> to confirm permanent
              deletion.
            </p>
            <input
              className="input mt-2"
              value={typed}
              autoFocus
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requireText}
            />
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onConfirm}
            disabled={!enabled || busy}
            className={cn(
              'btn-primary flex-1',
              needsText && 'bg-red-600 hover:bg-red-700',
              (!enabled || busy) && 'opacity-50',
            )}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
          <button className="btn-outline" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}