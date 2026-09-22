import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '@/services/authService'
import { useToast } from '@/components/ToastProvider'
import { validateEmail } from '@/utils'

export default function MemberForgotPassword() {
  const { info: toastInfo } = useToast()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) return setError('Please enter your email address.')
    if (!validateEmail(email.trim())) return setError('Please enter a valid email address.')

    setBusy(true)
    const res = await authService.sendPasswordReset(email.trim())
    setBusy(false)

    // sendPasswordReset only reports rate-limit or network failures, so showing
    // the error never reveals whether an email belongs to an active account.
    if (res.error) {
      setError(res.error)
      return
    }

    // Always show the same friendly confirmation so we never reveal whether an
    // email belongs to an active account.
    setSent(true)
    toastInfo('Password reset instructions have been sent to your email.')
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="bg-white border-b border-orange-100 shadow-sm">
        <div className="container-main px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-saffron flex items-center justify-center">
              <span className="text-white font-bold">श्री</span>
            </div>
            <span className="font-bold text-lg text-gray-900">Shivsaydri Ganesh Mandal</span>
          </Link>
          <Link to="/member/login" className="text-sm text-saffron font-medium hover:underline">
            ← Back to Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-saffron/10 flex items-center justify-center">
              <span className="text-2xl">🔑</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">Forgot Password</h1>
            <p className="text-sm text-gray-500 mt-1">Enter your email and we will send you a reset link.</p>
          </div>

          {sent ? (
            <div className="card p-6 text-center">
              <p className="text-4xl">📧</p>
              <p className="font-semibold text-gray-900 mt-3">Password reset instructions have been sent to your email.</p>
              <p className="text-sm text-gray-500 mt-2">Check your inbox (and spam folder) to continue.</p>
              <Link to="/member/login" className="btn-primary w-full mt-5">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="card p-6 space-y-4">
              <div>
                <label className="label" htmlFor="forgot-email">
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
              )}
              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}