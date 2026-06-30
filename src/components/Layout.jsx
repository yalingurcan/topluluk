import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import BottomNav from './BottomNav'
import TopNav from './TopNav'
import FloatingChat from './FloatingChat'
import PWAInstallPrompt from './PWAInstallPrompt'
import UserProfileModal from './UserProfileModal'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'

const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07-.71.71M5.64 18.36l-.71.71m12.02 0-.71-.71M5.64 5.64l-.71-.71M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
)
const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
  </svg>
)

export default function Layout() {
  const { profile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!profile) return
    const key = `profile_welcomed_${profile.id}`
    const isProfilePage = location.pathname === '/profil'
    if (!isProfilePage && !localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      navigate('/profil', { state: { welcome: true } })
    }
  }, [profile])

  useEffect(() => {
    if (location.pathname === '/mesajlar') setUnreadCount(0)
  }, [location.pathname])

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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--r-bg)' }}>
      <TopNav />
      {/* Mobil header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-12 bg-[var(--r-nav)] border-b border-[var(--r-border)] z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-1.5">
          <img src="/favicon.svg" alt="Alamancı" className="w-7 h-7" />
          <span className="text-lg font-bold text-primary-500 tracking-tight">Alamancı</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Dark/Light toggle - mobil */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-[var(--r-meta)] hover:text-[var(--r-text)] hover:bg-[var(--r-hover)] rounded-full transition-colors"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          {/* Mesajlar */}
          <button
            onClick={() => navigate('/mesajlar')}
            className="relative p-1.5 text-[var(--r-meta)] hover:text-[var(--r-text)] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>
      <main className="flex-1 pb-20 md:pb-0 md:pt-14 pt-12">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>
      {profile && profile.status === 'approved' && <FloatingChat />}
      <BottomNav />
      <PWAInstallPrompt />
      <UserProfileModal />
    </div>
  )
}
