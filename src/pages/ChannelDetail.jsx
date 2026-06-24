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
  const [posts, setPosts] = useState([])
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    const [{ data: ch }, { data: p }, { data: mem }] = await Promise.all([
      supabase.from('channels').select('*, profiles!channels_created_by_fkey(full_name)').eq('id', id).single(),
      supabase.from('posts').select('*, profiles(full_name), channels(name)').eq('channel_id', id).order('created_at', { ascending: false }),
      supabase.from('channel_members').select('channel_id').eq('channel_id', id).eq('user_id', profile.id).maybeSingle()
    ])
    setChannel(ch)
    setPosts(p || [])
    setIsMember(!!mem)
    setLoading(false)
  }

  async function toggleMembership() {
    if (isMember) {
      await supabase.from('channel_members').delete().eq('channel_id', id).eq('user_id', profile.id)
      setIsMember(false)
    } else {
      await supabase.from('channel_members').insert({ channel_id: id, user_id: profile.id })
      setIsMember(true)
    }
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

  if (!channel) return <div className="text-center py-12 text-gray-400">Grup bulunamadı.</div>

  return (
    <div>
      <div className="mb-4">
        <Link to="/gruplar" className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Gruplar
        </Link>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">#{channel.name}</h1>
              {channel.description && <p className="text-sm text-gray-500 mt-1">{channel.description}</p>}
              <p className="text-xs text-gray-400 mt-1">Oluşturan: {channel.profiles?.full_name}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={toggleMembership}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                  isMember ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {isMember ? 'Üyesin' : 'Katıl'}
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg font-medium"
              >
                Paylaş
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Bu grupta henüz gönderi yok.</div>
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
