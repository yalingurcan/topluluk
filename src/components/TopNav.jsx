import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function TopNav() {
  const { profile, signOut } = useAuth()

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 items-center px-6">
      <Link to="/" className="text-xl font-bold text-primary-600 mr-8">Topluluk</Link>
      <nav className="flex gap-6 flex-1">
        {[
          { to: '/', label: 'Ana Sayfa', exact: true },
          { to: '/etkinlikler', label: 'Etkinlikler' },
          { to: '/gruplar', label: 'Gruplar' },
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
      <div className="flex items-center gap-4">
        <Link to="/profil" className="text-sm text-gray-700 font-medium">{profile?.full_name}</Link>
        <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-700">Çıkış</button>
      </div>
    </header>
  )
}
