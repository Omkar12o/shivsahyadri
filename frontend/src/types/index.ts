import type {
  AartiCategory,
  AnnouncementPriority,
  NotificationType,
  UserRole,
  MeetingStatus,
  TransactionType,
  CalendarEventType,
  CalendarEventStatus,
} from '@/lib/database.types'

export type {
  AartiCategory,
  AnnouncementPriority,
  NotificationType,
  UserRole,
  MeetingStatus,
  TransactionType,
  CalendarEventType,
  CalendarEventStatus,
} from '@/lib/database.types'

export interface Profile {
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

export interface MemberDirectoryEntry {
  id: string
  full_name: string
  user_id: string
  village: string | null
  profile_photo_url: string | null
  position: string | null
  bio: string | null
  display_order: number | null
  created_at: string
  role: UserRole
}

export interface Aarti {
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

export interface Program {
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

export interface Announcement {
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

export interface GalleryImage {
  id: string
  title: string
  image_url: string
  cloudinary_public_id: string | null
  category: string
  event_date: string | null
  is_published: boolean
  created_at: string
}

export interface Video {
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

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  related_member_id: string | null
  related_program_id: string | null
  birthday_date: string | null
  created_at: string
  is_read?: boolean
}

export interface NotificationRead {
  id: string
  notification_id: string
  user_id: string
  read_at: string
}

export interface PushSubscription {
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

export interface ChatMessage {
  id: string
  user_id: string
  message: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  deleted_by: string | null
}

export interface CalendarEvent {
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

export interface ChatSender {
  profile: { id: string; full_name: string | null; profile_photo_url: string | null; role: UserRole | null }
}

export interface DonationInfo {
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

export interface MandalInfo {
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
  social_media: Record<string, string>
  updated_at: string
}

export interface QuickAction {
  id: string
  label: string
  icon: string
  order: number
  enabled: boolean
  destination: string
}

export interface SiteSettings {
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
  quick_actions: QuickAction[] | null
  updated_at: string
}

export interface AdminSettings {
  id: string
  notification_birthday_enabled: boolean
  notification_announcement_enabled: boolean
  member_listing_enabled: boolean
  gallery_enabled: boolean
  donations_enabled: boolean
  birthday_cron_schedule: string | null
  updated_at: string
}

export interface Meeting {
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

export interface FestivalYear {
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

export interface FestivalTransaction {
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

export interface FestivalFinanceSummary {
  festival_year_id: string
  year: number
  total_income: number
  total_expense: number
  remaining: number
}

export interface AuthUser {
  id: string
  email: string | null
  user_metadata: {
    full_name?: string
    user_id?: string
  }
}

export interface Session {
  user: AuthUser
  access_token: string
  refresh_token: string
  expires_at: number
}

export interface RegisterData {
  full_name: string
  user_id: string
  email: string
  mobile: string
  password: string
  confirm_password: string
  date_of_birth: string
  birthday_time: string
  village: string
  address: string
  profile_photo?: File
  birthday_visibility: boolean
}

export interface LoginData {
  identifier: string
  password: string
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  page_size: number
  total_pages: number
}

export const AARTI_CATEGORIES: { value: AartiCategory; label: string; icon: string }[] = [
  { value: 'morning', label: 'Morning Aarti', icon: '☀️' },
  { value: 'afternoon', label: 'Afternoon Aarti', icon: '🌤️' },
  { value: 'evening', label: 'Evening Aarti', icon: '🌅' },
  { value: 'night', label: 'Night Aarti', icon: '🌙' },
  { value: 'special', label: 'Special Aarti', icon: '✨' },
]

export const AARTI_CATEGORY_LABELS: Record<AartiCategory, string> = {
  morning: 'Morning Aarti',
  afternoon: 'Afternoon Aarti',
  evening: 'Evening Aarti',
  night: 'Night Aarti',
  special: 'Special Aarti',
}

export const PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const PRIORITY_COLORS: Record<AnnouncementPriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  birthday: '🎂',
  announcement: '📢',
  program: '📅',
  aarti: '🙏',
  system: '⚙️',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  member: 'Member',
  super_admin: 'Super Admin',
}

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const MEETING_STATUS_COLORS: Record<MeetingStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export const GALLERY_CATEGORIES = [
  'Ganpati',
  'Decoration',
  'Sthapana',
  'Aarti',
  'Programs',
  'Mahaprasad',
  'Visarjan',
  'Jery',
  'Previous Years',
] as const

export const YEAR_FILTER_CATEGORIES: readonly string[] = ['Jery', 'Previous Years']

export function isAdminRole(role: UserRole | 'super_admin' | null | undefined): boolean {
  return role === 'admin' || role === 'super_admin'
}
