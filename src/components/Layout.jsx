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
      <main className="flex-1 pb-20 md:pb-0 md:pt-16">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>
      {profile && profile.status === 'approved' && <FloatingChat />}
      <BottomNav />
    </div>
  )
}
