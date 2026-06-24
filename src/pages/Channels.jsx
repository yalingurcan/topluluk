import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Channels() {
  const { profile } = useAuth()
  const [channels, setChannels] = useState([])
  const [memberships, setMemberships] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: ch }, { data: mem }] = await Promise.all([
      supabase.from('channels').select('*, profiles(full_name)').order('created_at', { ascending: false }),
      supabase.from('channel_members').select('channel_id').eq('user_id', profile.id)
    ])
    setChannels(ch || [])
    setMemberships(new Set((mem || []).map(m => m.channel_id)))
    setLoading(false)
  }

  async function toggleMembership(channelId) {
    if (memberships.has(channelId)) {
      await supabase.from('channel_members').delete().eq('channel_id', channelId).eq('user_id', profile.id)
      setMemberships(m => { const s = new Set(m); s.delete(channelId); return s })
    } else {
      await supabase.from('channel_members').insert({ channel_id: channelId, user_id: profile.id })
      setMemberships(m => new Set([...m, channelId]))
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    const { data } = await supabase
      .from('channels')
      .insert({ name: form.name.trim(), description: form.description.trim(), created_by: profile.id })
      .select('*, profiles(full_name)')
      .single()
    if (data) {
      setChannels(c => [data, ...c])
      await supabase.from('channel_members').insert({ channel_id: data.id, user_id: profile.id })
      setMemberships(m => new Set([...m, data.id]))
    }
    setForm({ name: '', description: '' })
    setShowCreate(false)
  }

  async function handleDelete(channelId) {
    if (!confirm('Bu grubu silmek istediğinize emin misiniz?')) return
    await supabase.from('channels').delete().eq('id', channelId)
    setChannels(c => c.filter(x => x.id !== channelId))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Gruplar</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Grup
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map(ch => (
            <div key={ch.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <Link to={`/gruplar/${ch.id}`} className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">#{ch.name}</h3>
                  {ch.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ch.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">Oluşturan: {ch.profiles?.full_name}</p>
                </Link>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleMembership(ch.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      memberships.has(ch.id)
                        ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {memberships.has(ch.id) ? 'Üyesin' : 'Katıl'}
                  </button>
                  {profile?.is_admin && (
                    <button
                      onClick={() => handleDelete(ch.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {channels.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">Henüz grup yok. İlk grubu oluşturun!</p>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Yeni Grup Oluştur</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Grup Adı</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="grup-adi"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Açıklama</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Grubun amacı nedir?"
                />
              </div>
              <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-medium text-sm">Oluştur</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
