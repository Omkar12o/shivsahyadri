import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { videoService } from '@/services/videoService'
import { LoadingScreen, EmptyState } from '@/components/ui/feedback'
import { getYouTubeEmbedUrl } from '@/utils'
import type { Video } from '@/types'
export default function Videos(){
  const [items,setItems]=useState<Video[]>([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    videoService.list().then(setItems).finally(()=>setLoading(false))
    const ch = supabase.channel('videos-live').on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, () => videoService.list().then(setItems)).subscribe()
    return () => { supabase.removeChannel(ch) }
  },[])
  if(loading) return <LoadingScreen/>
  return (
    <div className="container-main px-4 py-10">
      <h1 className="page-title">🎥 Videos</h1>
      <p className="page-subtitle">Aarti, programs, visarjan</p>
      {items.length===0 ? <div className="mt-8"><EmptyState title="No videos yet"/></div> : (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {items.map(v=> {
            const embed = getYouTubeEmbedUrl(v.video_url)
            return <div key={v.id} className="card overflow-hidden">{embed ? <iframe src={embed} title={v.title} className="w-full aspect-video" allowFullScreen/> : <video src={v.video_url} controls className="w-full aspect-video"/>}<div className="p-4"><p className="font-bold">{v.title}</p><p className="text-sm text-gray-500">{v.category}</p>{v.description && <p className="text-sm text-gray-600 mt-1">{v.description}</p>}</div></div>
          })}
        </div>
      )}
    </div>
  )
}
