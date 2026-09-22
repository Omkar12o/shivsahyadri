import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, Calendar, CheckCircle2, RefreshCw, LogIn, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { authService } from '@/services/authService'
import { useCooldown } from '@/hooks'
import { validateEmail, validateUserId, validatePassword } from '@/utils'

type Stage = 'form' | 'verify'
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

type FieldErrors = Partial<Record<'fullName' | 'username' | 'email' | 'password' | 'confirmPassword', string>>

const EMPTY_ERRORS: FieldErrors = {}

export default function MemberRegister() {
  const { signUp } = useAuth()
  const { success: toastSuccess, info: toastInfo } = useToast()
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
  const [showOptional, setShowOptional] = useState(false)

  const [errors, setErrors] = useState<FieldErrors>(EMPTY_ERRORS)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [busy, setBusy] = useState(false)

  const [rateLimited, setRateLimited] = useState(false)
  const [emailExists, setEmailExists] = useState(false)

  const signupCooldown = useCooldown('signup_attempt')
  const resendCooldown = useCooldown('resend_verify')

  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (usernameTimer.current) clearTimeout(usernameTimer.current)
    }
  }, [])

  const onUsernameChange = (value: string) => {
    setUsername(value)
    setErrors(prev => ({ ...prev, username: undefined }))
    if (usernameTimer.current) clearTimeout(usernameTimer.current)

    const uname = value.trim()
    if (!uname) {
      setUsernameStatus('idle')
      return
    }
    if (!validateUserId(uname)) {
      setUsernameStatus('invalid')
      return
    }
    setUsernameStatus('checking')
    usernameTimer.current = setTimeout(async () => {
      try {
        const taken = await authService.isUserIdTaken(uname)
        setUsernameStatus(taken ? 'taken' : 'available')
      } catch {
        setUsernameStatus('idle')
      }
    }, 400)
  }

  const scrollToFirstError = (hasErrors: boolean) => {
    if (!hasErrors) return
    const first = document.querySelector('[data-field-error="true"]')
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (busy) return
    setFormFlags(false)

    const name = fullName.trim()
    const uname = username.trim()
    const mail = email.trim()

    const newErrors: FieldErrors = {}
    if (!name) newErrors.fullName = 'Please enter your full name.'
    if (!uname) {
      newErrors.username = 'Please choose a username.'
    } else if (!validateUserId(uname)) {
      newErrors.username = 'Username must be 3–20 characters (letters, numbers, underscores only, no spaces).'
    } else if (usernameStatus === 'taken') {
      newErrors.username = 'That username is already taken.'
    }
    if (!mail) {
      newErrors.email = 'Please enter your email address.'
    } else if (!validateEmail(mail)) {
      newErrors.email = 'Enter a valid email address.'
    }
    const pwCheck = validatePassword(password)
    if (!pwCheck.valid) newErrors.password = pwCheck.message
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.'

    setErrors(newErrors)
    scrollToFirstError(Object.keys(newErrors).length > 0)
    if (Object.keys(newErrors).length > 0) return

    if (signupCooldown.remaining > 0) return

    setBusy(true)
    try {
      try {
        const taken = await authService.isUserIdTaken(uname)
        if (taken) {
          setErrors({ username: 'That username is already taken.' })
          setBusy(false)
          return
        }
      } catch {
        /* server enforces uniqueness too */
      }

      const res = await signUp({
        full_name: name,
        user_id: uname,
        email: mail,
        mobile: '',
        password,
        confirm_password: confirmPassword,
        date_of_birth: dateOfBirth,
        birthday_time: '',
        village: '',
        address: '',
        birthday_visibility: true,
      })

      if (res.error) {
        if (res.code === 'rate_limited') {
          setRateLimited(true)
          signupCooldown.start(60)
          return
        }
        if (res.code === 'email_exists') {
          setEmailExists(true)
          return
        }
        if (res.code === 'username_taken') {
          setErrors({ username: 'That username is already taken.' })
          setUsernameStatus('taken')
          return
        }
        setErrors({ email: res.error })
        return
      }

      setErrors(EMPTY_ERRORS)

      if (res.needsEmailConfirmation) {
        toastInfo('✓ Account created. Please check your email to verify your account.')
        setStage('verify')
        return
      }

      toastSuccess('✓ Account created — welcome!')
      nav('/home', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  const resendEmail = async () => {
    if (resendCooldown.remaining > 0 || busy) return
    const res = await authService.resendConfirmationEmail(email.trim())
    if (res.error) {
      setErrors({ email: res.error })
      if (res.code === 'rate_limited') resendCooldown.start(60)
      return
    }
    resendCooldown.start(60)
    toastInfo('✓ Confirmation email sent again. Check your inbox.')
  }

  const setFormFlags = (value: boolean) => {
    setRateLimited(value)
    setEmailExists(value)
  }

  const today = new Date().toISOString().split('T')[0]

  if (stage === 'verify') {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <header className="bg-white border-b border-orange-100 shadow-sm">
          <div className="container-main px-4 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-saffron flex items-center justify-center">
                <span className="text-white font-bold text-xs">श्री</span>
              </div>
              <span className="font-bold text-gray-900">Shivsaydri Ganesh Mandal</span>
            </Link>
            <Link to="/member/login" className="text-xs text-saffron font-medium">
              ← Login
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-sm">
            <div className="card p-6 text-center animate-scale-in">
              <div className="mx-auto w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" aria-hidden="true" />
              </div>
              <h1 className="mt-3 text-xl font-bold text-gray-900">Account created</h1>
              <p className="text-sm text-gray-600 mt-2">
                Please check your email to verify your account.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                We sent a confirmation link to <b className="text-gray-800">{email}</b>. Don't see it? Check your spam folder.
              </p>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={resendEmail}
                  disabled={resendCooldown.remaining > 0}
                  className="btn-outline w-full justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  {resendCooldown.remaining > 0
                    ? `Resend available in ${resendCooldown.remaining}s`
                    : 'Resend verification email'}
                </button>
                <Link to="/member/login" className="btn-primary w-full justify-center">
                  <LogIn className="w-4 h-4 mr-2" aria-hidden="true" /> Go to Login
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="h-1.5 w-full bg-gradient-to-r from-saffron via-orange-600 to-red-600" />

      {/* Compact header */}
      <header className="bg-white border-b border-orange-100 shadow-sm">
        <div className="container-main px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-saffron flex items-center justify-center">
              <span className="text-white font-bold text-xs">श्री</span>
            </div>
            <span className="font-bold text-gray-900">Shivsaydri Ganesh Mandal</span>
          </Link>
          <Link to="/member/login" className="text-xs text-saffron font-medium">
            ← Login
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="w-full max-w-sm mx-auto">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-gray-900">Create Member Account</h1>
            <p className="text-xs text-gray-500 mt-0.5">Fill in your details below.</p>
          </div>

          <form onSubmit={submit} noValidate className="space-y-4">
            {/* Account details */}
            <section className="card p-5 space-y-4">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Account Details</h2>

              <div>
                <label className="label" htmlFor="reg-fullname">Full Name <span className="text-saffron">*</span></label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="reg-fullname"
                    className="input pl-9 text-base"
                    value={fullName}
                    onChange={e => { setFullName(e.target.value); setErrors(prev => ({ ...prev, fullName: undefined })) }}
                    autoComplete="name"
                    placeholder="e.g. Rahul Deshmukh"
                  />
                </div>
                {errors.fullName && <p className="text-xs text-red-600 mt-1" data-field-error>{errors.fullName}</p>}
              </div>

              <div>
                <label className="label" htmlFor="reg-username">Username <span className="text-saffron">*</span></label>
                <input
                  id="reg-username"
                  className="input text-base"
                  value={username}
                  onChange={e => onUsernameChange(e.target.value)}
                  autoComplete="username"
                  placeholder="e.g. rahul123"
                />
                {errors.username ? (
                  <p className="text-xs text-red-600 mt-1" data-field-error>{errors.username}</p>
                ) : usernameStatus === 'checking' ? (
                  <p className="text-xs text-gray-400 mt-1">Checking…</p>
                ) : usernameStatus === 'available' ? (
                  <p className="text-xs text-green-600 mt-1">✓ Username available</p>
                ) : usernameStatus === 'taken' ? (
                  <p className="text-xs text-red-600 mt-1">✕ Username already taken</p>
                ) : usernameStatus === 'invalid' ? (
                  <p className="text-xs text-red-600 mt-1">✕ 3–20 characters, letters/numbers/underscores, no spaces</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">This is how you log in. 3–20 characters, no spaces.</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="reg-email">Email <span className="text-saffron">*</span></label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="reg-email"
                    type="email"
                    className="input pl-9 text-base"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })) }}
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-600 mt-1" data-field-error>{errors.email}</p>}
              </div>

              <div>
                <label className="label" htmlFor="reg-password">Password <span className="text-saffron">*</span></label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input pl-9 pr-10 text-base"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })) }}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password ? (
                  <p className="text-xs text-red-600 mt-1" data-field-error>{errors.password}</p>
                ) : password.length > 0 ? (
                  <p className={`text-xs mt-1 ${password.length >= 8 ? 'text-green-600' : 'text-orange-600'}`}>
                    {password.length >= 8 ? '✓ Password length is valid' : `Keep typing — ${8 - password.length} more character${8 - password.length === 1 ? '' : 's'}.`}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">Minimum 8 characters.</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="reg-confirm">Confirm Password <span className="text-saffron">*</span></label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="reg-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    className="input pl-9 pr-10 text-base"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: undefined })) }}
                    autoComplete="new-password"
                    placeholder="Type the password again"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword
                  ? <p className="text-xs text-red-600 mt-1" data-field-error>{errors.confirmPassword}</p>
                  : confirmPassword.length > 0 && confirmPassword !== password
                    ? <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>
                    : null}
              </div>
            </section>

            {/* Optional section */}
            <section className="card p-5">
              <button
                type="button"
                onClick={() => setShowOptional(s => !s)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Optional</span>
                <span className="flex items-center gap-2 text-xs text-saffron font-medium">
                  {showOptional ? 'Hide' : 'Add more information'}
                  {showOptional ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
                </span>
              </button>

              {showOptional && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="label" htmlFor="reg-dob">Birthday</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                      <input
                        id="reg-dob"
                        type="date"
                        className="input pl-9 text-base"
                        value={dateOfBirth}
                        onChange={e => setDateOfBirth(e.target.value)}
                        max={today}
                        autoComplete="bday"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Optional — leave empty if you prefer not to share.</p>
                  </div>
                </div>
              )}
            </section>

            {/* Rate-limit notice */}
            {rateLimited && (
              <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 text-sm text-gray-700 animate-scale-in">
                <p className="font-bold text-gray-800">Email verification could not be sent right now.</p>
                <p className="mt-1 text-xs">
                  Please wait {Math.max(signupCooldown.remaining, 60)} seconds before requesting another email.
                  This is a safety limit from the email service.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => submit()}
                    disabled={signupCooldown.remaining > 0}
                    className="btn-primary flex-1 justify-center"
                  >
                    {signupCooldown.remaining > 0 ? `Try Again in ${signupCooldown.remaining}s` : 'Try Again'}
                  </button>
                  <Link to="/member/login" className="btn-outline flex-1 justify-center">Go to Login</Link>
                </div>
              </div>
            )}

            {/* Existing-account notice */}
            {emailExists && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-gray-700 animate-scale-in">
                <p className="font-bold text-gray-800">An account with this email already exists.</p>
                <p className="mt-1 text-xs">If that's you, log in with your username or email and password. No new account was created.</p>
                <div className="mt-3 flex gap-2">
                  <Link to="/member/login" className="btn-primary flex-1 justify-center">Go to Login</Link>
                  <button
                    type="button"
                    onClick={resendEmail}
                    disabled={resendCooldown.remaining > 0}
                    className="btn-outline flex-1 justify-center"
                  >
                    {resendCooldown.remaining > 0 ? `Resend in ${resendCooldown.remaining}s` : 'Resend verification email'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full py-3.5 text-base justify-center"
              disabled={busy || signupCooldown.remaining > 0}
            >
              {busy ? 'Creating Account…' : signupCooldown.remaining > 0 ? `Try again in ${signupCooldown.remaining}s` : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-5">
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