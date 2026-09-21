export function getCloudinaryConfig() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined
  return { cloudName, preset, isConfigured: Boolean(cloudName && preset) }
}

export type CloudinaryFolder =
  | string

export interface CloudinaryUploadResult {
  url: string
  public_id: string | null
}

/**
 * Uploads an image to Cloudinary using the configured unsigned upload preset.
 * Returns the secure URL and the public_id (used later for Hard Delete).
 * Throws on failure.
 */
export async function uploadToCloudinary(
  file: File,
  folder: CloudinaryFolder = 'ganesh-mandal',
  onProgress?: (percent: number) => void,
): Promise<CloudinaryUploadResult> {
  const { cloudName, preset } = getCloudinaryConfig()
  if (!cloudName || !preset) {
    throw new Error('Cloudinary not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in frontend/.env')
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', preset)
  form.append('folder', folder)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText)
          if (res.secure_url) resolve({ url: res.secure_url as string, public_id: res.public_id ?? null })
          else reject(new Error('Cloudinary upload failed - no secure_url returned'))
        } catch (e) { reject(e) }
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          reject(new Error(err.error?.message || `Cloudinary upload failed (${xhr.status})`))
        } catch {
          reject(new Error(`Cloudinary upload failed (${xhr.status})`))
        }
      }
    }
    xhr.onerror = () => reject(new Error('Network error uploading to Cloudinary'))
    xhr.send(form)
  })
}