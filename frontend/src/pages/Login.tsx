import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserRound, ShieldCheck, UserPlus, ArrowRight } from 'lucide-react'
import { settingsService } from '@/services/settingsService'
import { cn } from '@/utils'

export default function Login() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    settingsService
      .getSiteSettings()
      .then((s) => setLogoUrl(s?.logo_url ?? null))
      .catch(() => {})
  }, [])

  return (
    <div className="container-main px-4 py-10 md:py-16">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl gradient-saffron flex items-center justify-center shadow-lg shadow-saffron/30">
          {logoUrl ? (
            <img src={logoUrl} alt="Mandal Logo" className="w-full h-full object-contain p-1" loading="eager" />
          ) : (
            <span className="text-white font-bold text-2xl">श्री</span>
          )}
        </div>
        <h1 className="mt-4 text-3xl md:text-4xl font-bold">Shivsaydri Ganesh Mandal</h1>
        <p className="text-gray-500">Umarkhanchan • गणपती बाप्पा मोरया 🙏</p>
      </div>

      {/* Welcome */}
      <div className="text-center mt-8">
        <h2 className="text-2xl font-bold">Welcome</h2>
        <p className="text-sm text-gray-500 mt-1">Choose how you would like to sign in.</p>
      </div>

      {/* Two cards */}
      <div className="grid md:grid-cols-2 gap-6 mt-8 max-w-3xl mx-auto">
        {/* MEMBER CARD */}
        <div className="card p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-saffron/10 flex items-center justify-center">
            <UserRound className="w-8 h-8 text-saffron" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-xl font-bold text-gray-900">Member</h3>
          <p className="text-sm text-gray-500 mt-1">Access your member dashboard, profile and notifications.</p>
          <Link to="/member/login" className="btn-primary w-full mt-6">
            <UserRound className="w-4 h-4 mr-2" aria-hidden="true" />
            Login as Member
          </Link>
          <p className="text-sm text-gray-500 mt-6 mb-1">New member?</p>
          <Link to="/member/register" className="btn-secondary w-full">
            <UserPlus className="w-4 h-4 mr-2" aria-hidden="true" />
            Create Member Account
          </Link>
        </div>

        {/* ADMIN CARD */}
        <div
          className={cn(
            'card p-8 flex flex-col items-center text-center border-2 border-primary-700/20',
            'bg-gradient-to-b from-white to-primary-50',
          )}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-700 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-xl font-bold text-gray-900">Admin</h3>
          <p className="text-sm text-gray-500 mt-1">Manage the website, Aarti, programs, members and settings.</p>
          <Link to="/admin/login" className="btn-primary w-full mt-6">
            <ShieldCheck className="w-4 h-4 mr-2" aria-hidden="true" />
            Login as Admin
          </Link>
          <p className="text-xs text-gray-400 mt-6">Admins and Super Admins only.</p>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-10">
        <Link to="/" className="inline-flex items-center gap-1 text-saffron font-medium hover:underline">
          Back to Homepage <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </p>
    </div>
  )
}