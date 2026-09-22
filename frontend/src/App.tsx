import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { isAdminRole } from '@/types'
import Layout from '@/components/Layout'
import AdminLayout from '@/components/AdminLayout'
import AuthLoadingScreen from '@/components/AuthLoadingScreen'
import InstallGate from '@/pages/InstallGate'
import Home from '@/pages/Home'
import Aarti from '@/pages/Aarti'
import AartiDetail from '@/pages/AartiDetail'
import AartiBook from '@/pages/AartiBook'
import Programs from '@/pages/Programs'
import Gallery from '@/pages/Gallery'
import Videos from '@/pages/Videos'
import Meetings from '@/pages/Meetings'
import Festival2026 from '@/pages/Festival2026'
import Donation from '@/pages/Donation'
import Contact from '@/pages/Contact'
import Members from '@/pages/Members'
import MemberChat from '@/pages/MemberChat'
import CalendarPage from '@/pages/CalendarPage'
import Login from '@/pages/Login'
import MemberRegister from '@/pages/MemberRegister'
import MemberForgotPassword from '@/pages/MemberForgotPassword'
import MemberResetPassword from '@/pages/MemberResetPassword'
import Dashboard from '@/pages/Dashboard'
import Profile from '@/pages/Profile'
import Notifications from '@/pages/Notifications'
import AdminLogin from '@/pages/admin/AdminLogin'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminMembers from '@/pages/admin/AdminMembers'
import AdminAartis from '@/pages/admin/AdminAartis'
import AdminPrograms from '@/pages/admin/AdminPrograms'
import AdminAnnouncements from '@/pages/admin/AdminAnnouncements'
import AdminGallery from '@/pages/admin/AdminGallery'
import AdminVideos from '@/pages/admin/AdminVideos'
import AdminMeetings from '@/pages/admin/AdminMeetings'
import AdminFestival from '@/pages/admin/AdminFestival'
import Upload2026 from '@/pages/admin/Upload2026'
import AdminNotifications from '@/pages/admin/AdminNotifications'
import AdminChat from '@/pages/admin/AdminChat'
import AdminCalendar from '@/pages/admin/AdminCalendar'
import AdminSettings from '@/pages/admin/AdminSettings'
import AdminHomePage from '@/pages/admin/AdminHomePage'
import AdminMediaLibrary from '@/pages/admin/AdminMediaLibrary'
import NotFound from '@/pages/NotFound'
import Unauthorized from '@/pages/Unauthorized'

/**
 * Guards private routes. The website content is never rendered until the
 * Supabase session/profile has been restored (loading gate first), so there is
 * NO flash of public content before authentication.
 */
function ProtectedRoute({
  children,
  adminOnly = false,
  memberOnly = false,
  redirectTo,
}: {
  children: React.ReactNode
  adminOnly?: boolean
  memberOnly?: boolean
  redirectTo?: string
}) {
  const { profile, loading } = useAuth()
  const { error: toastError } = useToast()

  const adminDenied = Boolean(profile && adminOnly && !isAdminRole(profile.role))

  useEffect(() => {
    if (adminDenied) toastError('✕ Access denied. Admin account required.')
  }, [adminDenied, toastError])

  if (loading) return <AuthLoadingScreen />

  if (!profile) {
    return <Navigate to={redirectTo ?? (adminOnly ? '/admin/login' : '/login')} replace />
  }

  if (adminDenied) {
    // Member trying to reach /admin/* -> back to the member website with a toast.
    return <Navigate to="/home" replace />
  }

  if (memberOnly && profile.role !== 'member') {
    return <Navigate to={isAdminRole(profile.role) ? '/admin/dashboard' : '/login'} replace />
  }

  return <>{children}</>
}

/** Redirects already-authenticated users away from the public login pages. */
function AlreadyAuthRedirect({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()

  if (loading) return <AuthLoadingScreen />

  if (profile) {
    return <Navigate to={isAdminRole(profile.role) ? '/admin/dashboard' : '/member/dashboard'} replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* ============ PUBLIC INSTALL / AUTH (never show website content) ============ */}
      <Route path="/" element={<InstallGate />} />
      <Route path="/install" element={<InstallGate />} />
      <Route
        path="/login"
        element={
          <AlreadyAuthRedirect>
            <Login />
          </AlreadyAuthRedirect>
        }
      />
      <Route path="/member/login" element={<Navigate to="/login" replace />} />
      <Route
        path="/member/register"
        element={
          <AlreadyAuthRedirect>
            <MemberRegister />
          </AlreadyAuthRedirect>
        }
      />
      <Route path="/member/forgot-password" element={<MemberForgotPassword />} />
      <Route path="/member/reset-password" element={<MemberResetPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Legacy register/login redirects */}
      <Route path="/register" element={<Navigate to="/member/register" replace />} />
      <Route path="/reset-password" element={<Navigate to="/member/reset-password" replace />} />

      {/* ============ MEMBER WEBSITE (requires authentication) ============ */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="home" element={<Home />} />
        <Route path="aarti" element={<Aarti />} />
        <Route path="aarti/book" element={<AartiBook />} />
        <Route path="aarti/:id" element={<AartiDetail />} />
        <Route path="programs" element={<Programs />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="videos" element={<Videos />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="festival/2026" element={<Festival2026 />} />
        <Route path="donation" element={<Donation />} />
        <Route path="contact" element={<Contact />} />
        <Route path="members" element={<Members />} />
        <Route path="calendar" element={<CalendarPage />} />

        <Route path="member/dashboard" element={<Dashboard />} />
        <Route path="member/profile" element={<Profile />} />
        <Route path="member/notifications" element={<Notifications />} />
        <Route path="member/chat" element={<MemberChat />} />
      </Route>

      {/* Legacy member URLs -> new /member/* URLs */}
      <Route path="/dashboard" element={<Navigate to="/member/dashboard" replace />} />
      <Route path="/profile" element={<Navigate to="/member/profile" replace />} />
      <Route path="/notifications" element={<Navigate to="/member/notifications" replace />} />

      {/* ============ ADMIN ROUTES (admin/super_admin only) ============ */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route
        element={
          <ProtectedRoute adminOnly redirectTo="/admin/login">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="admin/dashboard" element={<AdminDashboard />} />
        <Route path="admin/home" element={<AdminHomePage />} />
        <Route path="admin/members" element={<AdminMembers />} />
        <Route path="admin/aartis" element={<AdminAartis />} />
        <Route path="admin/aarti" element={<AdminAartis />} />
        <Route path="admin/programs" element={<AdminPrograms />} />
        <Route path="admin/meetings" element={<AdminMeetings />} />
        <Route path="admin/festival" element={<AdminFestival />} />
        <Route path="admin/upload-2026" element={<Upload2026 />} />
        <Route path="admin/announcements" element={<AdminAnnouncements />} />
        <Route path="admin/gallery" element={<AdminGallery />} />
        <Route path="admin/videos" element={<AdminVideos />} />
        <Route path="admin/notifications" element={<AdminNotifications />} />
        <Route path="admin/chat" element={<AdminChat />} />
        <Route path="admin/calendar" element={<AdminCalendar />} />
        <Route path="admin/settings" element={<AdminSettings />} />
        <Route path="admin/website" element={<AdminSettings />} />
        <Route path="admin/media" element={<AdminMediaLibrary />} />
      </Route>

      {/* ============ ERROR PAGES ============ */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App