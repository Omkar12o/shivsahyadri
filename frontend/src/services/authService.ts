import { supabase, hasSupabaseConfig } from '@/lib/supabase'
import { validateEmail } from '@/utils'
import type { RegisterData } from '@/types'

export type SignUpCode = 'email_exists' | 'username_taken' | 'rate_limited' | 'network' | null

export type SignInCode = 'email_not_confirmed' | 'rate_limited' | 'network' | 'invalid' | null

export interface SignUpResult {
  error: string | null
  needsEmailConfirmation: boolean
  code?: SignUpCode
  email?: string | null
}

export interface SignInResult {
  error: string | null
  email: string | null
  code?: SignInCode
}

const RATE_LIMIT_RE = /rate limit|rate_limit|too many|slow down|reached the limit/i
const NETWORK_RE = /\bnetwork\b|fetch|internet|failed to (fetch|connect)|temporary breakdown/i

export const authService = {
  async isUserIdTaken(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_user_id_taken', { candidate: userId })
    if (error) throw new Error('Username check failed. Please try again.')
    return Boolean(data)
  },

  async signUp(data: RegisterData, profilePhotoUrl?: string): Promise<SignUpResult> {
    const fullName = data.full_name.trim()
    const username = data.user_id.trim()
    const email = data.email.trim()

    if (!fullName) return { error: 'Please enter your full name.', needsEmailConfirmation: false }
    if (!username) return { error: 'Please choose a username.', needsEmailConfirmation: false }
    if (!email) return { error: 'Please enter your email address.', needsEmailConfirmation: false }
    if (!validateEmail(email)) return { error: 'Please enter a valid email address.', needsEmailConfirmation: false }

    try {
      const taken = await this.isUserIdTaken(username)
      if (taken) {
        return { error: 'That username is already taken. Please choose another.', needsEmailConfirmation: false, code: 'username_taken' }
      }
    } catch {
      // uniqueness is also enforced by the database; continue
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: {
        data: {
          full_name: fullName,
          user_id: username,
          username,
          contact_email: email,
          mobile: data.mobile.trim(),
          village: data.village.trim(),
          address: data.address.trim(),
          date_of_birth: data.date_of_birth,
          birthday_time: data.birthday_time,
          birthday_visibility: data.birthday_visibility,
          profile_photo_url: profilePhotoUrl || null,
        },
      },
    })

    if (error) {
      const message = error.message || ''
      if (/already registered|already exists|user already|email.*exist/i.test(message)) {
        return {
          error: 'An account with this email already exists. Try logging in instead.',
          needsEmailConfirmation: false,
          code: 'email_exists',
          email,
        }
      }
      if (/user id already exists|duplicate|unique/i.test(message)) {
        return { error: 'That username is already taken. Please choose another.', needsEmailConfirmation: false, code: 'username_taken' }
      }
      if (RATE_LIMIT_RE.test(message)) {
        return {
          error: 'Email verification could not be sent right now. Please try again later.',
          needsEmailConfirmation: false,
          code: 'rate_limited',
          email,
        }
      }
      if (/password/i.test(message)) {
        return { error: 'Password must be at least 8 characters.', needsEmailConfirmation: false }
      }
      if (/invalid email|not a valid email/i.test(message)) {
        return { error: 'Please enter a valid email address.', needsEmailConfirmation: false }
      }
      if (NETWORK_RE.test(message)) {
        return { error: 'Unable to connect. Please check your internet connection and try again.', needsEmailConfirmation: false, code: 'network' }
      }
      return { error: 'Account creation failed. Please try again.', needsEmailConfirmation: false }
    }

    return {
      error: null,
      needsEmailConfirmation: !authData.session,
email: authData.user?.email ?? email,
      code: null,
    }
  },

  /**
   * Sign in with EITHER a username or an email + password.
   * Username -> case-insensitive username/email lookup -> auth email -> signInWithPassword.
   * Never returns a password or extra profile data; only a friendly result.
   */
  async signIn(identifier: string, password: string): Promise<SignInResult> {
    if (!hasSupabaseConfig) {
      return {
        error:
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env to enable login.',
        email: null,
        code: 'network',
      }
    }
    const input = identifier.trim()
    if (!input || !password) {
      return { error: 'Please enter your username and password.', email: null, code: 'invalid' }
    }

    let email = input

    if (!input.includes('@')) {
      try {
        const { data: resolved, error } = await supabase.rpc('get_email_for_user_id', { candidate: input })
        if (error || !resolved) {
          return { error: 'Invalid username or password.', email: null, code: 'invalid' }
        }
        email = resolved as string
      } catch {
        return { error: 'Invalid username or password.', email: null, code: 'invalid' }
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const message = error.message || ''
      if (RATE_LIMIT_RE.test(message)) {
        return { error: 'Too many sign-in attempts. Please wait a moment and try again.', email: null, code: 'rate_limited' }
      }
      if (/email not confirmed|confirm your email/i.test(message)) {
        return { error: 'Please verify your email before logging in.', email, code: 'email_not_confirmed' }
      }
      if (NETWORK_RE.test(message)) {
        return { error: 'Unable to connect. Please check your internet connection and try again.', email: null, code: 'network' }
      }
      return { error: 'Invalid username or email, or password.', email: null, code: 'invalid' }
    }

    return { error: null, email: data.user?.email ?? email, code: null }
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  },

  async resendConfirmationEmail(email: string): Promise<{ error: string | null; code?: 'rate_limited' | null }> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/member/login` },
    })
    if (!error) return { error: null, code: null }

    const message = error.message || ''
    if (RATE_LIMIT_RE.test(message)) {
      return { error: 'Email service is temporarily busy. Please wait a moment before trying again.', code: 'rate_limited' }
    }
    if (NETWORK_RE.test(message)) {
      return { error: 'Unable to connect. Please check your internet connection.', code: null }
    }
    return { error: 'Unable to send the email right now. Please try again later.', code: null }
  },

  async sendPasswordReset(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/member/reset-password`,
    })
    if (!error) return { error: null }
    if (RATE_LIMIT_RE.test(error.message || '')) {
      return { error: 'Please wait a moment before requesting another email.' }
    }
    if (NETWORK_RE.test(error.message || '')) {
      return { error: 'Unable to connect. Please check your internet connection.' }
    }
    return { error: null }
  },

  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) return { error: null }
    const message = error.message || ''
    if (RATE_LIMIT_RE.test(message)) return { error: 'Too many attempts. Please wait a moment and try again.' }
    if (/password/i.test(message)) return { error: 'Password must be at least 8 characters.' }
    if (NETWORK_RE.test(message)) return { error: 'Unable to connect. Please try again.' }
    return { error: 'Could not update the password. Please try again.' }
  },
}