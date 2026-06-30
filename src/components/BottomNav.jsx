import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const HomeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const EventIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const CityIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const TopicsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)
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

const mainNavItems = [
  { to: '/', label: 'Ana Sayfa', Icon: HomeIcon, exact: true },
  { to: '/sehirler', label: 'Şehirler', Icon: CityIcon },
  { to: '/etkinlikler', label: 'Etkinlikler', Icon: EventIcon },
  { to: '/konular', label: 'Konular', Icon: TopicsIcon },
]

const menuLinks = [
  {
    to: '/uyeler',
    label: 'Üyeler',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: '/profil',
    label: 'Profil',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    to: '/arkadaslar',
    label: 'Arkadaşlar',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: '/yardim',
    label: 'Yardım & SSS',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const handleNavigate = (to) => {
    closeMenu()
    navigate(to)
  }

  const handleSignOut = () => {
    closeMenu()
    signOut()
  }

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--r-nav)] border-t border-[var(--r-border)] safe-bottom z-50">
        <div className="flex">
          {mainNavItems.map(({ to, label, Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                  isActive ? 'text-primary-500' : 'text-[var(--r-meta)] hover:text-[var(--r-text)]'
                }`
              }
            >
              <Icon />
              <span className="mt-0.5">{label}</span>
            </NavLink>
          ))}

          {/* Menu button */}
          <button
            onClick={() => setMenuOpen(true)}
            className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
              menuOpen ? 'text-primary-500' : 'text-[var(--r-meta)]'
            }`}
          >
            <MenuIcon />
            <span className="mt-0.5">Menü</span>
          </button>
        </div>
      </nav>

      {/* Side panel overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/40"
            onClick={closeMenu}
          />

          {/* Drawer */}
          <div className="w-72 bg-[var(--r-card)] h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-[var(--r-border)]">
              <div>
                <p className="font-bold text-[var(--r-text)] text-base leading-tight">{profile?.full_name}</p>
                <p className="text-xs text-[var(--r-meta)] mt-0.5">@{profile?.username}</p>
              </div>
              <button
                onClick={closeMenu}
                className="p-2 rounded-xl text-[var(--r-meta)] hover:bg-[var(--r-hover)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {menuLinks.map(({ to, label, icon }) => (
                <button
                  key={to}
                  onClick={() => handleNavigate(to)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[var(--r-text)] hover:bg-[var(--r-hover)] transition-colors text-left"
                >
                  <span className="text-[var(--r-meta)]">{icon}</span>
                  {label}
                </button>
              ))}

              {profile?.is_admin && (
                <button
                  onClick={() => handleNavigate('/admin')}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[var(--r-text)] hover:bg-[var(--r-hover)] transition-colors text-left"
                >
                  <span className="text-[var(--r-meta)]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  Yönetim
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-3 pb-8 pt-3 border-t border-[var(--r-border)] space-y-1">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[var(--r-text)] hover:bg-[var(--r-hover)] transition-colors text-left"
              >
                <span className="text-[var(--r-meta)]">
                  {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </span>
                {theme === 'dark' ? 'Açık mod' : 'Koyu mod'}
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/5 transition-colors text-left"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
