import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const { profile, signOut, refreshProfile } = useAuth()
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ full_name: profile?.full_name || '', username: profile?.username || '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('profiles').update({ full_name: form.full_name, username: form.username }).eq('id', profile.id)
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setEditMode(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Profil</h1>

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
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Ad Soyad</label>
              <input
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Kullanıcı Adı</label>
              <input
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button type="button" onClick={() => setEditMode(false)} className="px-4 py-2.5 border rounded-xl text-sm text-gray-600">İptal</button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50"
          >
            Profili Düzenle
          </button>
        )}
      </div>

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
        className="mt-3 w-full bg-white border border-gray-200 text-red-500 py-3 rounded-2xl text-sm font-medium hover:bg-red-50"
      >
        Çıkış Yap
      </button>
    </div>
  )
}
