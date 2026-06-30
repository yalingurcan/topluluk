import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Pending from './pages/Pending'
import Feed from './pages/Feed'
import Channels from './pages/Channels'
import ChannelDetail from './pages/ChannelDetail'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import PostDetail from './pages/PostDetail'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Members from './pages/Members'
import Friends from './pages/Friends'
import Messages from './pages/Messages'
import Cities from './pages/Cities'
import CityDetail from './pages/CityDetail'
import Help from './pages/Help'

function ProtectedRoute({ children, adminOnly = false }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!session) return <Navigate to="/giris" state={{ from: location }} replace />
  if (profile?.status === 'pending') return <Navigate to="/beklemede" replace />
  if (profile?.status === 'rejected') return <Navigate to="/giris" replace />
  if (adminOnly && !profile?.is_admin) return <Navigate to="/" replace />

  return children
}

function PublicRoute({ children }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (session && profile?.status === 'pending') return <Navigate to="/beklemede" replace />
  if (session && profile?.status === 'approved') {
    const from = location.state?.from?.pathname || "/"
    return <Navigate to={from} replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/giris" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/kayit" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/beklemede" element={<Pending />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Feed />} />
        <Route path="/konular" element={<Channels />} />
        <Route path="/konular/:id" element={<ChannelDetail />} />
        <Route path="/etkinlikler" element={<Events />} />
        <Route path="/etkinlikler/:id" element={<EventDetail />} />
        <Route path="/gonderiler/:id" element={<PostDetail />} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/uyeler" element={<Members />} />
        <Route path="/arkadaslar" element={<Friends />} />
        <Route path="/mesajlar" element={<Messages />} />
        <Route path="/sehirler" element={<Cities />} />
        <Route path="/sehirler/:sehirAdi" element={<CityDetail />} />
        <Route path="/yardim" element={<Help />} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
