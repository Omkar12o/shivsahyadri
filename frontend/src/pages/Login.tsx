import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck, UserPlus, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { isAdminRole } from '@/types'
import AuthLoadingScreen from '@/components/AuthLoadingScreen'

export default function Login() {
  const { signIn, loading } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const nav = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <AuthLoadingScreen />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !password) {
      setError('Please enter your username and password.')
      return
    }
    setBusy(true)
    const res = await signIn(username.trim(), password)
    setBusy(false)

    if (res.error) {
      setError(res.error)
      toastError(`✕ ${res.error}`)
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
    nav('/member/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col overflow-x-hidden">
      {/* Top gradient strip */}
      <div className="h-2 w-full bg-gradient-to-r from-saffron via-orange-600 to-red-600" />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Mandal logo + welcome */}
          <div className="text-center">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-white border border-orange-100 shadow-xl shadow-saffron/20 overflow-hidden p-1.5">
              <img
                src="/logo.jpeg"
                alt="Shivsaydri Ganesh Mandal Logo"
                className="w-full h-full object-contain rounded-2xl"
                loading="eager"
              />
            </div>
            <h1 className="mt-4 font-devanagari font-extrabold text-2xl text-gray-900 leading-tight">
              Welcome to Shivsaydri Ganesh Mandal
            </h1>
            <p className="mt-1 text-sm text-gray-500">Umarkhanchan • गणपती बाप्पा मोरया 🙏</p>
          </div>

          {/* Login card */}
          <div className="card mt-6 p-6 md:p-7">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-saffron" aria-hidden="true" /> Member Login
            </h2>
            <p className="text-sm text-gray-500 mt-1">Enter your username and password to access the Mandal app.</p>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label className="label" htmlFor="login-username">
                  Username
                </label>
                <input
                  id="login-username"
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="e.g. rahul123 or your email"
                />
              </div>

              <div>
                <label className="label" htmlFor="login-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-saffron"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
              )}

              <button type="submit" className="btn-primary w-full justify-center py-3 text-base" disabled={busy}>
                {busy ? 'Signing in…' : 'Login'}
              </button>
            </form>

            <p className="text-sm text-center mt-4">
              <Link to="/member/forgot-password" className="text-saffron font-medium hover:underline">
                Forgot Password?
              </Link>
            </p>
          </div>

          {/* New member */}
          <div className="card mt-4 p-5 text-center">
            <p className="text-sm text-gray-600">New member?</p>
            <Link
              to="/member/register"
              className="btn-secondary w-full justify-center mt-3"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" /> Create New Account
            </Link>
          </div>

          {/* Admin access */}
          <p className="text-center text-sm text-gray-500 mt-5">
            Admin?{' '}
            <Link to="/admin/login" className="text-primary-700 font-medium inline-flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Login as Admin
            </Link>
          </p>
        </div>
      </main>

      <p className="text-center text-xs text-gray-400 pb-6">Shivsaydri Ganesh Mandal • Private Members App</p>
    </div>
  )
}