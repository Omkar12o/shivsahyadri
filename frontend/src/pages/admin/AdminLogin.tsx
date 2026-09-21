import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { isAdminRole } from '@/types'
import { ShieldCheck } from 'lucide-react'

export default function AdminLogin() {
  const { profile, signIn, signOut } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const nav = useNavigate()

  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (profile && isAdminRole(profile.role)) {
      nav('/admin/dashboard', { replace: true })
    }
  }, [profile, nav])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    if (profile) {
      // Switch accounts cleanly: sign out the current (non-admin) session first.
      await signOut()
    }
    const res = await signIn(id, pw)
    setBusy(false)

    if (res.error) {
      setError(res.error)
      return
    }

    if (res.role === null) {
      setError('Unable to load your account. Please try again.')
      return
    }

    if (!isAdminRole(res.role)) {
      // A normal member tried to use the admin login - block and sign them out.
      await signOut()
      setError('You do not have admin access.')
      toastError('✕ You do not have permission to access the Admin Panel.')
      return
    }

    toastSuccess('✓ Admin login successful')
    nav('/admin/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 shadow-md">
        <div className="container-main px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-saffron flex items-center justify-center">
              <span className="text-white font-bold">श्री</span>
            </div>
            <span className="font-bold text-white text-lg">Shivsaydri Admin</span>
          </Link>
          <Link to="/login" className="text-sm text-slate-300 hover:text-white">
            ← Member Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-8 h-8 text-saffron" aria-hidden="true" />
            </div>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">🛡️ Admin Login</h1>
            <p className="text-sm text-gray-500 mt-1">Admin Username / Email + Password</p>
          </div>

          <form onSubmit={submit} className="card p-6 space-y-4">
            {profile && !isAdminRole(profile.role) && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                You're signed in as <b>{profile.full_name}</b> (member). Enter the Admin account below to open the
                Admin Panel.
              </p>
            )}

            <div>
              <label className="label" htmlFor="admin-id">
                Admin Username / Email
              </label>
              <input
                id="admin-id"
                className="input"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                autoComplete="username"
                placeholder="admin or admin@example.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                className="input"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
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

            <p className="text-xs text-center text-gray-400">
              Only Admin and Super Admin accounts can access the Admin Panel.
            </p>
          </form>

          <p className="text-sm text-center text-gray-500 mt-6">
            Member?{' '}
            <Link to="/member/login" className="text-saffron font-medium">
              Member Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}