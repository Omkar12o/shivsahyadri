import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { isAdminRole } from '@/types'

export default function MemberLogin() {
  const { signIn } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const nav = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const res = await signIn(username, password)
    setBusy(false)

    if (res.error) {
      setError(res.error)
      return
    }

    if (res.role === null) {
      setError('Unable to load your profile. Please try again.')
      return
    }

    if (isAdminRole(res.role)) {
      toastSuccess('✓ Admin login successful')
      nav('/admin/dashboard', { replace: true })
      return
    }

    toastSuccess('✓ Login successful')
    nav('/home', { replace: true })
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Compact header */}
      <header className="bg-white border-b border-orange-100 shadow-sm">
        <div className="container-main px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-saffron flex items-center justify-center">
              <span className="text-white font-bold">श्री</span>
            </div>
            <span className="font-bold text-lg text-gray-900">Shivsaydri Ganesh Mandal</span>
          </Link>
          <Link to="/login" className="text-sm text-saffron font-medium hover:underline">
            ← Back
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-saffron/10 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">Member Login</h1>
            <p className="text-sm text-gray-500 mt-1">Enter your username and password</p>
          </div>

          <form onSubmit={submit} className="card p-6 space-y-4">
            <div>
              <label className="label" htmlFor="member-username">
                Username
              </label>
              <input
                id="member-username"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="e.g. rahul123"
              />
            </div>
            <div>
              <label className="label" htmlFor="member-password">
                Password
              </label>
              <input
                id="member-password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Signing in...' : 'Login'}
            </button>

            <p className="text-sm text-center">
              <Link to="/member/forgot-password" className="text-gray-600 font-medium hover:text-saffron">
                Forgot Password?
              </Link>
            </p>
          </form>

          <p className="text-sm text-center text-gray-500 mt-6">
            New member?{' '}
            <Link to="/member/register" className="text-saffron font-medium">
              Create Member Account
            </Link>
          </p>
          <p className="text-sm text-center text-gray-500 mt-2">
            Admin?{' '}
            <Link to="/admin/login" className="text-primary-700 font-medium">
              Login as Admin
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}