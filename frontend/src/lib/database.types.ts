export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'member' | 'super_admin'
export type AartiCategory = 'morning' | 'afternoon' | 'evening' | 'night' | 'special'
export type AnnouncementPriority = 'low' | 'medium' | 'high' | 'urgent'
export type NotificationType = 'birthday' | 'announcement' | 'program' | 'aarti' | 'system'
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled'
export type TransactionType = 'income' | 'expense'
export type CalendarEventType =
  | 'aarti'
  | 'program'
  | 'meeting'
  | 'festival'
  | 'announcement'
  | 'donation'
  | 'cultural'
  | 'other'
export type CalendarEventStatus = 'scheduled' | 'cancelled' | 'completed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          auth_user_id: string | null
          full_name: string
          user_id: string
          email: string | null
          mobile: string | null
          village: string | null
          address: string | null
          date_of_birth: string | null
          birthday_time: string | null
          birthday_visibility: boolean
          profile_photo_url: string | null
          cloudinary_public_id: string | null
          position: string | null
          bio: string | null
          display_order: number | null
          role: UserRole
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          full_name: string
          user_id: string
          email?: string | null
          mobile?: string | null
          village?: string | null
          address?: string | null
          date_of_birth?: string | null
          birthday_time?: string | null
          birthday_visibility?: boolean
          profile_photo_url?: string | null
          cloudinary_public_id?: string | null
          position?: string | null
          bio?: string | null
          display_order?: number | null
          role?: UserRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          full_name?: string
          user_id?: string
          email?: string | null
          mobile?: string | null
          village?: string | null
          address?: string | null
          date_of_birth?: string | null
          birthday_time?: string | null
          birthday_visibility?: boolean
          profile_photo_url?: string | null
          cloudinary_public_id?: string | null
          position?: string | null
          bio?: string | null
          display_order?: number | null
          role?: UserRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      aartis: {
        Row: {
          id: string
          title: string
          category: AartiCategory
          time: string
          lyrics: string
          audio_url: string | null
          audio_public_id: string | null
          description: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          category?: AartiCategory
          time: string
          lyrics?: string
          audio_url?: string | null
          audio_public_id?: string | null
          description?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          category?: AartiCategory
          time?: string
          lyrics?: string
          audio_url?: string | null
          audio_public_id?: string | null
          description?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          id: string
          title: string
          event_date: string
          start_time: string
          end_time: string | null
          description: string | null
          location: string | null
          image_url: string | null
          image_public_id: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          event_date: string
          start_time: string
          end_time?: string | null
          description?: string | null
          location?: string | null
          image_url?: string | null
          image_public_id?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          event_date?: string
          start_time?: string
          end_time?: string | null
          description?: string | null
          location?: string | null
          image_url?: string | null
          image_public_id?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          title: string
          message: string
          image_url: string | null
          image_public_id: string | null
          priority: AnnouncementPriority
          popup_enabled: boolean
          start_date: string | null
          end_date: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          message?: string
          image_url?: string | null
          image_public_id?: string | null
          priority?: AnnouncementPriority
          popup_enabled?: boolean
          start_date?: string | null
          end_date?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          message?: string
          image_url?: string | null
          image_public_id?: string | null
          priority?: AnnouncementPriority
          popup_enabled?: boolean
          start_date?: string | null
          end_date?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery: {
        Row: {
          id: string
          title: string
          image_url: string
          cloudinary_public_id: string | null
          category: string
          event_date: string | null
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          image_url: string
          cloudinary_public_id?: string | null
          category?: string
          event_date?: string | null
          is_published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          image_url?: string
          cloudinary_public_id?: string | null
          category?: string
          event_date?: string | null
          is_published?: boolean
          created_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          id: string
          title: string
          video_url: string
          thumbnail_url: string | null
          category: string
          description: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          video_url: string
          thumbnail_url?: string | null
          category?: string
          description?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          video_url?: string
          thumbnail_url?: string | null
          category?: string
          description?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          title: string
          message: string
          type: NotificationType
          related_member_id: string | null
          related_program_id: string | null
          birthday_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          message?: string
          type?: NotificationType
          related_member_id?: string | null
          related_program_id?: string | null
          birthday_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          message?: string
          type?: NotificationType
          related_member_id?: string | null
          related_program_id?: string | null
          birthday_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_related_member_id_fkey'
            columns: ['related_member_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_related_program_id_fkey'
            columns: ['related_program_id']
            isOneToOne: false
            referencedRelation: 'programs'
            referencedColumns: ['id']
          },
        ]
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          user_id: string
          read_at: string
        }
        Insert: {
          id?: string
          notification_id: string
          user_id: string
          read_at?: string
        }
        Update: {
          id?: string
          notification_id?: string
          user_id?: string
          read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notification_reads_notification_id_fkey'
            columns: ['notification_id']
            isOneToOne: false
            referencedRelation: 'notifications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notification_reads_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      calendar_events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_type: CalendarEventType
          start_datetime: string
          end_datetime: string | null
          all_day: boolean
          location: string | null
          status: CalendarEventStatus
          is_public: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_type?: CalendarEventType
          start_datetime: string
          end_datetime?: string | null
          all_day?: boolean
          location?: string | null
          status?: CalendarEventStatus
          is_public?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_type?: CalendarEventType
          start_datetime?: string
          end_datetime?: string | null
          all_day?: boolean
          location?: string | null
          status?: CalendarEventStatus
          is_public?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'calendar_events_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          message: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          message?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'chat_messages_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'chat_messages_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'public_member_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'chat_messages_deleted_by_fkey'
            columns: ['deleted_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      donation_info: {
        Row: {
          id: string
          mandal_name: string
          upi_id: string
          upi_qr_url: string | null
          upi_qr_public_id: string | null
          bank_name: string | null
          account_number: string | null
          ifsc_code: string | null
          account_holder: string | null
          instructions: string | null
          is_active: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          mandal_name: string
          upi_id: string
          upi_qr_url?: string | null
          upi_qr_public_id?: string | null
          bank_name?: string | null
          account_number?: string | null
          ifsc_code?: string | null
          account_holder?: string | null
          instructions?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          mandal_name?: string
          upi_id?: string
          upi_qr_url?: string | null
          upi_qr_public_id?: string | null
          bank_name?: string | null
          account_number?: string | null
          ifsc_code?: string | null
          account_holder?: string | null
          instructions?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      mandal_info: {
        Row: {
          id: string
          name: string
          village: string
          established_year: number | null
          history: string | null
          objectives: string | null
          social_activities: string | null
          community_activities: string | null
          previous_years_info: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          contact_email: string | null
          address: string | null
          map_embed_url: string | null
          social_media: Json
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          village: string
          established_year?: number | null
          history?: string | null
          objectives?: string | null
          social_activities?: string | null
          community_activities?: string | null
          previous_years_info?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          contact_email?: string | null
          address?: string | null
          map_embed_url?: string | null
          social_media?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          village?: string
          established_year?: number | null
          history?: string | null
          objectives?: string | null
          social_activities?: string | null
          community_activities?: string | null
          previous_years_info?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          contact_email?: string | null
          address?: string | null
          map_embed_url?: string | null
          social_media?: Json
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          logo_url: string | null
          logo_public_id: string | null
          ganpati_image_url: string | null
          ganpati_public_id: string | null
          countdown_target: string | null
          hero_welcome: string | null
          hero_message: string | null
          announcements_title: string | null
          programs_title: string | null
          gallery_title: string | null
          birthday_title: string | null
          donation_title: string | null
          about_heading: string | null
          about_description: string | null
          about_image_url: string | null
          about_image_public_id: string | null
          about_button_text: string | null
          about_button_link: string | null
          about_show: boolean
          banner_title: string | null
          banner_subtitle: string | null
          banner_description: string | null
          banner_button_text: string | null
          banner_button_link: string | null
          banner_show: boolean
          members_preview_show: boolean
          members_preview_count: number
          gallery_preview_show: boolean
          gallery_preview_count: number
          donation_show: boolean
          quick_actions: Json | null
          updated_at: string
        }
        Insert: {
          id?: string
          logo_url?: string | null
          logo_public_id?: string | null
          ganpati_image_url?: string | null
          ganpati_public_id?: string | null
          countdown_target?: string | null
          hero_welcome?: string | null
          hero_message?: string | null
          announcements_title?: string | null
          programs_title?: string | null
          gallery_title?: string | null
          birthday_title?: string | null
          donation_title?: string | null
          about_heading?: string | null
          about_description?: string | null
          about_image_url?: string | null
          about_image_public_id?: string | null
          about_button_text?: string | null
          about_button_link?: string | null
          about_show?: boolean
          banner_title?: string | null
          banner_subtitle?: string | null
          banner_description?: string | null
          banner_button_text?: string | null
          banner_button_link?: string | null
          banner_show?: boolean
          members_preview_show?: boolean
          members_preview_count?: number
          gallery_preview_show?: boolean
          gallery_preview_count?: number
          donation_show?: boolean
          quick_actions?: Json | null
          updated_at?: string
        }
        Update: {
          id?: string
          logo_url?: string | null
          logo_public_id?: string | null
          ganpati_image_url?: string | null
          ganpati_public_id?: string | null
          countdown_target?: string | null
          hero_welcome?: string | null
          hero_message?: string | null
          announcements_title?: string | null
          programs_title?: string | null
          gallery_title?: string | null
          birthday_title?: string | null
          donation_title?: string | null
          about_heading?: string | null
          about_description?: string | null
          about_image_url?: string | null
          about_image_public_id?: string | null
          about_button_text?: string | null
          about_button_link?: string | null
          about_show?: boolean
          banner_title?: string | null
          banner_subtitle?: string | null
          banner_description?: string | null
          banner_button_text?: string | null
          banner_button_link?: string | null
          banner_show?: boolean
          members_preview_show?: boolean
          members_preview_count?: number
          gallery_preview_show?: boolean
          gallery_preview_count?: number
          donation_show?: boolean
          quick_actions?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: string
          notification_birthday_enabled: boolean
          notification_announcement_enabled: boolean
          member_listing_enabled: boolean
          gallery_enabled: boolean
          donations_enabled: boolean
          birthday_cron_schedule: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          notification_birthday_enabled?: boolean
          notification_announcement_enabled?: boolean
          member_listing_enabled?: boolean
          gallery_enabled?: boolean
          donations_enabled?: boolean
          birthday_cron_schedule?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          notification_birthday_enabled?: boolean
          notification_announcement_enabled?: boolean
          member_listing_enabled?: boolean
          gallery_enabled?: boolean
          donations_enabled?: boolean
          birthday_cron_schedule?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          id: string
          title: string
          description: string | null
          agenda: string | null
          meeting_date: string
          start_time: string
          end_time: string | null
          location: string | null
          status: MeetingStatus
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          agenda?: string | null
          meeting_date: string
          start_time: string
          end_time?: string | null
          location?: string | null
          status?: MeetingStatus
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          agenda?: string | null
          meeting_date?: string
          start_time?: string
          end_time?: string | null
          location?: string | null
          status?: MeetingStatus
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      festival_years: {
        Row: {
          id: string
          year: number
          title: string
          theme: string | null
          description: string | null
          decoration_theme: string | null
          final_pooja_person1: string | null
          final_pooja_person2: string | null
          is_active: boolean
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          year: number
          title: string
          theme?: string | null
          description?: string | null
          decoration_theme?: string | null
          final_pooja_person1?: string | null
          final_pooja_person2?: string | null
          is_active?: boolean
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          year?: number
          title?: string
          theme?: string | null
          description?: string | null
          decoration_theme?: string | null
          final_pooja_person1?: string | null
          final_pooja_person2?: string | null
          is_active?: boolean
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      festival_transactions: {
        Row: {
          id: string
          festival_year_id: string
          type: TransactionType
          category: string
          amount: number
          description: string | null
          transaction_date: string
          receipt_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          festival_year_id: string
          type: TransactionType
          category: string
          amount: number
          description?: string | null
          transaction_date?: string
          receipt_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          festival_year_id?: string
          type?: TransactionType
          category?: string
          amount?: number
          description?: string | null
          transaction_date?: string
          receipt_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'festival_transactions_festival_year_id_fkey'
            columns: ['festival_year_id']
            isOneToOne: false
            referencedRelation: 'festival_years'
            referencedColumns: ['id']
          },
        ]
      }
      push_subscriptions: {
        Row: {
          id: string
          auth_user_id: string
          endpoint: string
          p256dh: string
          auth: string
          device_type: string
          browser: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          endpoint: string
          p256dh: string
          auth: string
          device_type?: string
          browser?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          device_type?: string
          browser?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_member_directory: {
        Row: {
          id: string | null
          full_name: string | null
          user_id: string | null
          village: string | null
          profile_photo_url: string | null
          position: string | null
          display_order: number | null
          role: UserRole | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_active_member: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      current_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_user_id_taken: {
        Args: { candidate: string }
        Returns: boolean
      }
      get_email_for_user_id: {
        Args: { candidate: string }
        Returns: string | null
      }
      admin_set_member_active: {
        Args: { target_profile_id: string; active: boolean }
        Returns: undefined
      }
      admin_set_member_role: {
        Args: { target_profile_id: string; new_role: UserRole }
        Returns: undefined
      }
      admin_update_member: {
        Args: { target_profile_id: string; fields: Record<string, unknown> }
        Returns: undefined
      }
      admin_hard_delete_member: {
        Args: { target_profile_id: string }
        Returns: undefined
      }
      admin_insert_member: {
        Args: {
          p_full_name: string
          p_user_id: string
          p_position: string
          p_bio: string
          p_profile_photo_url: string
          p_cloudinary_public_id: string
          p_display_order: number
          p_is_active: boolean
        }
        Returns: string
      }
      create_birthday_notifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      run_birthday_check: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      deactivate_push_subscription: {
        Args: { p_endpoint: string }
        Returns: undefined
      }
    }
    Enums: {
      user_role: UserRole
      aarti_category: AartiCategory
      announcement_priority: AnnouncementPriority
      notification_type: NotificationType
      meeting_status: MeetingStatus
      transaction_type: TransactionType
      calendar_event_type: CalendarEventType
      calendar_event_status: CalendarEventStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
