import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CreatePostModal from '../components/CreatePostModal'

export default function Channels() {
  const { profile } = useAuth()
  const [channels, setChannels] = useState([])
  const [followedChannels, setFollowedChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', parent_id: '' })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: ch }, { data: follows }] = await Promise.all([
      supabase
        .from('channels')
        .select('*, profiles!created_by(full_name)')
        .is('city', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('channel_follows')
        .select('channel_id')
        .eq('user_id', profile.id)
    ])
    setChannels(ch || [])
    setFollowedChannels((follows || []).map(f => f.channel_id))
    setLoading(false)
  }

  async function toggleFollow(channelId, e) {
    e.preventDefault()
    e.stopPropagation()
    const isFollowed = followedChannels.includes(channelId)

    if (isFollowed) {
      await supabase.from('channel_follows').delete().eq('user_id', profile.id).eq('channel_id', channelId)
      setFollowedChannels(prev => prev.filter(id => id !== channelId))
    } else {
      await supabase.from('channel_follows').insert({ user_id: profile.id, channel_id: channelId })
      setFollowedChannels(prev => [...prev, channelId])
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name.trim()) return

    const insertData = {
      name: form.name.trim(),
      description: form.description.trim() || null,
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
    setForm({ name: '', description: '', parent_id: '' })
    setShowCreate(false)
  }

  async function handleDelete(channelId) {
    if (!confirm('Bu konuyu ve altındaki tüm alt grupları silmek istediğinize emin misiniz?')) return
    await supabase.from('channels').delete().eq('id', channelId)
    setChannels(c => c.filter(x => x.id !== channelId))
  }

  const rootChannels = channels.filter(ch => !ch.parent_id)
  const eligibleParents = rootChannels

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--r-text)]">Konular</h1>
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

      <button
        onClick={() => setShowCreatePost(true)}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 mb-4 shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Gönderi Oluştur
      </button>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {rootChannels.map(ch => (
            <div key={ch.id} className="bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm p-4 hover:bg-[var(--r-hover)] transition-colors duration-150">
              <div className="flex items-start justify-between gap-3">
                <Link to={`/konular/${ch.id}`} className="flex-1 min-w-0">
                  <span className="inline-block text-[10px] bg-primary-500/10 text-primary-600 border border-primary-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mb-2">
                    {ch.name.toLocaleUpperCase('tr-TR')}
                  </span>
                  {ch.description && <p className="text-xs text-[var(--r-meta)] mt-0.5 line-clamp-2 leading-relaxed">{ch.description}</p>}
                  {profile?.is_admin && (
                    <p className="text-[10px] text-[var(--r-meta)] mt-1.5">Oluşturan: {ch.profiles?.full_name}</p>
                  )}
                </Link>
                <div className="flex items-center shrink-0 self-center">
                  <button
                    onClick={(e) => toggleFollow(ch.id, e)}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all border shrink-0 mr-2 ${
                      followedChannels.includes(ch.id)
                        ? 'bg-primary-500/10 text-primary-600 border-primary-500/20 hover:bg-primary-500/[0.15]'
                        : 'bg-[var(--r-card)] text-[var(--r-meta)] border-[var(--r-border)] hover:border-primary-500/30 hover:text-primary-600'
                    }`}
                  >
                    {followedChannels.includes(ch.id) ? 'Takip Ediliyor ✓' : 'Takip Et +'}
                  </button>
                  {profile?.is_admin && (
                    <button
                      onClick={() => handleDelete(ch.id)}
                      className="p-1.5 text-[var(--r-meta)] hover:text-red-500 transition-colors"
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

          {rootChannels.length === 0 && (
            <div className="text-center py-16 text-[var(--r-meta)] bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)]">
              <p className="text-sm">Henüz konu bulunmuyor.</p>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-[var(--r-card)] w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto pb-20 md:pb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[var(--r-text)]">Yeni Konu Oluştur</h2>
              <button onClick={() => setShowCreate(false)} className="text-[var(--r-meta)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Konu Başlığı *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="örneğin: almanya-vize"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Üst Konu (İsteğe Bağlı Alt Konu İçin)</label>
                <select
                  value={form.parent_id}
                  onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
                  className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">(Ana Konu)</option>
                  {eligibleParents.map(parent => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name.toLocaleUpperCase('tr-TR')}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[var(--r-meta)] mt-1 block">
                  Başka bir konunun altına alt forum olarak eklemek için seçin.
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Açıklama</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
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
      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onCreated={() => {}}
        />
      )}
    </div>
  )
}
