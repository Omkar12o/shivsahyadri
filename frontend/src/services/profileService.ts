import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'
import type { MemberDirectoryEntry, Profile } from '@/types'

const UPDATABLE_COLUMNS = [
  'full_name',
  'email',
  'mobile',
  'village',
  'address',
  'date_of_birth',
  'birthday_time',
  'birthday_visibility',
  'profile_photo_url',
] as const

export type ProfileUpdate = Pick<Profile, (typeof UPDATABLE_COLUMNS)[number]>

function pickUpdatable(data: Partial<Profile>): Partial<ProfileUpdate> {
  const result: Partial<ProfileUpdate> = {}
  for (const key of UPDATABLE_COLUMNS) {
    if (key in data && data[key] !== undefined) {
      // @ts-expect-error dynamic assignment of matching key/value pairs
      result[key] = data[key]
    }
  }
  return result
}

export const profileService = {
  async getProfileByAuthId(authUserId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async updateOwnProfile(authUserId: string, data: Partial<Profile>): Promise<Profile> {
    const { data: updated, error } = await supabase
      .from('profiles')
      .update(pickUpdatable(data))
      .eq('auth_user_id', authUserId)
      .select('*')
      .single()
    if (error) throw new Error(getErrorMessage(error))
    return updated
  },

  async getMemberDirectory(): Promise<MemberDirectoryEntry[]> {
    const { data, error } = await supabase
      .from('public_member_directory')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    if (error) throw new Error(getErrorMessage(error))
    return (data ?? []) as MemberDirectoryEntry[]
  },
}
