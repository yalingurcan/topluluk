import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import BottomNav from './BottomNav'
import TopNav from './TopNav'
import FloatingChat from './FloatingChat'
import PWAInstallPrompt from './PWAInstallPrompt'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Layout() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!profile) return
    const key = `profile_welcomed_${profile.id}`
    const isProfilePage = location.pathname === '/profil'
    if (!isProfilePage && !profile.city && !profile.occupation && !localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      navigate('/profil', { state: { welcome: true } })
    }
  }, [profile])

  // Sıfırla: mesajlar sayfasına girilince
  useEffect(() => {
    if (location.pathname === '/mesajlar') setUnreadCount(0)
  }, [location.pathname])

  // Realtime: yeni mesaj gelince badge artır
  useEffect(() => {
    if (!profile?.id) return
    const channel = supabase
      .channel('layout-dm-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `receiver_id=eq.${profile.id}`
      }, () => {
        if (location.pathname !== '/mesajlar') {
          setUnreadCount(n => n + 1)
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [profile?.id])

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      {/* Mobil header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-12 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
        <span className="text-lg font-bold text-primary-600">Alamancı</span>
        <button onClick={() => navigate('/mesajlar')} className="relative p-1.5 text-gray-500 hover:text-primary-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </header>
      <main className="flex-1 pb-20 md:pb-0 md:pt-16 pt-12">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>
      {profile && profile.status === 'approved' && <FloatingChat />}
      <BottomNav />
      <PWAInstallPrompt />
    </div>
  )
}
