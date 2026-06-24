import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import TopNav from './TopNav'
import FloatingChat from './FloatingChat'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const { profile } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      {/* Mobil header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-12 bg-white border-b border-gray-200 z-50 flex items-center px-4">
        <span className="text-lg font-bold text-primary-600">Alamancı</span>
      </header>
      <main className="flex-1 pb-20 md:pb-0 md:pt-16 pt-12">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>
      {profile && profile.status === 'approved' && <FloatingChat />}
      <BottomNav />
    </div>
  )
}
