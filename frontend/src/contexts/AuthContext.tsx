import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, hasSupabaseConfig } from '@/lib/supabase'
import { authService } from '@/services/authService'
import { profileService } from '@/services/profileService'
import { storageService } from '@/services/storageService'
import { isAdminRole } from '@/types'
import type { Profile, RegisterData, Session, UserRole } from '@/types'

export interface SignInResult {
  error: string | null
  role: UserRole | null
  email?: string | null
  code?: 'email_not_confirmed' | 'rate_limited' | 'network' | 'invalid' | null
}

interface AuthContextType {
  user: { id: string; email: string | null } | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (data: RegisterData) => Promise<{
    error: string | null
    needsEmailConfirmation: boolean
    code?: string | null
    email?: string | null
  }>
  signIn: (identifier: string, password: string) => Promise<SignInResult>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>
  changePassword: (newPassword: string) => Promise<{ error: string | null }>
  uploadProfilePhoto: (file: File, onProgress?: (percent: number) => void) => Promise<string>
  refreshProfile: () => Promise<void>
  isAdmin: boolean
  isMember: boolean
  role: UserRole | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (authUserId: string) => {
    try {
      const data = await profileService.getProfileByAuthId(authUserId)
      setProfile(data)
    } catch (error) {
      console.error('Failed to load profile:', error)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let active = true

    const init = async () => {
      if (!hasSupabaseConfig) {
        console.warn('Supabase is not configured. Login/Register are disabled until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.')
        if (active) setLoading(false)
        return
      }
      const { data } = await supabase.auth.getSession()
      if (!active) return

      if (data.session?.user) {
        setUser({ id: data.session.user.id, email: data.session.user.email ?? null })
        setSession({
          user: {
            id: data.session.user.id,
            email: data.session.user.email ?? null,
            user_metadata: data.session.user.user_metadata,
          },
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at ?? 0,
        })
        await loadProfile(data.session.user.id)
      }
      if (active) setLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_OUT' || !newSession?.user) {
        setUser(null)
        setProfile(null)
        setSession(null)
        return
      }

      setUser({ id: newSession.user.id, email: newSession.user.email ?? null })
      setSession({
        user: {
          id: newSession.user.id,
          email: newSession.user.email ?? null,
          user_metadata: newSession.user.user_metadata,
        },
        access_token: newSession.access_token,
        refresh_token: newSession.refresh_token,
        expires_at: newSession.expires_at ?? 0,
      })

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED') {
        await loadProfile(newSession.user.id)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id)
  }, [user, loadProfile])

  const signUp = useCallback(
    async (data: RegisterData) => {
      const result = await authService.signUp(data)
      if (result.error) return result

      if (!result.needsEmailConfirmation) {
        const { data: sessionData } = await supabase.auth.getSession()
        const authUserId = sessionData.session?.user.id
        if (authUserId) {
          if (data.profile_photo) {
            try {
              const url = await storageService.upload('profile-photos', authUserId, data.profile_photo)
              await profileService.updateOwnProfile(authUserId, { profile_photo_url: url })
            } catch (error) {
              console.error('Profile photo upload failed:', error)
            }
          }
          await loadProfile(authUserId)
        }
      }

      return result
    },
    [loadProfile],
  )

  const signIn = useCallback(async (identifier: string, password: string): Promise<SignInResult> => {
    const res = await authService.signIn(identifier, password)
    if (res.error) return { error: res.error, role: null, email: res.email ?? null, code: res.code ?? null }

    const { data: sessionData } = await supabase.auth.getSession()
    const authUserId = sessionData.session?.user.id
    if (!authUserId) return { error: 'Unable to connect. Please try again.', role: null }

    try {
      const loaded = await profileService.getProfileByAuthId(authUserId)
      setProfile(loaded)
      return { error: null, role: loaded?.role ?? null }
    } catch {
      return { error: 'Unable to load your profile. Please try again.', role: null }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await authService.signOut()
    } catch {
      /* Logout must always proceed locally even if the remote call fails. */
    }
    setUser(null)
    setProfile(null)
    setSession(null)
    // Never leave user-specific data in the service worker caches for the next
    // person using the device.
    try {
      if (typeof caches !== 'undefined') {
        await Promise.allSettled([caches.delete('supabase-api'), caches.delete('app-shell')])
      }
    } catch {
      /* cache cleanup is best-effort */
    }
  }, [])

  const updateProfile = useCallback(
    async (data: Partial<Profile>) => {
      if (!user) return { error: 'Not authenticated' }
      try {
        const updated = await profileService.updateOwnProfile(user.id, data)
        setProfile(updated)
        return { error: null }
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Failed to update profile' }
      }
    },
    [user],
  )

  const changePassword = useCallback(async (newPassword: string) => {
    return authService.updatePassword(newPassword)
  }, [])

  const uploadProfilePhoto = useCallback(
    async (file: File, onProgress?: (percent: number) => void) => {
      if (!user) throw new Error('You must be signed in to upload a photo.')
      const url = await storageService.upload('profile-photos', user.id, file, onProgress)
      await profileService.updateOwnProfile(user.id, { profile_photo_url: url })
      await loadProfile(user.id)
      return url
    },
    [user, loadProfile],
  )

  const role = profile?.role ?? null

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        changePassword,
        uploadProfilePhoto,
        refreshProfile,
        role,
        isAdmin: isAdminRole(role),
        isMember: role === 'member',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
