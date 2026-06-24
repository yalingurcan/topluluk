import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Channels() {
  const { profile } = useAuth()
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [form, setForm] = useState({ name: '', description: '', city: '', parent_id: '' })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data: ch } = await supabase
      .from('channels')
      .select('*, profiles!created_by(full_name)')
      .order('created_at', { ascending: false })
    setChannels(ch || [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name.trim()) return

    const insertData = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      city: form.city.trim() || null,
      parent_id: form.parent_id || null,
      created_by: profile.id
    }

    const { data } = await supabase
      .from('channels')
      .insert(insertData)
      .select('*, profiles!created_by(full_name)')
      .single()

    if (data) {
      setChannels(c => [data, ...c])
    }
    setForm({ name: '', description: '', city: '', parent_id: '' })
    setShowCreate(false)
  }

  async function handleDelete(channelId) {
    if (!confirm('Bu konuyu ve altındaki tüm alt grupları silmek istediğinize emin misiniz?')) return
    await supabase.from('channels').delete().eq('id', channelId)
    setChannels(c => c.filter(x => x.id !== channelId))
  }

  const rootChannels = channels.filter(ch => !ch.parent_id)
  const generalChannels = rootChannels.filter(ch => !ch.city)
  const cityChannels = rootChannels.filter(ch => ch.city)
  const eligibleParents = rootChannels

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Konular</h1>
        {profile?.is_admin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Konu
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-4">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'general' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Genel Konular ({generalChannels.length})
        </button>
        <button
          onClick={() => setActiveTab('city')}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'city' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Şehir Grupları ({cityChannels.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {activeTab === 'general' ? (
            generalChannels.map(ch => (
              <div key={ch.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/konular/${ch.id}`} className="flex-1 min-w-0">
                    <span className="inline-block text-[10px] bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mb-2">
                      {ch.name.toLocaleUpperCase('tr-TR')}
                    </span>
                    {ch.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{ch.description}</p>}
                    <p className="text-[10px] text-gray-400 mt-1.5">Oluşturan: {ch.profiles?.full_name}</p>
                  </Link>
                  {profile?.is_admin && (
                    <button
                      onClick={() => handleDelete(ch.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 shrink-0 self-center transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            cityChannels.map(ch => (
              <div key={ch.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/konular/${ch.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-[10px] bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {ch.name.toLocaleUpperCase('tr-TR')}
                      </span>
                      <span className="text-[10px] bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        📍 {ch.city.toLocaleUpperCase('tr-TR')}
                      </span>
                    </div>
                    {ch.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{ch.description}</p>}
                    <p className="text-[10px] text-gray-400 mt-1.5">Oluşturan: {ch.profiles?.full_name}</p>
                  </Link>
                  {profile?.is_admin && (
                    <button
                      onClick={() => handleDelete(ch.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 shrink-0 self-center transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          {activeTab === 'general' && generalChannels.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <p className="text-sm">Henüz genel konu bulunmuyor.</p>
            </div>
          )}
          {activeTab === 'city' && cityChannels.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <p className="text-sm">Henüz şehir grubu bulunmuyor.</p>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Yeni Konu Oluştur</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Konu Başlığı *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="örneğin: almanya-vize"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Şehir (İsteğe Bağlı)</label>
                <input
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="örneğin: Berlin"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Boş bırakılırsa tüm şehirlere açık genel bir konu olur.
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Üst Konu (İsteğe Bağlı Alt Konu İçin)</label>
                <select
                  value={form.parent_id}
                  onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">(Ana Konu)</option>
                  {eligibleParents.map(parent => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name.toLocaleUpperCase('tr-TR')} {parent.city ? `(${parent.city.toLocaleUpperCase('tr-TR')})` : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Başka bir konunun altına alt forum olarak eklemek için seçin.
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Açıklama</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Konunun amacı nedir?"
                />
              </div>

              <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-medium text-sm transition-colors">
                Oluştur
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
