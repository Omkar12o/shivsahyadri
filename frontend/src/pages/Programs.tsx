import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { programService } from '@/services/programService'
import { LoadingScreen, EmptyState } from '@/components/ui/feedback'
import { formatDate, formatTime } from '@/utils'
import { Calendar, MapPin, Clock } from 'lucide-react'
import type { Program } from '@/types'
export default function Programs(){
  const [items,setItems]=useState<Program[]>([])
  const [loading,setLoading]=useState(true)
  const load=()=> programService.list().then(setItems).finally(()=>setLoading(false))
  useEffect(()=>{
    load()
    const ch = supabase.channel('programs-live').on('postgres_changes', { event: '*', schema: 'public', table: 'programs' }, () => load()).subscribe()
    return () => { supabase.removeChannel(ch) }
  },[])
  if(loading) return <LoadingScreen/>
  const today = new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'})
  const todays = items.filter(p=>p.event_date===today)
  const upcoming = items.filter(p=>p.event_date>today)
  const past = items.filter(p=>p.event_date<today)
  return (
    <div className="container-main px-4 py-10">
      <h1 className="page-title">📅 Programs & Calendar</h1>
      <p className="page-subtitle">Ganeshotsav schedule</p>
      {items.length===0 ? <div className="mt-8"><EmptyState title="No programs yet" description="Schedule will be published by Admin."/></div> : (
        <div className="mt-6 space-y-8">
          <section><h2 className="font-bold text-lg">Today</h2>{todays.length===0?<p className="text-sm text-gray-500 mt-2">No events today.</p>:<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">{todays.map(p=> <Card key={p.id} p={p}/>)}</div>}</section>
          <section><h2 className="font-bold text-lg">Upcoming</h2>{upcoming.length===0?<p className="text-sm text-gray-500 mt-2">All caught up.</p>:<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">{upcoming.map(p=> <Card key={p.id} p={p}/>)}</div>}</section>
          {past.length>0 && <section><h2 className="font-bold text-lg">Completed</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3 opacity-75">{past.slice(0,4).map(p=> <Card key={p.id} p={p}/>)}</div></section>}
        </div>
      )}
    </div>
  )
}
function Card({ p }: { p: Program }) {
  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="relative w-full aspect-[16/9] bg-gray-100 overflow-hidden">
        {p.image_url ? (
          <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-saffron/20 to-primary-100 flex items-center justify-center">
            <Calendar className="w-10 h-10 text-saffron" aria-hidden="true" />
          </div>
        )}
        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur text-saffron text-xs font-bold px-2 py-1 rounded-full shadow">
          {formatDate(p.event_date)}
        </span>
      </div>
      <div className="p-5 flex flex-col gap-1 flex-1">
        <p className="font-bold text-gray-900">{p.title}</p>
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <Clock className="w-4 h-4" aria-hidden="true" />
          {formatTime(p.start_time)}{p.end_time ? ` - ${formatTime(p.end_time)}` : ''}
        </p>
        {p.location && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" aria-hidden="true" />{p.location}</p>}
        {p.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.description}</p>}
      </div>
    </div>
  )
}
