import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { formatBirthday } from '@/utils'
export default function Profile(){
  const { profile, updateProfile, changePassword, uploadProfilePhoto } = useAuth()
  const [form,setForm]=useState({ full_name: profile?.full_name ?? '', village: profile?.village ?? '', address: profile?.address ?? '', mobile: profile?.mobile ?? '', birthday_visibility: profile?.birthday_visibility ?? true })
  const [msg,setMsg]=useState<string|null>(null)
  const [pw,setPw]=useState('')
  if(!profile) return <div className="container-main px-4 py-10">Not logged in</div>
  return (
    <div className="container-main px-4 py-10 max-w-2xl mx-auto">
      <h1 className="page-title">My Profile</h1>
      <p className="page-subtitle">🎂 {formatBirthday(profile.date_of_birth)} • @{profile.user_id}</p>
      <div className="card p-6 mt-6 space-y-4">
        <div className="flex items-center gap-4">
          {profile.profile_photo_url ? <img src={profile.profile_photo_url} alt="" className="w-20 h-20 rounded-2xl object-cover"/> : <div className="w-20 h-20 rounded-2xl bg-saffron text-white flex items-center justify-center font-bold"> {profile.full_name.slice(0,2).toUpperCase()}</div>}
          <label className="btn-outline text-sm cursor-pointer">Upload Photo <input type="file" hidden accept="image/*" onChange={async e=>{ const f=e.target.files?.[0]; if(!f) return; try{ await uploadProfilePhoto(f); setMsg('Photo updated') } catch(err:any){ setMsg(err.message)} }}/></label>
        </div>
        <div><label className="label">Full Name</label><input className="input" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></div>
        <div><label className="label">Village</label><input className="input" value={form.village} onChange={e=>setForm({...form,village:e.target.value})}/></div>
        <div><label className="label">Address</label><input className="input" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div>
        <div><label className="label">Mobile</label><input className="input" value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value})}/></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.birthday_visibility} onChange={e=>setForm({...form,birthday_visibility:e.target.checked})}/> Show my birthday</label>
        {msg && <p className="text-sm bg-green-50 border border-green-200 rounded-xl p-3">{msg}</p>}
        <button className="btn-primary" onClick={async()=>{ const r=await updateProfile(form as any); setMsg(r.error ?? 'Saved') }}>Save</button>
      </div>
      <div className="card p-6 mt-6">
        <h3 className="font-bold">Change Password</h3>
        <div className="flex gap-2 mt-3"><input type="password" className="input" placeholder="New password" value={pw} onChange={e=>setPw(e.target.value)}/><button className="btn-primary" onClick={async()=>{ const r=await changePassword(pw); setMsg(r.error ?? 'Password updated')}}>Update</button></div>
      </div>
    </div>
  )
}
