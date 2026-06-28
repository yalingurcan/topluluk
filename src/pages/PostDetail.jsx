import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPost()
  }, [id])

  async function fetchPost() {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(full_name), channels(name)')
      .eq('id', id)
      .single()

    if (error || !data) {
      setPost(null)
    } else {
      setPost(data)
    }
    setLoading(false)
  }

  async function handleDelete(postId) {
    if (!confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) return
    await supabase.from('posts').delete().eq('id', postId)
    navigate('/')
  }

  async function handleEdit(postId, updates) {
    await supabase.from('posts').update(updates).eq('id', postId)
    setPost(p => ({ ...p, ...updates }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Gönderi bulunamadı veya silinmiş olabilir.</p>
        <Link to="/" className="text-primary-600 font-medium hover:underline">Ana Sayfaya Dön</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <button 
          onClick={() => navigate(-1)} 
          className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Geri Dön
        </button>
      </div>
      <PostCard 
        post={post} 
        onDelete={handleDelete} 
        onEdit={handleEdit} 
      />
    </div>
  )
}
