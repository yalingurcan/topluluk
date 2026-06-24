import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'

function formatEventDate(dt) {
  return new Date(dt).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Feed() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => { fetchFeed() }, [])

  async function fetchFeed() {
    setLoading(true)
    const [{ data: postsData }, { data: eventsData }] = await Promise.all([
      supabase
        .from('posts')
        .select('*, profiles(full_name), channels(name)')
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('events')
        .select('*, profiles!created_by(full_name)')
        .order('created_at', { ascending: false })
        .limit(15)
    ])

    const merged = [
      ...(postsData || []).map(p => ({ ...p, feedType: 'post' })),
      ...(eventsData || []).map(e => ({ ...e, feedType: 'event' }))
    ]

    merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    setItems(merged)
    setLoading(false)
  }

  async function handleDelete(postId) {
    if (!confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) return
    await supabase.from('posts').delete().eq('id', postId)
    setItems(items => items.filter(x => !(x.feedType === 'post' && x.id === postId)))
  }

  async function handleEdit(postId, updates) {
    await supabase.from('posts').update(updates).eq('id', postId)
    setItems(items => items.map(x => (x.feedType === 'post' && x.id === postId) ? { ...x, ...updates } : x))
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
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p className="text-sm">Henüz paylaşım yok. İlk gönderiyi siz yapın!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => {
            if (item.feedType === 'post') {
              return (
                <PostCard 
                  key={`post-${item.id}`} 
                  post={item} 
                  onDelete={handleDelete} 
                  onEdit={handleEdit} 
                />
              )
            } else {
              return (
                <div key={`event-${item.id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-l-4 border-l-primary-500">
                  {item.cover_image_url && (
                    <img src={item.cover_image_url} alt="" className="w-full h-40 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Etkinlik
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} eklendi
                      </span>
                    </div>
                    <Link to={`/etkinlikler/${item.id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-primary-600 text-sm">{item.title}</h3>
                    </Link>
                    <p className="text-xs text-primary-600 mt-1 font-medium">📅 {formatEventDate(item.event_date)}</p>
                    {item.location && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-primary-600 hover:underline mt-0.5 inline-flex items-center gap-1"
                      >
                        📍 {item.location}
                      </a>
                    )}
                    {item.description && <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">{item.description}</p>}
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                      <p className="text-[11px] text-gray-400">Düzenleyen: {item.profiles?.full_name}</p>
                      <Link to={`/etkinlikler/${item.id}`} className="text-xs text-primary-600 font-medium hover:underline">
                        Katıl ve Detaylar ➔
                      </Link>
                    </div>
                  </div>
                </div>
              )
            }
          })}
        </div>
      )}

      {showCreate && (
        <CreatePostModal
          onClose={() => setShowCreate(false)}
          onCreated={post => setItems(items => [{ ...post, feedType: 'post' }, ...items])}
        />
      )}
    </div>
  )
}
