import { useEffect, useState } from 'react'
import { Smartphone, Bell, X, Download } from 'lucide-react'
import InstallAppButton from './InstallAppButton'
import { cn } from '@/utils'

const STORAGE_KEY = 'shivsaydri_install_prompt_dismissed'

/**
 * Professional PWA install banner for the public homepage.
 * Shows once per session unless dismissed; never spam after install/dismiss.
 * On iOS (no programmatic prompt) offers Share -> Add to Home Screen steps.
 */
export default function InstallAppPrompt({ className }: { className?: string }) {
  const [canShow, setCanShow] = useState(false)
  const [showIosSteps, setShowIosSteps] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return
    } catch {
      /* ignore */
    }
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }
    // Wait a moment so it doesn't pop immediately; professional timing.
    const t = setTimeout(() => setCanShow(true), 4000)
    return () => clearTimeout(t)
  }, [])

  const dismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    setCanShow(false)
  }

  const handleInstalled = () => {
    setInstalled(true)
    setCanShow(false)
  }

  useEffect(() => {
    window.addEventListener('appinstalled', handleInstalled)
    return () => window.removeEventListener('appinstalled', handleInstalled)
  }, [])

  if (!canShow) return null

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream

  return (
    <div className={cn('rounded-2xl border border-saffron/25 bg-gradient-to-br from-saffron/10 via-cream to-primary-100/40 p-5 shadow-sm', className)}>
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-saffron text-white shadow-lg shadow-saffron/30">
          <Smartphone className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-gray-900">📱 Get the Shivsaydri App</p>
            <button type="button" onClick={dismiss} className="p-1.5 rounded-lg text-gray-400 hover:bg-white hover:text-gray-700 shrink-0" aria-label="Dismiss install notice">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Install the Mandal app for:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li className="flex items-center gap-2"><Bell className="w-4 h-4 text-saffron shrink-0" aria-hidden="true" /> Instant notifications</li>
            <li>• Aarti updates</li>
            <li>• Program announcements</li>
            <li>• Festival updates</li>
            <li>• Member community chat</li>
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <InstallAppButton variant="solid" label="Install App" className="px-5" />
            {isIos && (
              <button type="button" onClick={() => setShowIosSteps((s) => !s)} className="text-sm font-semibold text-saffron inline-flex items-center gap-1">
                <Download className="w-4 h-4" aria-hidden="true" /> iPhone instructions
              </button>
            )}
          </div>
          {showIosSteps && isIos && (
            <ol className="mt-3 list-decimal list-inside space-y-1 text-sm text-gray-600 bg-white/70 rounded-xl p-4 border border-saffron/20">
              <li>Open this page in <b>Safari</b>.</li>
              <li>Tap the <b>Share</b> button <span className="inline-block">↑</span> at the bottom of the screen.</li>
              <li>Choose <b>Add to Home Screen</b>.</li>
              <li>Tap <b>Add</b> — the Mandal app icon will appear on your home screen.</li>
            </ol>
          )}
          {installed && <p className="mt-2 text-sm text-green-700 font-medium">✓ App is installed.</p>}
        </div>
      </div>
    </div>
  )
}