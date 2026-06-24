import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'

export default function Feed() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => { fetchPosts() }, [])

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(full_name), channels(name)')
      .order('created_at', { ascending: false })
      .limit(50)
    setPosts(data || [])
    setLoading(false)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Ana Sayfa</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Paylaş
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p className="text-sm">Henüz gönderi yok. İlk gönderiyi siz yapın!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} onDelete={handleDelete} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePostModal
          onClose={() => setShowCreate(false)}
          onCreated={post => setPosts(p => [post, ...p])}
        />
      )}
    </div>
  )
}
