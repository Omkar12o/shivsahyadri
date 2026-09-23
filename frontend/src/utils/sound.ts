let audioCtx: AudioContext | null = null
let interacted = false

function markInteracted() {
  interacted = true
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', markInteracted, { once: true })
  window.addEventListener('keydown', markInteracted, { once: true })
}

const KEY = 'notif-sound'

export function isNotificationSoundEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function setNotificationSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(KEY, enabled ? 'on' : 'off')
  } catch {
    /* ignore storage errors (private mode etc.) */
  }
}

/**
 * Plays a short two-tone "ding". Browsers block autoplay, so this only
 * produces sound after the user has interacted with the page at least once
 * and the sound setting is enabled.
 */
export function playNotificationSound() {
  if (!interacted || !isNotificationSoundEnabled()) return
  try {
    type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext }
    const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext
    if (!Ctor) return
    if (!audioCtx) audioCtx = new Ctor()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    const now = audioCtx.currentTime
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.12)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start(now)
    osc.stop(now + 0.32)
  } catch {
    /* sound is optional - never break the UI */
  }
}