import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'

export default function ChannelDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [channel, setChannel] = useState(null)
  const [subChannels, setSubChannels] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [cityFilter, setCityFilter] = useState('')

  // Channel editing state
  const [channelEditMode, setChannelEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '', city: '', parent_id: '' })
  const [allRootChannels, setAllRootChannels] = useState([])
  const [savingChannel, setSavingChannel] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    setLoading(true)
    const [{ data: ch }, { data: subCh }, { data: p }, { data: allCh }] = await Promise.all([
      supabase.from('channels').select('*, profiles!created_by(full_name, username, privacy)').eq('id', id).single(),
      supabase.from('channels').select('*, profiles!created_by(full_name, username, privacy)').eq('parent_id', id).order('created_at', { ascending: false }),
      supabase.from('posts').select('*, profiles(full_name, username, privacy), channels(name)').eq('channel_id', id).order('created_at', { ascending: false }),
      supabase.from('channels').select('id, name, city').is('parent_id', null)
    ])
    setChannel(ch)
    setSubChannels(subCh || [])
    setPosts(p || [])
    setAllRootChannels(allCh || [])
    if (ch) {
      setEditForm({
        name: ch.name || '',
        description: ch.description || '',
        city: ch.city || '',
        parent_id: ch.parent_id || ''
      })
    }
    setLoading(false)
  }

  async function handleSaveChannel(e) {
    e.preventDefault()
    setSavingChannel(true)
    const updates = {
      name: editForm.name.trim(),
      description: editForm.description.trim() || null,
      city: editForm.city.trim() || null,
      parent_id: editForm.parent_id || null
    }
    const { error } = await supabase.from('channels').update(updates).eq('id', id)
    if (!error) {
      setChannel(ch => ({ ...ch, ...updates }))
      setChannelEditMode(false)
    }
    setSavingChannel(false)
  }

  async function handleDelete(postId) {
    if (!confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) return
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(p => p.filter(x => x.id !== postId))
  }

  async function handleEdit(postId, updates) {
    await supabase.from('posts').update(updates).eq('id', postId)
    setPosts(p => p.map(x => x.id === postId ? { ...x, ...updates } : x))
  }

  const uniqueCities = [...new Set(posts.map(p => p.city).filter(Boolean))]
  const filteredPosts = cityFilter ? posts.filter(p => p.city === cityFilter) : posts

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!channel) return <div className="text-center py-12 text-[var(--r-meta)]">Konu bulunamadı.</div>

  return (
    <div className="pb-8">
      <div className="mb-4">
        <Link to="/konular" className="text-sm text-[var(--r-meta)] hover:text-[var(--r-text)] mb-2 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Konular
        </Link>

        {channelEditMode ? (
          <div className="bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm p-4">
            <form onSubmit={handleSaveChannel} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Konu Başlığı *</label>
                <input
                  required
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Şehir (İsteğe Bağlı)</label>
                  <input
                    value={editForm.city}
                    onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Üst Konu (İsteğe Bağlı)</label>
                  <select
                    value={editForm.parent_id}
                    onChange={e => setEditForm(f => ({ ...f, parent_id: e.target.value }))}
                    className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">(Ana Konu)</option>
                    {allRootChannels
                      .filter(c => c.id !== id)
                      .map(parent => (
                        <option key={parent.id} value={parent.id}>
                          {parent.name.toLocaleUpperCase('tr-TR')} {parent.city ? `(${parent.city.toLocaleUpperCase('tr-TR')})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Açıklama</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={2.5}
                  className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={savingChannel} className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl text-xs font-semibold disabled:opacity-60 transition-colors">
                  {savingChannel ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button type="button" onClick={() => setChannelEditMode(false)} className="px-4 py-2.5 border border-[var(--r-border)] rounded-xl text-xs text-[var(--r-meta)] font-semibold transition-colors">
                  İptal
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm p-4 mb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-primary-500/10 text-primary-600 border border-primary-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {channel.name.toLocaleUpperCase('tr-TR')}
                  </span>
                  {channel.city && (
                    <span className="text-[10px] bg-[var(--r-bg)] text-[var(--r-meta)] border border-[var(--r-border)] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      📍 {channel.city.toLocaleUpperCase('tr-TR')}
                    </span>
                  )}
                  {profile?.is_admin && (
                    <button
                      onClick={() => setChannelEditMode(true)}
                      className="p-1 text-[var(--r-meta)] hover:text-primary-600 transition-colors ml-0.5"
                      title="Konuyu Düzenle"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
                {channel.description && <p className="text-sm text-[var(--r-meta)] mt-1">{channel.description}</p>}
                {profile?.is_admin && (
                  <p className="text-xs text-[var(--r-meta)] mt-1">
                    Oluşturan:{' '}
                    <button
                      onClick={() => window.showUserProfile && window.showUserProfile(channel.created_by)}
                      className="text-primary-600 hover:underline font-semibold"
                    >
                      @{channel.profiles?.username}
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowCreate(true)}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 mb-4 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Gönderi Oluştur
        </button>
      </div>

      {/* Sub-channels / sub-forums list */}
      {subChannels.length > 0 && (
        <div className="bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm p-4 mb-4">
          <h2 className="text-xs font-bold text-[var(--r-meta)] uppercase tracking-wider mb-2.5">Alt Konular / Gruplar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {subChannels.map(sub => (
              <Link
                key={sub.id}
                to={`/konular/${sub.id}`}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--r-border)] hover:bg-primary-500/[0.05] hover:border-primary-500/20 transition-colors text-xs font-semibold text-[var(--r-text)] hover:text-primary-600"
              >
                <span className="text-[10px] bg-primary-500/10 text-primary-600 border border-primary-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {sub.name.toLocaleUpperCase('tr-TR')}
                </span>
                <svg className="w-3.5 h-3.5 text-[var(--r-meta)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {uniqueCities.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setCityFilter('')}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${
              !cityFilter
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-[var(--r-card)] text-[var(--r-meta)] border-[var(--r-border)] hover:border-primary-500/30 hover:text-primary-600'
            }`}
          >
            Tümü ({posts.length})
          </button>
          {uniqueCities.map(city => (
            <button
              key={city}
              onClick={() => setCityFilter(city === cityFilter ? '' : city)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${
                cityFilter === city
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-[var(--r-card)] text-[var(--r-meta)] border-[var(--r-border)] hover:border-primary-500/30 hover:text-primary-600'
              }`}
            >
              📍 {city} ({posts.filter(p => p.city === city).length})
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-[var(--r-meta)] text-sm bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] p-8">
            {cityFilter ? `${cityFilter} için henüz gönderi yok.` : 'Bu konuda henüz gönderi yok. İlk paylaşımı siz yapın!'}
          </div>
        ) : (
          filteredPosts.map(post => (
            <PostCard key={post.id} post={post} onDelete={handleDelete} onEdit={handleEdit} />
          ))
        )}
      </div>

      {showCreate && (
        <CreatePostModal
          defaultChannelId={id}
          onClose={() => setShowCreate(false)}
          onCreated={post => setPosts(p => [post, ...p])}
        />
      )}
    </div>
  )
}
