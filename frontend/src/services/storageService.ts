import { getAccessToken, getSupabaseAnonKey, getSupabaseUrl, supabase } from '@/lib/supabase'
import { getErrorMessage, isValidAudioFile, isValidImageFile } from '@/utils'

export type StorageBucket =
  | 'profile-photos'
  | 'gallery'
  | 'aarti-audio'
  | 'program-images'
  | 'announcement-images'
  | 'video-thumbnails'
  | 'site-logos'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_PROFILE_BYTES = 5 * 1024 * 1024
const MAX_AUDIO_BYTES = 20 * 1024 * 1024

function validateFile(bucket: StorageBucket, file: File): string | null {
  if (bucket === 'aarti-audio') {
    if (!isValidAudioFile(file)) {
      return 'Please upload a valid audio file (MP3, WAV, OGG or M4A).'
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return 'Audio file is too large. Maximum size is 20 MB.'
    }
    return null
  }

  if (!isValidImageFile(file)) {
    return 'Please upload a valid image file (JPG, PNG, WEBP or GIF).'
  }
  if (bucket === 'profile-photos' && file.size > MAX_PROFILE_BYTES) {
    return 'Profile photo is too large. Maximum size is 5 MB.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image is too large. Maximum size is 10 MB.'
  }
  return null
}

function safeFileName(name: string): string {
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')).toLowerCase() : ''
  const base = name
    .slice(0, name.length - ext.length)
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .slice(0, 40)
  return `${Date.now()}-${base || 'file'}${ext}`
}

/**
 * Uploads a file with real progress reporting using XMLHttpRequest against the
 * Supabase Storage REST endpoint (the JS client does not expose progress).
 */
function xhrUpload(
  bucket: StorageBucket,
  path: string,
  file: File,
  token: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = `${getSupabaseUrl()}/storage/v1/object/${bucket}/${encodeURI(path)}`
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url, true)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('apikey', getSupabaseAnonKey())
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.setRequestHeader('x-upsert', 'false')

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        let message = `Upload failed (${xhr.status})`
        try {
          const parsed = JSON.parse(xhr.responseText)
          message = parsed.message || parsed.error || message
        } catch {
          /* keep default message */
        }
        reject(new Error(message))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload.'))
    xhr.send(file)
  })
}

export const storageService = {
  validateFile,

  async upload(
    bucket: StorageBucket,
    folder: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<string> {
    const validationError = validateFile(bucket, file)
    if (validationError) throw new Error(validationError)

    const token = await getAccessToken()
    if (!token) throw new Error('You must be signed in to upload files.')

    const path = `${folder}/${safeFileName(file.name)}`
    await xhrUpload(bucket, path, file, token, onProgress)

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  async remove(bucket: StorageBucket, publicUrl: string): Promise<void> {
    const marker = `/storage/v1/object/public/${bucket}/`
    const index = publicUrl.indexOf(marker)
    if (index === -1) return
    const path = decodeURIComponent(publicUrl.slice(index + marker.length))
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) throw new Error(getErrorMessage(error))
  },
}
