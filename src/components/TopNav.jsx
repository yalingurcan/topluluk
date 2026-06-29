import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

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

export default function TopNav() {
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 h-14 bg-[var(--r-nav)] border-b border-[var(--r-border)] z-50 items-center px-6 gap-4">
      <Link to="/" className="flex items-center gap-2 mr-6 shrink-0">
        <img src="/favicon.svg" alt="Alamancı" className="w-8 h-8" />
        <span className="text-xl font-bold text-primary-500 tracking-tight">Alamancı</span>
      </Link>
      <nav className="flex gap-5 flex-1">
        {[
          { to: '/', label: 'Ana Sayfa', exact: true },
          { to: '/sehirler', label: 'Şehirler' },
          { to: '/etkinlikler', label: 'Etkinlikler' },
          { to: '/konular', label: 'Konular' },
          { to: '/uyeler', label: 'Üyeler' },
        ].map(({ to, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `text-sm font-medium transition-colors pb-0.5 ${
                isActive
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-[var(--r-meta)] hover:text-[var(--r-text)]'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
        {profile?.is_admin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors pb-0.5 ${
                isActive
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-[var(--r-meta)] hover:text-[var(--r-text)]'
              }`
            }
          >
            Yönetim
          </NavLink>
        )}
      </nav>
      <div className="flex items-center gap-2">
        {/* Dark/Light toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Açık moda geç' : 'Koyu moda geç'}
          className="p-2 rounded-full text-[var(--r-meta)] hover:text-[var(--r-text)] hover:bg-[var(--r-hover)] transition-colors"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <Link
          to="/profil"
          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--r-hover)] hover:bg-[var(--r-border)] border border-[var(--r-border)] rounded-full text-sm text-[var(--r-text)] font-medium transition-colors"
        >
          <span>{profile?.full_name}</span>
        </Link>
        <button
          onClick={signOut}
          className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-full transition-colors"
        >
          Çıkış
        </button>
      </div>
    </header>
  )
}
