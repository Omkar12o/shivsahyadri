import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, Calendar, ArrowRight, CheckCircle2, RefreshCw, LogIn } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { validateEmail, validateUserId, validatePassword } from '@/utils'

type Stage = 'form' | 'verify'

export default function MemberRegister() {
  const { signUp } = useAuth()
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()
  const nav = useNavigate()

  const [stage, setStage] = useState<Stage>('form')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)

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
      date_of_birth: dateOfBirth,
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
      toastInfo('Almost done! Check your inbox to verify your email.')
      setStage('verify')
      return
    }

    toastSuccess('✓ Account created — welcome!')
    nav('/member/dashboard', { replace: true })
  }

  const resendEmail = async () => {
    setResending(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/member/login` },
    })
    setResending(false)
    if (error) {
      toastError(error.message || 'Could not resend the email. Please try again.')
    } else {
      toastSuccess('✓ Confirmation email sent again. Check your inbox.')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  if (stage === 'verify') {
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
            <div className="card p-8 text-center animate-scale-in">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-600" aria-hidden="true" />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-gray-900">You're almost in! 📩</h1>
              <p className="text-sm text-gray-600 mt-2">
                We sent a confirmation link to <b className="text-gray-800">{email}</b>.
              </p>

              <ol className="text-left mt-6 space-y-3">
                {[
                  ['Open your email inbox', 'Look for an email from the Mandal (check Spam if you don’t see it).'],
                  ['Tap the Verify / Confirm link', 'This confirms your email address is really yours.'],
                  ['Come back and log in', 'Use your username and password to enter the app.'],
                ].map(([title, note], i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-saffron/10 text-saffron font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{title}</p>
                      <p className="text-xs text-gray-500">{note}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-7 space-y-3">
                <button type="button" onClick={resendEmail} disabled={resending} className="btn-outline w-full justify-center">
                  {resending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> : <Mail className="w-4 h-4 mr-2" aria-hidden="true" />}
                  {resending ? 'Sending…' : 'Resend confirmation email'}
                </button>
                <Link to="/member/login" className="btn-primary w-full justify-center">
                  <LogIn className="w-4 h-4 mr-2" aria-hidden="true" /> Go to Login
                </Link>
              </div>

              <p className="text-xs text-gray-400 mt-6">
                Didn't receive it? Check your spam folder, or ask the Mandal admin for help.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
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
            <p className="text-sm text-gray-500 mt-1">
              Fill in your details below — only the <b>first section is required</b>.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Required section */}
            <section className="card p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">1 · Account details</h2>

              <div>
                <label className="label" htmlFor="reg-fullname">
                  Full Name <span className="text-saffron">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="reg-fullname"
                    className="input pl-9"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="e.g. Rahul Deshmukh"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="reg-username">
                  Username <span className="text-saffron">*</span>
                </label>
                <input
                  id="reg-username"
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="e.g. rahul123"
                />
                <p className="text-xs text-gray-400 mt-1">You will use this username to log in. Letters, numbers and underscores (3-20).</p>
              </div>

              <div>
                <label className="label" htmlFor="reg-email">
                  Email <span className="text-saffron">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="reg-email"
                    type="email"
                    className="input pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="reg-password">
                  Password <span className="text-saffron">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input pl-9 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {password.length > 0 && password.length < 8 ? (
                    <span className="text-orange-600">Keep typing — {8 - password.length} more character{8 - password.length === 1 ? '' : 's'}.</span>
                  ) : password.length >= 8 ? (
                    <span className="text-green-600">✓ Looks good.</span>
                  ) : (
                    'Make it at least 8 characters — letters, numbers, anything you like.'
                  )}
                </p>
              </div>

              <div>
                <label className="label" htmlFor="reg-confirm">
                  Confirm Password <span className="text-saffron">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="reg-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    className="input pl-9 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Type the password again"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && confirmPassword !== password && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
                )}
              </div>
            </section>

            {/* Optional section */}
            <section className="card p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">2 · More about you <span className="ml-1 rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 text-[10px] font-semibold">optional</span></h2>

              <div>
                <label className="label" htmlFor="reg-dob">
                  Birthday <span className="text-xs text-gray-400">(we celebrate members' birthdays 🎂)</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="reg-dob"
                    type="date"
                    className="input pl-9"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={today}
                    autoComplete="bday"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Optional — leave empty if you prefer not to share.</p>
              </div>
            </section>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full py-3.5" disabled={busy}>
              {busy ? 'Creating account…' : (<><ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> Create Account</>)}
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