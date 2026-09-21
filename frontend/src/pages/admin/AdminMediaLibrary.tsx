import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { galleryService } from '@/services/galleryService'
import { videoService } from '@/services/videoService'
import { mediaService } from '@/services/mediaService'
import { getYouTubeThumbnail, cn } from '@/utils'
import type { GalleryImage, Video } from '@/types'
import { useToast } from '@/components/ToastProvider'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Images, Video as VideoIcon, Upload, Eye, EyeOff, ArrowLeft } from 'lucide-react'

type Tab = 'photos' | 'videos'

interface DeleteTarget {
  kind: 'photo' | 'video'
  id: string
  title: string
  cloudinary_public_id?: string | null
  image_url?: string
}

export default function AdminMediaLibrary() {
  const { success: toastSuccess, error: toastError } = useToast()
  const [tab, setTab] = useState<Tab>('photos')
  const [photos, setPhotos] = useState<GalleryImage[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [photosResult, videosResult] = await Promise.all([
        galleryService.list({ publishedOnly: false }),
        videoService.list({ publishedOnly: false }),
      ])
      setPhotos(photosResult)
      setVideos(videosResult)
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to load media.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const togglePhotoPublish = async (photo: GalleryImage) => {
    try {
      await galleryService.update(photo.id, { is_published: !photo.is_published })
      toastSuccess(photo.is_published ? `"${photo.title}" unpublished from public Gallery.` : `"${photo.title}" published to public Gallery.`)
      loadAll()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to update.')
    }
  }

  const toggleVideoPublish = async (video: Video) => {
    try {
      await videoService.update(video.id, { is_published: !video.is_published })
      toastSuccess(video.is_published ? `"${video.title}" unpublished from public Videos.` : `"${video.title}" published to public Videos.`)
      loadAll()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to update.')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.kind === 'photo') {
        if (deleteTarget.cloudinary_public_id) {
          await mediaService.deleteCloudinary(deleteTarget.cloudinary_public_id)
        }
        await galleryService.remove(deleteTarget.id)
      } else {
        await videoService.remove(deleteTarget.id)
      }
      toastSuccess(`✓ Deleted successfully — "${deleteTarget.title}" permanently removed.`)
      setDeleteTarget(null)
      loadAll()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to delete.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-saffron border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="text-sm text-gray-500 mt-1">All photos and videos in one place. Toggle visibility or delete media.</p>
        </div>
        <Link
          to={tab === 'photos' ? '/admin/gallery' : '/admin/videos'}
          className="btn-primary text-sm"
        >
          <Upload className="w-4 h-4 mr-1.5" aria-hidden="true" />
          {tab === 'photos' ? 'Upload Photos' : 'Add Video'}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mt-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('photos')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            tab === 'photos' ? 'bg-white text-saffron shadow-sm' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          <Images className="w-4 h-4" aria-hidden="true" />
          Photos ({photos.length})
        </button>
        <button
          onClick={() => setTab('videos')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            tab === 'videos' ? 'bg-white text-saffron shadow-sm' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          <VideoIcon className="w-4 h-4" aria-hidden="true" />
          Videos ({videos.length})
        </button>
      </div>

      {tab === 'photos' && (
        <>
          {photos.length === 0 ? (
            <div className="card p-10 mt-4 text-center">
              <p className="text-gray-500">No photos in the library yet.</p>
              <Link to="/admin/gallery" className="inline-flex items-center gap-1 text-sm font-semibold text-saffron mt-2">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Go to Gallery to upload photos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
              {photos.map((photo) => (
                <div key={photo.id} className="card overflow-hidden">
                  <div className="relative">
                    <img src={photo.image_url} alt={photo.title} className="h-28 w-full object-cover" />
                    {!photo.is_published && (
                      <span className="absolute top-2 left-2 badge bg-gray-900/70 text-white">Draft</span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium truncate" title={photo.title}>{photo.title}</p>
                    <p className="text-xs text-gray-400">{photo.category}</p>
                    <div className="flex items-center justify-between gap-1 mt-1.5">
                      <button
                        onClick={() => togglePhotoPublish(photo)}
                        className={cn(
                          'flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors',
                          photo.is_published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500',
                        )}
                      >
                        {photo.is_published ? <Eye className="w-3.5 h-3.5" aria-hidden="true" /> : <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />}
                        {photo.is_published ? 'Visible' : 'Hidden'}
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            kind: 'photo',
                            id: photo.id,
                            title: photo.title,
                            cloudinary_public_id: photo.cloudinary_public_id,
                            image_url: photo.image_url,
                          })
                        }
                        className="text-xs px-2 py-1 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'videos' && (
        <>
          {videos.length === 0 ? (
            <div className="card p-10 mt-4 text-center">
              <p className="text-gray-500">No videos in the library yet.</p>
              <Link to="/admin/videos" className="inline-flex items-center gap-1 text-sm font-semibold text-saffron mt-2">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Go to Videos to add a video
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
              {videos.map((video) => (
                <div key={video.id} className="card overflow-hidden">
                  <div className="relative">
                    <img
                      src={video.thumbnail_url ?? getYouTubeThumbnail(video.video_url) ?? ''}
                      alt={video.title}
                      className="h-28 w-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    {!video.is_published && (
                      <span className="absolute top-2 left-2 badge bg-gray-900/70 text-white">Draft</span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium truncate" title={video.title}>{video.title}</p>
                    <div className="flex items-center justify-between gap-1 mt-1.5">
                      <button
                        onClick={() => toggleVideoPublish(video)}
                        className={cn(
                          'flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors',
                          video.is_published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500',
                        )}
                      >
                        {video.is_published ? <Eye className="w-3.5 h-3.5" aria-hidden="true" /> : <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />}
                        {video.is_published ? 'Visible' : 'Hidden'}
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ kind: 'video', id: video.id, title: video.title })}
                        className="text-xs px-2 py-1 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.kind === 'photo' ? 'Delete Photo' : 'Delete Video'}
        message={
          <>
            This permanently removes <b>{deleteTarget?.title}</b> from the database
            {deleteTarget?.cloudinary_public_id ? ' and deletes the image file from Cloudinary' : ''}. This cannot be
            undone.
          </>
        }
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}