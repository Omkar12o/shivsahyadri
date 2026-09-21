import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { validateEmail, validateUserId, validatePassword } from '@/utils'

export default function MemberRegister() {
  const { signUp } = useAuth()
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()
  const nav = useNavigate()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) return setError('Please enter your full name.')
    if (!username.trim()) return setError('Please choose a username.')
    if (!validateUserId(username.trim())) {
      return setError('Username must be 3-20 characters using letters, numbers or underscores only.')
    }
    if (!email.trim()) return setError('Please enter your email address.')
    if (!validateEmail(email.trim())) return setError('Please enter a valid email address.')
    const pwCheck = validatePassword(password)
    if (!pwCheck.valid) return setError(pwCheck.message)
    if (password !== confirmPassword) return setError('Passwords do not match.')

    setBusy(true)
    const res = await signUp({
      full_name: fullName,
      user_id: username,
      email,
      mobile: '',
      password,
      confirm_password: confirmPassword,
      date_of_birth: '',
      birthday_time: '',
      village: '',
      address: '',
      birthday_visibility: true,
    })
    setBusy(false)

    if (res.error) {
      setError(res.error)
      return
    }

    if (res.needsEmailConfirmation) {
      toastInfo('Account created. Please verify your email before logging in.')
    } else {
      toastSuccess('✓ Account created successfully')
    }
    nav('/member/login', { replace: true })
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
          <Link to="/member/login" className="text-sm text-saffron font-medium hover:underline">
            ← Back to Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-saffron/10 flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">Create Member Account</h1>
            <p className="text-sm text-gray-500 mt-1">Join Shivsaydri Ganesh Mandal</p>
          </div>

          <form onSubmit={submit} className="card p-6 space-y-4">
            <div>
              <label className="label" htmlFor="reg-fullname">
                Full Name *
              </label>
              <input
                id="reg-fullname"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="label" htmlFor="reg-username">
                Username *
              </label>
              <input
                id="reg-username"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="e.g. rahul123 (used to log in)"
              />
              <p className="text-xs text-gray-400 mt-1">3-20 characters, letters/numbers/underscore.</p>
            </div>
            <div>
              <label className="label" htmlFor="reg-email">
                Email *
              </label>
              <input
                id="reg-email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="reg-password">
                Password *
              </label>
              <input
                id="reg-password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-400 mt-1">At least 8 chars with upper, lower and a number.</p>
            </div>
            <div>
              <label className="label" htmlFor="reg-confirm">
                Confirm Password *
              </label>
              <input
                id="reg-confirm"
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/member/login" className="text-saffron font-medium">
              Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}