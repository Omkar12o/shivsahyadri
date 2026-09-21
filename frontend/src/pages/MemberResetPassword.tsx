import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { validatePassword } from '@/utils'

export default function MemberResetPassword() {
  const { changePassword } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const nav = useNavigate()

  const [ready, setReady] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      // A valid password-recovery link automatically creates a session
      // (detectSessionInUrl is enabled in the Supabase client).
      setReady(Boolean(data.session?.user?.email))
    })
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const pwCheck = validatePassword(password)
    if (!pwCheck.valid) return setError(pwCheck.message)
    if (password !== confirm) return setError('Passwords do not match.')

    setBusy(true)
    const res = await changePassword(password)
    setBusy(false)

    if (res.error) return setError(res.error)

    toastSuccess('✓ Password updated successfully')
    nav('/member/login', { replace: true })
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
          {ready === null ? (
            <div className="card p-6 text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-saffron border-t-transparent mx-auto" />
              <p className="text-sm text-gray-500 mt-4">Checking reset link...</p>
            </div>
          ) : ready === false ? (
            <div className="card p-6 text-center">
              <p className="text-4xl">⚠️</p>
              <p className="font-semibold text-gray-900 mt-3">Invalid or expired reset link.</p>
              <p className="text-sm text-gray-500 mt-2">Request a new password reset link to continue.</p>
              <Link to="/member/forgot-password" className="btn-primary w-full mt-5">
                Request New Link
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-saffron/10 flex items-center justify-center">
                  <span className="text-2xl">🔐</span>
                </div>
                <h1 className="mt-3 text-2xl font-bold text-gray-900">Set a New Password</h1>
                <p className="text-sm text-gray-500 mt-1">Choose a strong password for your account.</p>
              </div>
              <form onSubmit={submit} className="card p-6 space-y-4">
                <div>
                  <label className="label" htmlFor="new-password">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="confirm-password">
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    className="input"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
                )}
                <button type="submit" className="btn-primary w-full" disabled={busy}>
                  {busy ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}