import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import AutocompleteInput, { CITIES, OCCUPATIONS } from '../components/AutocompleteInput'

const PREDEFINED_HOBBIES = [
  'Futbol', 'Basketbol', 'Tenis', 'Koşu', 'Bisiklet', 'Yüzme', 
  'Kitap Okumak', 'Sinema', 'Fotoğrafçılık', 'Yemek Yapmak', 
  'Müzik', 'Seyahat', 'Satranç', 'Oyun oynamak', 'Kamp'
]

const PREDEFINED_INTERESTS = [
  'Teknoloji', 'Yazılım', 'Tasarım', 'Finans', 'Girişimcilik', 
  'Edebiyat', 'Bilim', 'Tarih', 'Felsefe', 'Doğa', 'Otomobil', 
  'Yabancı Dil', 'Sağlıklı Yaşam', 'Sanat'
]

export default function Profile() {
  const { profile, signOut, refreshProfile } = useAuth()
  const location = useLocation()
  const [showWelcome, setShowWelcome] = useState(false)
  const isWelcome = location.state?.welcome === true
  const [editMode, setEditMode] = useState(isWelcome && (!profile || !profile.is_admin))

  useEffect(() => {
    if (isWelcome && profile && !profile.is_admin) {
      const key = `profile_welcome_banner_closed_${profile.id}`
      if (!localStorage.getItem(key)) {
        setShowWelcome(true)
      }
    }
  }, [isWelcome, profile])
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    city: '',
    occupation: '',
    hobbies: '',
    interests: '',
    age: '',
    gender: '',
    marital_status: '',
    children_count: ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Custom tag inputs
  const [customHobbyInput, setCustomHobbyInput] = useState('')
  const [customInterestInput, setCustomInterestInput] = useState('')

  const selectedHobbies = form.hobbies 
    ? form.hobbies.split(',').map(s => s.trim()).filter(Boolean) 
    : []

  const selectedInterests = form.interests 
    ? form.interests.split(',').map(s => s.trim()).filter(Boolean) 
    : []

  const toggleHobby = (hobby) => {
    let newHobbies
    if (selectedHobbies.includes(hobby)) {
      newHobbies = selectedHobbies.filter(h => h !== hobby)
    } else {
      newHobbies = [...selectedHobbies, hobby]
    }
    setForm(f => ({ ...f, hobbies: newHobbies.join(', ') }))
  }

  const toggleInterest = (interest) => {
    let newInterests
    if (selectedInterests.includes(interest)) {
      newInterests = selectedInterests.filter(i => i !== interest)
    } else {
      newInterests = [...selectedInterests, interest]
    }
    setForm(f => ({ ...f, interests: newInterests.join(', ') }))
  }

  const addCustomHobby = () => {
    const trimmed = customHobbyInput.trim()
    if (trimmed && !selectedHobbies.includes(trimmed)) {
      const newHobbies = [...selectedHobbies, trimmed]
      setForm(f => ({ ...f, hobbies: newHobbies.join(', ') }))
    }
    setCustomHobbyInput('')
  }

  const addCustomInterest = () => {
    const trimmed = customInterestInput.trim()
    if (trimmed && !selectedInterests.includes(trimmed)) {
      const newInterests = [...selectedInterests, trimmed]
      setForm(f => ({ ...f, interests: newInterests.join(', ') }))
    }
    setCustomInterestInput('')
  }

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        username: profile.username || '',
        city: profile.city || '',
        occupation: profile.occupation || '',
        hobbies: profile.hobbies || '',
        interests: profile.interests || '',
        age: profile.age || '',
        gender: profile.gender || '',
        marital_status: profile.marital_status || '',
        children_count: profile.children_count !== undefined && profile.children_count !== null ? String(profile.children_count) : ''
      })
    }
  }, [profile, editMode])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const updates = {
      full_name: form.full_name,
      username: form.username,
      city: form.city,
      occupation: form.occupation,
      hobbies: form.hobbies,
      interests: form.interests,
      age: form.age ? parseInt(form.age) : null,
      gender: form.gender,
      marital_status: form.marital_status,
      children_count: form.children_count ? parseInt(form.children_count) : 0
    }
    await supabase.from('profiles').update(updates).eq('id', profile.id)
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setEditMode(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="pb-8">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Profil</h1>

      {showWelcome && (
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 mb-4 relative">
          <button
            onClick={() => {
              setShowWelcome(false)
              if (profile) {
                localStorage.setItem(`profile_welcome_banner_closed_${profile.id}`, 'true')
              }
            }}
            className="absolute top-3 right-3 text-primary-400 hover:text-primary-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <p className="text-sm font-semibold text-primary-800">🎉 Üyeliğiniz onaylandı, hoş geldiniz!</p>
          <p className="text-xs text-primary-600 mt-1">Diğer üyeler sizi daha iyi tanısın diye profilinizi doldurun — şehir, meslek, ilgi alanlarınızı ekleyin.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-primary-700">{profile?.full_name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{profile?.full_name}</h2>
            <p className="text-sm text-gray-500">@{profile?.username}</p>
            {profile?.is_admin && (
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">Yönetici</span>
            )}
          </div>
        </div>

        {saved && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg mb-4">Profil güncellendi!</div>
        )}

        {editMode ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Ad Soyad</label>
                <input
                  required
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Kullanıcı Adı</label>
                <input
                  required
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <AutocompleteInput
                value={form.city}
                onChange={val => setForm(f => ({ ...f, city: val }))}
                suggestions={CITIES}
                placeholder="Örn: Berlin"
                label="Yaşadığınız Şehir"
                required
              />
              <AutocompleteInput
                value={form.occupation}
                onChange={val => setForm(f => ({ ...f, occupation: val }))}
                suggestions={OCCUPATIONS}
                placeholder="Örn: Yazılım Mühendisi"
                label="Mesleğiniz"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Yaş</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Örn: 28"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Cinsiyet</label>
                <select
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Belirtilmemiş</option>
                  <option value="Erkek">Erkek</option>
                  <option value="Kadın">Kadın</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Medeni Durum</label>
                <select
                  value={form.marital_status}
                  onChange={e => setForm(f => ({ ...f, marital_status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Belirtilmemiş</option>
                  <option value="Evli">Evli</option>
                  <option value="Bekar">Bekar</option>
                  <option value="İlişkisi Var">İlişkisi Var</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Çocuk Sayısı</label>
                <input
                  type="number"
                  min="0"
                  value={form.children_count}
                  onChange={e => setForm(f => ({ ...f, children_count: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Örn: 0 veya boş bırakın"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 block">Hobiler</label>
              
              {/* Selected Hobbies */}
              <div className="flex flex-wrap gap-1.5 py-1">
                {selectedHobbies.map(hobby => (
                  <span key={hobby} className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 border border-primary-100 px-2.5 py-1 rounded-full text-xs font-medium">
                    {hobby}
                    <button 
                      type="button" 
                      onClick={() => toggleHobby(hobby)} 
                      className="hover:text-primary-900 focus:outline-none ml-0.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                {selectedHobbies.length === 0 && (
                  <span className="text-xs text-gray-400 italic">Henüz hobi seçilmedi.</span>
                )}
              </div>

              {/* Custom Hobby Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Yeni hobi yaz..."
                  value={customHobbyInput}
                  onChange={e => setCustomHobbyInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomHobby();
                    }
                  }}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={addCustomHobby}
                  className="bg-primary-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-primary-700 transition-colors"
                >
                  Ekle
                </button>
              </div>

              {/* Suggestions */}
              <div className="mt-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Önerilen Hobiler</span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-gray-50/50 rounded-xl border border-gray-100">
                  {PREDEFINED_HOBBIES.filter(h => !selectedHobbies.includes(h)).map(hobby => (
                    <button
                      key={hobby}
                      type="button"
                      onClick={() => toggleHobby(hobby)}
                      className="text-[11px] bg-white hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full transition-colors font-medium"
                    >
                      + {hobby}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 block">İlgi Alanları</label>
              
              {/* Selected Interests */}
              <div className="flex flex-wrap gap-1.5 py-1">
                {selectedInterests.map(interest => (
                  <span key={interest} className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 border border-primary-100 px-2.5 py-1 rounded-full text-xs font-medium">
                    {interest}
                    <button 
                      type="button" 
                      onClick={() => toggleInterest(interest)} 
                      className="hover:text-primary-900 focus:outline-none ml-0.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                {selectedInterests.length === 0 && (
                  <span className="text-xs text-gray-400 italic">Henüz ilgi alanı seçilmedi.</span>
                )}
              </div>

              {/* Custom Interest Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Yeni ilgi alanı yaz..."
                  value={customInterestInput}
                  onChange={e => setCustomInterestInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomInterest();
                    }
                  }}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={addCustomInterest}
                  className="bg-primary-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-primary-700 transition-colors"
                >
                  Ekle
                </button>
              </div>

              {/* Suggestions */}
              <div className="mt-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Önerilen İlgi Alanları</span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-gray-50/50 rounded-xl border border-gray-100">
                  {PREDEFINED_INTERESTS.filter(i => !selectedInterests.includes(i)).map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className="text-[11px] bg-white hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full transition-colors font-medium"
                    >
                      + {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button type="button" onClick={() => setEditMode(false)} className="px-4 py-2.5 border rounded-xl text-sm text-gray-600">İptal</button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="border-t border-gray-100 pt-4 space-y-3.5 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                <span className="text-gray-400 font-medium">📍 Yaşadığı Şehir</span>
                <span className="text-gray-900 font-semibold">{profile?.city || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                <span className="text-gray-400 font-medium">💼 Meslek</span>
                <span className="text-gray-900 font-semibold">{profile?.occupation || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                <span className="text-gray-400 font-medium">🎂 Yaş</span>
                <span className="text-gray-900 font-semibold">{profile?.age || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                <span className="text-gray-400 font-medium">⚧ Cinsiyet</span>
                <span className="text-gray-900 font-semibold">{profile?.gender || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                <span className="text-gray-400 font-medium">💍 Medeni Durum</span>
                <span className="text-gray-900 font-semibold">{profile?.marital_status || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                <span className="text-gray-400 font-medium">👶 Çocuk Sayısı</span>
                <span className="text-gray-900 font-semibold">
                  {profile?.children_count !== undefined && profile?.children_count !== null
                    ? (profile.children_count === 0 ? 'Yok' : `${profile.children_count} Çocuk`)
                    : '-'}
                </span>
              </div>
              <div className="border-b border-gray-50 pb-3.5">
                <span className="text-gray-400 font-medium block mb-2">🎨 Hobiler</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile?.hobbies ? (
                    profile.hobbies.split(',').map(s => s.trim()).filter(Boolean).map((hobby, i) => (
                      <span key={i} className="bg-primary-50 text-primary-700 border border-primary-100/60 px-2.5 py-1 rounded-full text-xs font-medium">
                        {hobby}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-xs italic">Hobi eklenmemiş.</span>
                  )}
                </div>
              </div>
              <div className="border-b border-gray-50 pb-3.5 last:border-b-0">
                <span className="text-gray-400 font-medium block mb-2">🎯 İlgi Alanları</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile?.interests ? (
                    profile.interests.split(',').map(s => s.trim()).filter(Boolean).map((interest, i) => (
                      <span key={i} className="bg-primary-50 text-primary-700 border border-primary-100/60 px-2.5 py-1 rounded-full text-xs font-medium">
                        {interest}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-xs italic">İlgi alanı eklenmemiş.</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setEditMode(true)}
              className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Profili Düzenle
            </button>
          </div>
        )}
      </div>

      <Link
        to="/arkadaslar"
        className="mt-3 flex items-center justify-between bg-primary-50 rounded-2xl border border-primary-100 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-primary-700">Arkadaşlarım</span>
        </div>
        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      <Link
        to="/mesajlar"
        className="mt-3 flex items-center justify-between bg-primary-50 rounded-2xl border border-primary-100 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-primary-700">Mesajlarım</span>
        </div>
        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {profile?.is_admin && (
        <Link
          to="/admin"
          className="mt-3 flex items-center justify-between bg-primary-50 rounded-2xl border border-primary-100 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-primary-700">Yönetim Paneli</span>
          </div>
          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}

      <button
        onClick={signOut}
        className="mt-3 w-full bg-white border border-gray-200 text-red-500 py-3 rounded-2xl text-sm font-medium hover:bg-red-50 transition-colors"
      >
        Çıkış Yap
      </button>
    </div>
  )
}
