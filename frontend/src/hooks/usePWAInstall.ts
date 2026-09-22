import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Returns true when the app is running as an installed PWA:
 * Android/Chrome uses display-mode: standalone, iOS Safari exposes navigator.standalone.
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export interface PWAInstallState {
  /** True while we wait for beforeinstallprompt / initial detection. */
  checking: boolean
  /** True when the browser has fired beforeinstallprompt (installable now). */
  canInstall: boolean
  /** True when running standalone or appinstalled fired. */
  installed: boolean
  /** True while prompt() is in flight. */
  installing: boolean
  /**
   * Triggers the browser's official install UI.
   * Returns true if the user accepted the installation.
   * Returns null when the browser does not support programmatic install.
   */
  promptInstall: () => Promise<boolean | null>
}

/**
 * Official PWA install flow using the browser's beforeinstallprompt event.
 * Never calls prompt() automatically (requires a user gesture).
 */
export function usePWAInstall(): PWAInstallState {
  const [checking, setChecking] = useState(true)
  const [canInstall, setCanInstall] = useState(false)
  const [installed, setInstalled] = useState<boolean>(() => isStandalone())
  const [installing, setInstalling] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    let active = true
    const onBeforeinstallprompt = (e: Event) => {
      e.preventDefault()
      if (!active) return
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
      setChecking(false)
    }
    const onAppInstalled = () => {
      if (!active) return
      setInstalled(true)
      setDeferredPrompt(null)
      setCanInstall(false)
    }
    // Some browsers already run standalone before the SW/listeners attach.
    // isStandalone() is captured in the lazy initializer above, so there is
    // nothing extra to seed here.
    window.addEventListener('beforeinstallprompt', onBeforeinstallprompt)
    window.addEventListener('appinstalled', onAppInstalled)
    // Fallback: if the event never fires, stop waiting after a short timeout.
    const t = window.setTimeout(() => {
      if (active) setChecking(false)
    }, 1500)
    return () => {
      active = false
      window.clearTimeout(t)
      window.removeEventListener('beforeinstallprompt', onBeforeinstallprompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const promptInstall = async (): Promise<boolean | null> => {
    if (!deferredPrompt) {
      // Not installable programmatically — caller must show platform instructions.
      return null
    }
    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      const accepted = outcome === 'accepted'
      if (accepted) setInstalled(true)
      setDeferredPrompt(null)
      setCanInstall(false)
      return accepted
    } catch {
      return false
    } finally {
      setInstalling(false)
    }
  }

  return { checking, canInstall, installed, installing, promptInstall }
}