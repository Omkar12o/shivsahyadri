import { useEffect, useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { cn } from '@/utils'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Variant = 'solid' | 'outline' | 'ghost' | 'menu'

const VARIANT_CLASS: Record<Variant, string> = {
  solid:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-saffron text-white hover:bg-primary-700 shadow-lg shadow-saffron/30 border-2 border-saffron',
  outline:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-white text-saffron border-2 border-saffron hover:bg-saffron hover:text-white',
  ghost:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-transparent text-gray-600 hover:bg-saffron/10 hover:text-saffron',
  menu:
    'w-full flex items-center justify-center gap-2 rounded-xl bg-saffron text-white hover:bg-primary-700 shadow-lg shadow-saffron/30',
}

export default function InstallAppButton({
  className,
  variant = 'solid',
  label = 'Download App',
  showLabel = true,
}: {
  className?: string
  variant?: Variant
  label?: string
  showLabel?: boolean
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [open, setOpen] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onBeforeinstallprompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const onAppInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
      setOpen(false)
    }
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeinstallprompt)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeinstallprompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const installNow = async () => {
    if (!deferredPrompt) {
      setOpen(true)
      return
    }
    setBusy(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setInstalled(true)
      setDeferredPrompt(null)
    } catch {
      /* user dismissed or prompt failed */
    }
    setBusy(false)
  }

  if (installed) {
    return (
      <span
        className={cn(
          VARIANT_CLASS[variant],
          'bg-green-100 text-green-700 border-green-200 shadow-none hover:bg-green-100! hover:text-green-700!',
          className,
        )}
      >
        <Smartphone className="w-4 h-4" aria-hidden="true" />
        App Installed
      </span>
    )
  }

  return (
    <div className="relative">
      <button type="button" onClick={installNow} className={cn(VARIANT_CLASS[variant], 'px-4 py-2 text-sm font-bold', className)} aria-haspopup="dialog">
        <Download className="w-4 h-4" aria-hidden="true" />
        {showLabel && <span>{label}</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-label="Install app instructions"
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-slide-down"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-saffron to-primary-600 text-white">
              <p className="font-bold text-sm flex items-center gap-2">
                <Download className="w-4 h-4" aria-hidden="true" /> Install the App
              </p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="p-1 rounded-lg hover:bg-white/20">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="p-4 text-sm text-gray-600 space-y-2">
              <p className="font-semibold text-gray-800">This website is a full app — install it for one-tap access & offline support.</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Tap <span className="font-bold">Install Now</span> below.</li>
                <li>If you don't see the option, open the browser menu <span className="font-bold">(⋮ or Share)</span>.</li>
                <li>Choose <span className="font-bold">"Install app"</span> or <span className="font-bold">"Add to Home Screen"</span>.</li>
              </ol>
              <button type="button" onClick={installNow} disabled={busy} className="btn-primary w-full justify-center mt-3">
                {busy ? 'Installing…' : 'Install Now'}
              </button>
              <p className="text-center text-xs text-gray-400">{deferredPrompt ? 'Your browser supports one-tap install.' : 'Use the browser menu to install on this device.'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}