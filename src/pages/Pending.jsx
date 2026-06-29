import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Pending() {
  const { session, loading, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !session) {
      navigate('/giris', { replace: true })
    }
  }, [session, loading, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--r-bg)] px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[var(--r-text)] mb-3">Başvurunuz İnceleniyor</h2>
        <p className="text-[var(--r-meta)] leading-relaxed">
          Üyelik başvurunuz alındı. Yönetici onayından sonra topluluğa erişebileceksiniz.
        </p>
        <div className="mt-4 bg-primary-500/10 border border-primary-500/20 rounded-2xl p-4 text-left space-y-1.5">
          <p className="text-sm text-primary-600">📌 Sekmeyi kapatabilirsiniz.</p>
          <p className="text-sm text-primary-600">📧 Üyeliğiniz onaylanınca e-posta ile bildirim gelecek.</p>
          <p className="text-sm text-primary-600">🔑 Bildirim sonrası tekrar giriş yapabilirsiniz.</p>
        </div>
        <button
          onClick={signOut}
          className="mt-8 text-sm text-[var(--r-meta)] hover:text-[var(--r-text)] underline"
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  )
}
