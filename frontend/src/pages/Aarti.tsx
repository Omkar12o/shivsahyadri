import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { aartiService } from '@/services/aartiService'
import { LoadingScreen, EmptyState } from '@/components/ui/feedback'
import { formatTime } from '@/utils'
import type { Aarti, AartiCategory } from '@/types'
import { AARTI_CATEGORIES } from '@/types'

export default function Aarti(){
  const [items,setItems]=useState<Aarti[]>([])
  const [cat,setCat]=useState<AartiCategory|'all'>('all')
  const [loading,setLoading]=useState(true)
  const load=()=>{ aartiService.list({ category: cat }).then(setItems).finally(()=>setLoading(false)) }
  useEffect(()=>{
    load()
    const ch = supabase.channel('aartis-live').on('postgres_changes', { event: '*', schema: 'public', table: 'aartis' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  },[cat])
  if(loading) return <LoadingScreen label="Loading Aartis..."/>
  return (
    <div className="container-main px-4 py-10">
      <h1 className="page-title">🙏 Aarti Library</h1>
      <p className="page-subtitle">Marathi lyrics, audio, and timings</p>
      {/* Off Arti Book - Aarti Book for all mobile users */}
      <Link to="/aarti/book" className="mt-4 block bg-gradient-to-r from-saffron via-orange-500 to-red-600 rounded-2xl p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4 hover:shadow-lg transition">
        <div>
          <p className="text-xs font-bold bg-white/20 inline-block px-3 py-1 rounded-full">📖 OFF Arti Book • सर्व मोबाईल धारकांसाठी</p>
          <h3 className="text-xl font-bold mt-2 font-devanagari">आरती पुस्तक — सर्वांना पाठवावे</h3>
          <p className="text-sm text-white/90">🙏 ॥ गणपती बाप्पा मोरया ॥ • 24 आरत्या एका पुस्तकात — Offline, Share, Print</p>
        </div>
        <span className="bg-white text-saffron px-6 py-3 rounded-xl font-bold whitespace-nowrap">Open Book →</span>
      </Link>
      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
        <button onClick={()=>setCat('all')} className={`btn ${cat==='all'?'btn-primary':'btn-outline'} text-sm`}>All</button>
        {AARTI_CATEGORIES.map(c=> <button key={c.value} onClick={()=>setCat(c.value)} className={`btn ${cat===c.value?'btn-primary':'btn-outline'} text-sm`}>{c.icon} {c.label}</button>)}
      </div>
      {items.length===0 ? <div className="mt-8"><EmptyState title="No Aartis found" description="Admin will publish Aartis soon."/></div> : (
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {items.map(a=> (
            <Link key={a.id} to={`/aarti/${a.id}`} className="card p-5 hover:shadow-lg transition">
              <div className="flex justify-between"><span className="badge-primary text-xs">{a.category}</span><span className="text-xs text-gray-500">{formatTime(a.time)}</span></div>
              <h3 className="font-bold mt-2">{a.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-3 mt-1 whitespace-pre-wrap">{a.lyrics.slice(0,120)}...</p>
              {a.audio_url && <p className="text-xs text-saffron mt-2">▶ Audio available</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
