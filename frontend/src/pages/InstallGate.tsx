import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Download, Check, Globe, Smartphone, ChevronRight, Apple, Monitor, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AuthLoadingScreen from '@/components/AuthLoadingScreen'
import { isStandalone, usePWAInstall } from '@/hooks/usePWAInstall'
import { isAdminRole } from '@/types'
import { cn } from '@/utils'
import heroImage from '@/assets/hero.png'

/**
 * App Welcome / Install gate shown at / and /install.
 *
 * The full Mandal website is NEVER rendered here — this is a private app.
 * 1. If the app is already installed (standalone) -> go straight to auth/website.
 * 2. Otherwise offer the official browser install prompt (beforeinstallprompt).
 * 3. If the browser can't install programmatically -> show platform instructions.
 * 4. Continue -> Member Login.
 */
export default function InstallGate() {
  const { profile, loading } = useAuth()
  const nav = useNavigate()
  const { canInstall, installed, checking, installing, promptInstall } = usePWAInstall()
  const [justInstalled, setJustInstalled] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream
  const isAndroid = /Android/i.test(navigator.userAgent)

  // On iPhone there is no browser "Install App" prompt, so surface the
  // Add to Home Screen steps automatically once detection has settled.
  useEffect(() => {
    if (!checking && !installed && !canInstall && isIos) setShowHelp(true)
  }, [checking, installed, canInstall, isIos])

  if (loading) return <AuthLoadingScreen />

  // Already running as an installed PWA -> skip the install screen entirely.
  if (isStandalone()) {
    const target = profile
      ? isAdminRole(profile.role)
        ? '/admin/dashboard'
        : '/home'
      : '/login'
    return <Navigate to={target} replace />
  }

  const appFinished = installed || justInstalled

  const go = () => {
    const target = profile
      ? isAdminRole(profile.role)
        ? '/admin/dashboard'
        : '/home'
      : '/login'
    nav(target, { replace: true })
  }

  const onInstallTap = async () => {
    const ok = await promptInstall()
    if (ok) setJustInstalled(true)
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col overflow-x-hidden">
      {/* Top gradient strip */}
      <div className="h-2 w-full bg-gradient-to-r from-saffron via-orange-600 to-red-600" />

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo + name */}
          <div className="text-center">
            <div className="mx-auto w-24 h-24 rounded-3xl bg-white border border-orange-100 shadow-xl shadow-saffron/20 overflow-hidden p-1.5">
              <img src="/logo.jpeg" alt="Shivsaydri Ganesh Mandal Logo" className="w-full h-full object-contain rounded-2xl" loading="eager" />
            </div>
            <h1 className="mt-4 font-devanagari font-extrabold text-3xl text-gray-900 leading-tight">
              Shivsaydri
              <br />
              Ganesh Mandal
            </h1>
            <p className="mt-1.5 text-saffron font-bold text-sm uppercase tracking-widest">Umarkhanchan</p>
          </div>

          {/* Ganpati image */}
          <div className="relative mt-6 rounded-3xl overflow-hidden shadow-lg shadow-saffron/20">
            <img src={heroImage} alt="Ganpati Bappa" className="w-full h-40 md:h-48 object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <p className="absolute bottom-3 left-0 right-0 text-center text-white font-devanagari font-bold text-lg drop-shadow">
              🙏 गणपती बाप्पा मोरया
            </p>
          </div>

          {/* Tagline card */}
          <div className="card mt-6 p-6 text-center">
            <p className="font-bold text-gray-900 text-lg">Official Ganesh Mandal App</p>
            <p className="text-sm text-gray-500 mt-1">
              Stay connected with Aarti, Programs, Gallery and Mandal updates.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Install the app to access the Mandal website.
            </p>
          </div>

          {/* Install action */}
          <div className="mt-6 space-y-3">
            {appFinished ? (
              <>
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-green-50 border border-green-200 px-4 py-4 text-green-700 font-bold animate-scale-in">
                  <Check className="w-5 h-5" aria-hidden="true" /> App installed successfully
                </div>
                <button type="button" onClick={go} className="btn-primary w-full justify-center py-4 text-lg">
                  Continue <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </button>
              </>
            ) : checking || installing ? (
              <button type="button" disabled className="btn-primary w-full justify-center py-4 text-lg opacity-70">
                <RefreshCw className="w-5 h-5 animate-spin" aria-hidden="true" />
                {installing ? 'Installing…' : 'Preparing…'}
              </button>
            ) : canInstall ? (
              <button type="button" onClick={onInstallTap} className="btn-primary w-full justify-center py-4 text-lg">
                <Download className="w-6 h-6" aria-hidden="true" /> Install App
              </button>
            ) : (
              <button type="button" onClick={() => setShowHelp((s) => !s)} className="btn-primary w-full justify-center py-4 text-lg">
                <Smartphone className="w-6 h-6" aria-hidden="true" /> How to Install
              </button>
            )}

            {!appFinished && !checking && !canInstall && showHelp && (
              <div className="card p-5 space-y-3 animate-scale-in">
                {isIos ? (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Apple className="w-5 h-5 text-gray-700" aria-hidden="true" />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="font-bold text-gray-900 mb-1">iPhone</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Open this page in <b>Safari</b>.</li>
                        <li>Tap the <b>Share</b> button <span className="inline-block">↑</span></li>
                        <li>Choose <b>Add to Home Screen</b>.</li>
                        <li>Tap <b>Add</b> — the Mandal app icon appears on your Home screen.</li>
                        <li>Open the <b>Mandal app icon</b> to enter the app.</li>
                      </ol>
                      <p className="text-xs text-gray-400 mt-2">
                        Tip: if the Share menu looks different, make sure you are using Safari over a secure https link.
                      </p>
                    </div>
                  </div>
                ) : isAndroid ? (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-gray-700" aria-hidden="true" />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="font-bold text-gray-900 mb-1">Android Chrome</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Tap the <b>⋮</b> menu (top right).</li>
                        <li>Tap <b>Add to Home screen</b> / <b>Install app</b>.</li>
                        <li>Confirm <b>Install</b>.</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-gray-700" aria-hidden="true" />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="font-bold text-gray-900 mb-1">Desktop</p>
                      {navigator.userAgent.includes('Edg/') || navigator.userAgent.includes('EdgA/') ? (
                        <p>
                          Click the <b>Install this site as an app</b> icon (~ / ➕) in the address bar.
                        </p>
                      ) : (
                        <p>
                          Use the <b>Install</b> button (monitor/down-arrow icon) in the browser address bar, or open
                          the browser menu (⋮) → <b>Install app</b> / <b>Cast, save, and share</b> →
                          <b> Install page as app</b>.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!appFinished && (
              <button
                type="button"
                onClick={go}
                className="w-full flex items-center justify-center gap-1 py-3 rounded-2xl border border-saffron/40 bg-white text-saffron font-bold text-sm hover:bg-saffron/5"
              >
                <Globe className="w-4 h-4" aria-hidden="true" />
                Already installed? Continue →
              </button>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Private community app — login required to view Mandal content.
          </p>
        </div>
      </main>

      <p className={cn('text-center text-xs text-gray-300 pb-6')}>Shivsaydri Ganesh Mandal • Umarkhanchan</p>
    </div>
  )
}