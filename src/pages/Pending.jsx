import { useAuth } from '../contexts/AuthContext'

export default function Pending() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Başvurunuz İnceleniyor</h2>
        <p className="text-gray-500 leading-relaxed">
          Üyelik başvurunuz alındı. Yönetici onayından sonra topluluğa erişebileceksiniz. Bu işlem kısa sürede tamamlanacaktır.
        </p>
        <button
          onClick={signOut}
          className="mt-8 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  )
}
