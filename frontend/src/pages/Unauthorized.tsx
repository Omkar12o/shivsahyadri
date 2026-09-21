import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ShieldX } from 'lucide-react'

export default function Unauthorized() {
  const { profile } = useAuth()
  const nav = useNavigate()

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="container-main py-20 text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
          <ShieldX className="w-8 h-8 text-red-600" aria-hidden="true" />
        </div>
        <p className="text-4xl mt-4">🚫</p>
        <h1 className="page-title mt-4">Access Denied</h1>
        <p className="text-gray-600">You don't have permission to access the Admin Panel.</p>
        {profile && (
          <p className="mt-2 text-xs text-gray-500">
            Signed in as <strong>{profile.full_name}</strong> ({profile.role})
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button onClick={() => nav(-1)} className="btn-outline">
            Go Back
          </button>
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
        </div>
        {!profile && (
          <p className="mt-6 text-sm text-gray-500">
            Want to sign in?{' '}
            <Link to="/login" className="text-saffron font-medium">
              Go to Login
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}