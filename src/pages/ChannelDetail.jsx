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
      supabase.from('channels').select('*, profiles!created_by(full_name)').eq('id', id).single(),
      supabase.from('channels').select('*, profiles!created_by(full_name)').eq('parent_id', id).order('created_at', { ascending: false }),
      supabase.from('posts').select('*, profiles(full_name), channels(name)').eq('channel_id', id).order('created_at', { ascending: false }),
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

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!channel) return <div className="text-center py-12 text-gray-400">Konu bulunamadı.</div>

  return (
    <div className="pb-8">
      <div className="mb-4">
        <Link to="/konular" className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Konular
        </Link>

        {channelEditMode ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <form onSubmit={handleSaveChannel} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Konu Başlığı *</label>
                <input
                  required
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Şehir (İsteğe Bağlı)</label>
                  <input
                    value={editForm.city}
                    onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Üst Konu (İsteğe Bağlı)</label>
                  <select
                    value={editForm.parent_id}
                    onChange={e => setEditForm(f => ({ ...f, parent_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <label className="text-xs font-medium text-gray-700 mb-1 block">Açıklama</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={2.5}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={savingChannel} className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl text-xs font-semibold disabled:opacity-60 transition-colors">
                  {savingChannel ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button type="button" onClick={() => setChannelEditMode(false)} className="px-4 py-2.5 border rounded-xl text-xs text-gray-600 font-semibold transition-colors">
                  İptal
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-primary-50 text-primary-700 border border-primary-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {channel.name.toLocaleUpperCase('tr-TR')}
                  </span>
                  {channel.city && (
                    <span className="text-[10px] bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      📍 {channel.city.toLocaleUpperCase('tr-TR')}
                    </span>
                  )}
                  {profile?.is_admin && (
                    <button
                      onClick={() => setChannelEditMode(true)}
                      className="p-1 text-gray-400 hover:text-primary-600 transition-colors ml-0.5"
                      title="Konuyu Düzenle"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
                {channel.description && <p className="text-sm text-gray-500 mt-1">{channel.description}</p>}
                <p className="text-xs text-gray-400 mt-1">Oluşturan: {channel.profiles?.full_name}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Paylaş
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sub-channels / sub-forums list */}
      {subChannels.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Alt Konular / Gruplar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {subChannels.map(sub => (
              <Link
                key={sub.id}
                to={`/konular/${sub.id}`}
                className="flex items-center justify-between p-2.5 rounded-xl border border-gray-50 hover:bg-primary-50/50 hover:border-primary-100 transition-colors text-xs font-semibold text-gray-700 hover:text-primary-700"
              >
                <span className="text-[10px] bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {sub.name.toLocaleUpperCase('tr-TR')}
                </span>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100 p-8">
            Bu konuda henüz gönderi yok. İlk paylaşımı siz yapın!
          </div>
        ) : (
          posts.map(post => (
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
