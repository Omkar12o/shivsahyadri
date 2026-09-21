import { getCloudinaryConfig, uploadToCloudinary } from '@/lib/cloudinary'
import { storageService } from '@/services/storageService'
import { isValidAudioFile, isValidImageFile } from '@/utils'

export type UploadFolder = 'logo' | 'hero' | 'members' | 'gallery' | 'events' | 'aarti' | 'qr'

const CLOUDINARY_FOLDER: Record<UploadFolder, string> = {
  logo: 'ganesh-mandal/logo',
  hero: 'ganesh-mandal/hero',
  members: 'ganesh-mandal/members',
  gallery: 'ganesh-mandal/gallery',
  events: 'ganesh-mandal/events',
  aarti: 'ganesh-mandal/aarti',
  qr: 'ganesh-mandal/qr',
}

const STORAGE_BUCKET: Record<UploadFolder, 'gallery' | 'program-images' | 'announcement-images' | 'profile-photos' | 'site-logos'> = {
  logo: 'site-logos',
  hero: 'gallery',
  members: 'profile-photos',
  gallery: 'gallery',
  events: 'program-images',
  aarti: 'gallery',
  qr: 'gallery',
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export interface UploadResult {
  url: string
  public_id: string | null
}

/**
 * Single reliable image upload service.
 * Uses Cloudinary (unsigned preset) when configured, otherwise falls back to
 * Supabase Storage. Returns the public URL plus the Cloudinary public_id
 * (used later for Hard Delete). Throws on any failure.
 */
export async function uploadImage(
  file: File,
  folder: UploadFolder,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  if (!file) throw new Error('No file selected.')
  if (!isValidImageFile(file)) {
    throw new Error('Please upload a valid image file (JPG, PNG, WEBP or GIF).')
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image is too large. Maximum size is 10 MB.')
  }

  const { isConfigured } = getCloudinaryConfig()
  if (isConfigured) {
    return uploadToCloudinary(file, CLOUDINARY_FOLDER[folder], onProgress)
  }

  const url = await storageService.upload(STORAGE_BUCKET[folder], CLOUDINARY_FOLDER[folder], file, onProgress)
  return { url, public_id: null }
}

/**
 * Uploads an audio file (aarti recordings) to Supabase Storage.
 * Returns the public URL. Throws on any failure.
 */
export async function uploadAudio(
  file: File,
  folder: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  if (!file) throw new Error('No file selected.')
  if (!isValidAudioFile(file)) {
    throw new Error('Please upload a valid audio file (MP3, WAV, OGG or M4A). Max 20 MB.')
  }
  return storageService.upload('aarti-audio', folder, file, onProgress)
}

/** Returns true when the URL points at a local file path or blob (should not be saved to DB). */
export function isInvalidImageUrl(url: string | null | undefined): boolean {
  if (!url) return true
  return /^(file:|blob:|C:\\|\/src\/)/i.test(url)
}