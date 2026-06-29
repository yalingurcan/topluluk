import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AutocompleteInput, { CITIES, OCCUPATIONS } from '../components/AutocompleteInput'

export default function Register() {
  const { signUp } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', fullName: '', username: '', city: '', occupation: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('Şifre en az 6 karakter olmalıdır.'); return }
    if (!form.city.trim()) { setError('Lütfen yaşadığınız şehri belirtin.'); return }
    if (!form.occupation.trim()) { setError('Lütfen mesleğinizi belirtin.'); return }
    setLoading(true)
    const { error } = await signUp(form.email, form.password, form.fullName, form.username, form.city.trim(), form.occupation.trim())
    if (error) setError(error.message)
    else setDone(true)
    setLoading(false)
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--r-bg)] px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--r-text)] mb-2">Başvurunuz Alındı</h2>
        <p className="text-[var(--r-meta)] text-sm">Başvurunuz inceleniyor. Onaylandıktan sonra giriş yapabilirsiniz.</p>
        <Link to="/giris" className="mt-6 inline-block text-primary-600 font-medium text-sm hover:underline">Giriş sayfasına dön</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--r-bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--r-text)]">Kayıt Ol</h1>
          <p className="text-[var(--r-meta)] mt-1">Topluluğa katılmak için başvurun</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--r-card)] rounded-2xl shadow-sm border border-[var(--r-border)] p-6 space-y-4">
          {error && <div className="bg-red-500/10 text-red-500 text-sm px-4 py-3 rounded-lg">{error}</div>}
          {[
            { key: 'fullName', label: 'Ad Soyad', type: 'text', placeholder: 'Adınız Soyadınız' },
            { key: 'username', label: 'Kullanıcı Adı', type: 'text', placeholder: 'kullanici_adi' },
            { key: 'city', label: 'Yaşadığınız Şehir', type: 'text', placeholder: 'Örn: Berlin', isAutocomplete: true, suggestions: CITIES },
            { key: 'occupation', label: 'Mesleğiniz', type: 'text', placeholder: 'Örn: Yazılım Mühendisi', isAutocomplete: true, suggestions: OCCUPATIONS },
            { key: 'email', label: 'E-posta', type: 'email', placeholder: 'ornek@email.com' },
            { key: 'password', label: 'Şifre', type: 'password', placeholder: '••••••••' },
          ].map(({ key, label, type, placeholder, isAutocomplete, suggestions }) => (
            <div key={key}>
              {isAutocomplete ? (
                <AutocompleteInput
                  value={form[key]}
                  onChange={val => setForm(f => ({ ...f, [key]: val }))}
                  suggestions={suggestions}
                  placeholder={placeholder}
                  label={label}
                  required
                />
              ) : (
                <>
                  <label className="block text-sm font-medium text-[var(--r-text)] mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={set(key)}
                    required
                    className="w-full px-4 py-2.5 border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={placeholder}
                  />
                </>
              )}
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

        <p className="text-center text-sm text-[var(--r-meta)] mt-6">
          Zaten üye misiniz?{' '}
          <Link to="/giris" className="text-primary-600 font-medium hover:underline">Giriş yapın</Link>
        </p>
      </div>
    </div>
  )
}
