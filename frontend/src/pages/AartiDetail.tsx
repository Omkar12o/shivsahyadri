import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { aartiService } from '@/services/aartiService'
import { LoadingScreen, ErrorState } from '@/components/ui/feedback'
import { formatTime } from '@/utils'
import type { Aarti } from '@/types'
export default function AartiDetail(){
  const { id } = useParams()
  const [aarti,setAarti]=useState<Aarti|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  useEffect(()=>{ if(!id) return; aartiService.getById(id).then(setAarti).catch(e=>setError(e.message)).finally(()=>setLoading(false)) },[id])
  // Live: admin edits this aarti -> detail page updates instantly
  useEffect(()=>{
    if(!id) return
    const ch = supabase.channel(`aarti-detail-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aartis', filter: `id=eq.${id}` }, () => {
        aartiService.getById(id).then(setAarti).catch(() => {})
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  },[id])
  if(loading) return <LoadingScreen/>
  if(error) return <div className="container-main px-4 py-10"><ErrorState description={error}/></div>
  if(!aarti) return <div className="container-main px-4 py-10 text-center"><p>Not found</p><Link to="/aarti" className="btn-primary mt-4">Back to Aartis</Link></div>
  return (
    <div className="container-main px-4 py-10 max-w-3xl mx-auto">
      <Link to="/aarti" className="text-sm text-saffron">← All Aartis</Link>
      <h1 className="page-title mt-2">🙏 {aarti.title}</h1>
      <p className="text-sm text-gray-500">{aarti.category} • {formatTime(aarti.time)}</p>
      {aarti.audio_url && <audio controls src={aarti.audio_url} className="w-full mt-4 rounded-xl" />}
      <div className="card p-6 mt-6">
        <p className="whitespace-pre-wrap leading-relaxed font-devanagari text-lg">{aarti.lyrics}</p>
        {aarti.description && <p className="text-sm text-gray-500 mt-4 border-t pt-4">{aarti.description}</p>}
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={()=>navigator.share?.({title:aarti.title, text:aarti.lyrics}).catch(()=>{})} className="btn-outline text-sm">↗ Share</button>
        <button onClick={()=>navigator.clipboard.writeText(aarti.lyrics)} className="btn-outline text-sm">📋 Copy Lyrics</button>
      </div>
    </div>
  )
}
