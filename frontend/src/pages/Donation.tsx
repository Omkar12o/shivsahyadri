import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { settingsService } from '@/services/settingsService'
import { LoadingScreen } from '@/components/ui/feedback'
import type { DonationInfo } from '@/types'
export default function Donation(){
  const [info,setInfo]=useState<DonationInfo|null>(null)
  const [amount,setAmount]=useState('500')
  const [loading,setLoading]=useState(true)
  const load = () => settingsService.getDonationInfo().then(setInfo)
  useEffect(()=>{ load().finally(()=>setLoading(false)) },[])
  // Live: admin updates Donation Info / QR -> Donation page updates instantly
  useEffect(()=>{
    const ch = supabase.channel('donation-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_info' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  },[])
  if(loading) return <LoadingScreen/>
  const upiUrl = info ? `upi://pay?pa=${info.upi_id}&pn=${encodeURIComponent(info.mandal_name)}&am=${amount}&cu=INR` : ''
  return (
    <div className="container-main px-4 py-10 max-w-2xl mx-auto">
      <h1 className="page-title">💰 Donation</h1>
      <p className="page-subtitle">Support Shivsaydri Ganesh Mandal</p>
      <div className="card p-6 mt-6">
        <p className="text-sm text-gray-500">Scan QR or pay via UPI</p>
        <div className="flex gap-2 mt-3">
          {['100','500','1000','2000'].map(a=> <button key={a} onClick={()=>setAmount(a)} className={`btn text-sm ${amount===a?'btn-primary':'btn-outline'}`}>₹{a}</button>)}
          <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Custom" className="input w-28" />
        </div>
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-2xl p-4 flex flex-col items-center">
            {info?.upi_qr_url ? <img src={info.upi_qr_url} alt="UPI QR" className="w-48 h-48 object-contain"/> : <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center text-4xl">QR</div>}
            <p className="text-xs text-gray-500 mt-2">{info?.upi_id ?? 'shivsaydrimandal@upi'}</p>
            <a href={upiUrl} className="btn-primary w-full mt-3 justify-center">Donate ₹{amount} via UPI</a>
          </div>
          <div className="space-y-3 text-sm">
            <p><span className="font-bold">Mandal:</span> {info?.mandal_name}</p>
            <p><span className="font-bold">UPI ID:</span> {info?.upi_id}</p>
            {info?.bank_name && <p><span className="font-bold">Bank:</span> {info.bank_name} <br/> A/c: {info.account_number} <br/> IFSC: {info.ifsc_code}</p>}
            <p className="text-gray-600 text-xs bg-yellow-50 border border-yellow-200 rounded-xl p-3">⚠️ For real payments, use a verified payment provider. Only mark success after verification.</p>
            {info?.instructions && <p className="text-gray-600 whitespace-pre-wrap">{info.instructions}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
