import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { settingsService } from '@/services/settingsService'
import { LoadingScreen } from '@/components/ui/feedback'
import type { MandalInfo } from '@/types'
export default function Contact(){
  const [info,setInfo]=useState<MandalInfo|null>(null)
  const [loading,setLoading]=useState(true)
  const load = () => settingsService.getMandalInfo().then(setInfo)
  useEffect(()=>{ load().finally(()=>setLoading(false)) },[])
  // Live: admin updates Mandal Info -> Contact page updates instantly
  useEffect(()=>{
    const ch = supabase.channel('contact-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mandal_info' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  },[])
  if(loading) return <LoadingScreen/>
  return (
    <div className="container-main px-4 py-10">
      <h1 className="page-title">📍 Contact & Location</h1>
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="card p-6 space-y-2">
          <p><span className="font-bold">Mandal:</span> {info?.name}</p>
          <p><span className="font-bold">Village:</span> {info?.village}</p>
          <p>📞 {info?.contact_phone ?? '+91 98765 43210'}</p>
          <p>📱 WhatsApp: {info?.contact_whatsapp ?? 'Available'}</p>
          <p>✉️ {info?.contact_email ?? 'mandal@shivsaydri.org'}</p>
          <p>📍 {info?.address ?? 'Near Ganpati Mandap, Umarkhanchan'}</p>
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm">
            <p className="font-bold">🚨 Emergency</p>
            <p>Police: 112 • Ambulance: 108 • Fire: 101</p>
            <p className="text-xs text-gray-500">Use authoritative local numbers; admin can update Mandal Emergency Contact in settings.</p>
          </div>
        </div>
        <div className="card overflow-hidden h-96">
          {info?.map_embed_url ? <iframe src={info.map_embed_url} className="w-full h-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade"/> : <div className="flex h-full items-center justify-center text-gray-400 p-8 text-center">Map not configured<br/><span className="text-xs">Admin can set Google Maps embed URL in Settings.</span></div>}
        </div>
      </div>
    </div>
  )
}
