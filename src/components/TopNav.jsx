import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function TopNav() {
  const { profile, signOut } = useAuth()

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 items-center px-6">
      <Link to="/" className="text-xl font-bold text-primary-600 mr-8">Alamancı</Link>
      <nav className="flex gap-6 flex-1">
        {[
          { to: '/', label: 'Ana Sayfa', exact: true },
          { to: '/etkinlikler', label: 'Etkinlikler' },
          { to: '/konular', label: 'Konular' },
          { to: '/uyeler', label: 'Üyeler' },
        ].map(({ to, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`
            }
          >
            {label}
          </NavLink>
        ))}
        {profile?.is_admin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`
            }
          >
            Yönetim
          </NavLink>
        )}
      </nav>
      <div className="flex items-center gap-3">
        <Link 
          to="/profil" 
          className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 hover:bg-primary-100/80 border border-primary-100 rounded-xl text-sm text-primary-700 font-medium transition-colors"
        >
          <span>{profile?.full_name}</span>
          <svg className="w-4 h-4 text-primary-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
          </svg>
        </Link>
        <button 
          onClick={signOut} 
          className="px-3 py-1.5 bg-red-50 hover:bg-red-100/80 text-red-600 hover:text-red-700 text-sm font-medium rounded-xl transition-colors"
        >
          Çıkış
        </button>
      </div>
    </header>
  )
}
