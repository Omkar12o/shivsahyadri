import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'
import type { Profile, UserRole } from '@/types'

export interface MemberQuery {
  search?: string
  role?: UserRole | 'all'
  status?: 'all' | 'active' | 'inactive'
  page?: number
  pageSize?: number
  sortBy?: 'created_at' | 'full_name' | 'village'
}

export interface MemberListResult {
  data: Profile[]
  count: number
}

export const memberService = {
  async listMembers(query: MemberQuery = {}): Promise<MemberListResult> {
    const { search, role = 'all', status = 'all', page = 1, pageSize = 10, sortBy = 'created_at' } = query
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let request = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortBy === 'full_name' })
      .range(from, to)

    if (search && search.trim()) {
      const term = search.trim().replace(/[%,]/g, '')
      request = request.or(`full_name.ilike.%${term}%,user_id.ilike.%${term}%,mobile.ilike.%${term}%,village.ilike.%${term}%`)
    }
    if (role !== 'all') request = request.eq('role', role)
    if (status === 'active') request = request.eq('is_active', true)
    if (status === 'inactive') request = request.eq('is_active', false)

    const { data, error, count } = await request
    if (error) throw new Error(getErrorMessage(error))
    return { data: (data ?? []) as Profile[], count: count ?? 0 }
  },

  async getMember(id: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  async setActive(profileId: string, active: boolean): Promise<void> {
    const { error } = await supabase.rpc('admin_set_member_active', {
      target_profile_id: profileId,
      active,
    })
    if (error) throw new Error(getErrorMessage(error))
  },

  /** Soft delete: deactivates the member so they are hidden from the public site. */
  async softDeleteMember(profileId: string): Promise<void> {
    await this.setActive(profileId, false)
  },

  /** Hard delete: permanently removes the member profile and their login. Super admin only. */
  async hardDeleteMember(profileId: string): Promise<void> {
    const { error } = await supabase.rpc('admin_hard_delete_member', {
      target_profile_id: profileId,
    })
    if (error) throw new Error(getErrorMessage(error))
  },

  async setRole(profileId: string, role: UserRole): Promise<void> {
    const { error } = await supabase.rpc('admin_set_member_role', {
      target_profile_id: profileId,
      new_role: role,
    })
    if (error) throw new Error(getErrorMessage(error))
  },

  async updateMember(profileId: string, fields: Partial<Pick<Profile, 'full_name' | 'mobile' | 'village' | 'position' | 'bio' | 'profile_photo_url' | 'display_order' | 'cloudinary_public_id'>>): Promise<void> {
    const payload: Record<string, unknown> = {}
    if (fields.full_name !== undefined) payload.full_name = fields.full_name
    if (fields.mobile !== undefined) payload.mobile = fields.mobile
    if (fields.village !== undefined) payload.village = fields.village
    if (fields.position !== undefined) payload.position = fields.position
    if (fields.bio !== undefined) payload.bio = fields.bio
    if (fields.profile_photo_url !== undefined) payload.profile_photo_url = fields.profile_photo_url
    if (fields.cloudinary_public_id !== undefined) payload.cloudinary_public_id = fields.cloudinary_public_id
    if (fields.display_order !== undefined) payload.display_order = fields.display_order

    if (Object.keys(payload).length === 0) return

    const { error } = await supabase.rpc('admin_update_member', {
      target_profile_id: profileId,
      fields: payload,
    })
    if (error) throw new Error(getErrorMessage(error))
  },

  /** Creates a public Mandal member record directly (no auth login created). */
  async addMember(input: {
    full_name: string
    user_id?: string | null
    position?: string | null
    bio?: string | null
    profile_photo_url?: string | null
    cloudinary_public_id?: string | null
    display_order?: number
    is_active?: boolean
  }): Promise<string> {
    const { data, error } = await supabase.rpc('admin_insert_member', {
      p_full_name: input.full_name,
      p_user_id: input.user_id ?? '',
      p_position: input.position ?? '',
      p_bio: input.bio ?? '',
      p_profile_photo_url: input.profile_photo_url ?? '',
      p_cloudinary_public_id: input.cloudinary_public_id ?? '',
      p_display_order: input.display_order ?? 0,
      p_is_active: input.is_active ?? true,
    })
    if (error) throw new Error(getErrorMessage(error))
    return data as string
  },
}
