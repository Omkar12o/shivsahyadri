import { supabase, hasSupabaseConfig } from '@/lib/supabase'
import { getErrorMessage, validateEmail } from '@/utils'
import type { RegisterData } from '@/types'

export interface SignUpResult {
  error: string | null
  needsEmailConfirmation: boolean
}

export interface SignInResult {
  error: string | null
  email: string | null
}

export const authService = {
  async isUserIdTaken(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_user_id_taken', { candidate: userId })
    if (error) throw new Error(getErrorMessage(error))
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
        return { error: 'That username is already taken. Please choose another.', needsEmailConfirmation: false }
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
      if (/already registered|already exists|User already|email.*exist/i.test(message)) {
        return { error: 'An account with this email already exists.', needsEmailConfirmation: false }
      }
      if (/user id already exists|duplicate/i.test(message)) {
        return { error: 'That username is already taken. Please choose another.', needsEmailConfirmation: false }
      }
      if (/password/i.test(message)) {
        return { error: 'Password must be at least 8 characters with upper, lower and a number.', needsEmailConfirmation: false }
      }
      if (/invalid email|not a valid email/i.test(message)) {
        return { error: 'Please enter a valid email address.', needsEmailConfirmation: false }
      }
      if (/\bnetwork\b|fetch|Internet connection/i.test(message)) {
        return { error: 'Unable to connect. Please try again.', needsEmailConfirmation: false }
      }
      return { error: getErrorMessage(error, 'Registration failed. Please try again.'), needsEmailConfirmation: false }
    }

    return { error: null, needsEmailConfirmation: !authData.session }
  },

  /**
   * Sign in with EITHER a username or an email + password.
   * username ->profiles lookup -> auth email -> supabase.auth.signInWithPassword.
   * Never returns password or extra profile data; only a friendly result.
   */
  async signIn(identifier: string, password: string): Promise<SignInResult> {
    if (!hasSupabaseConfig) {
      return {
        error:
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env to enable login.',
        email: null,
      }
    }
    const input = identifier.trim()
    if (!input || !password) {
      return { error: 'Please enter your username and password.', email: null }
    }

    let email = input

    if (!input.includes('@')) {
      try {
        const { data: resolved, error } = await supabase.rpc('get_email_for_user_id', { candidate: input })
        if (error) {
          return { error: 'Invalid username or password.', email: null }
        }
        if (!resolved) {
          return { error: 'Invalid username or password.', email: null }
        }
        email = resolved as string
      } catch {
        return { error: 'Invalid username or password.', email: null }
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const message = error.message || ''
      if (/email not confirmed|confirm your email/i.test(message)) {
        return { error: 'Please verify your email before logging in.', email }
      }
      if (/rate limit|too many requests/i.test(message)) {
        return { error: 'Too many attempts. Please wait a moment and try again.', email: null }
      }
      if (/\bnetwork\b|fetch|Internet connection/i.test(message)) {
        return { error: 'Unable to connect. Please try again.', email: null }
      }
      return { error: 'Invalid username or password.', email: null }
    }

    return { error: null, email: data.user?.email ?? email }
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  },

  async sendPasswordReset(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/member/reset-password`,
    })
    if (error) {
      if (/\bnetwork\b|fetch/i.test(error.message)) {
        return { error: 'Unable to connect. Please try again.' }
      }
      return { error: getErrorMessage(error, 'Unable to send reset email. Please try again.') }
    }
    return { error: null }
  },

  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: getErrorMessage(error, 'Unable to update password.') }
    return { error: null }
  },
}