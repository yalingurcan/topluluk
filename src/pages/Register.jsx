import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const { signUp } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', fullName: '', username: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('Şifre en az 6 karakter olmalıdır.'); return }
    setLoading(true)
    const { error } = await signUp(form.email, form.password, form.fullName, form.username)
    if (error) setError(error.message)
    else setDone(true)
    setLoading(false)
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Başvurunuz Alındı</h2>
        <p className="text-gray-500 text-sm">Başvurunuz inceleniyor. Onaylandıktan sonra giriş yapabilirsiniz.</p>
        <Link to="/giris" className="mt-6 inline-block text-primary-600 font-medium text-sm hover:underline">Giriş sayfasına dön</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Kayıt Ol</h1>
          <p className="text-gray-500 mt-1">Topluluğa katılmak için başvurun</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
          {[
            { key: 'fullName', label: 'Ad Soyad', type: 'text', placeholder: 'Adınız Soyadınız' },
            { key: 'username', label: 'Kullanıcı Adı', type: 'text', placeholder: 'kullanici_adi' },
            { key: 'email', label: 'E-posta', type: 'email', placeholder: 'ornek@email.com' },
            { key: 'password', label: 'Şifre', type: 'password', placeholder: '••••••••' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={set(key)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={placeholder}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-primary-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Başvuruluyor...' : 'Başvur'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Zaten üye misiniz?{' '}
          <Link to="/giris" className="text-primary-600 font-medium hover:underline">Giriş yapın</Link>
        </p>
      </div>
    </div>
  )
}
