import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'az önce'
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`
  return `${Math.floor(diff / 86400)} gün önce`
}

export default function PostCard({ post, onDelete, onEdit }) {
  const { profile } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editTitle, setEditTitle] = useState(post.title)
  const [editBody, setEditBody] = useState(post.body)

  const canEdit = profile?.is_admin || profile?.id === post.author_id
  const canDelete = profile?.is_admin || profile?.id === post.author_id

  async function loadComments() {
    if (showComments) { setShowComments(false); return }
    setLoadingComments(true)
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(full_name)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
    setShowComments(true)
    setLoadingComments(false)
  }

  async function submitComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: post.id, author_id: profile.id, body: commentText.trim() })
      .select('*, profiles(full_name)')
      .single()
    if (data) setComments(c => [...c, data])
    setCommentText('')
  }

  async function deleteComment(commentId) {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(c => c.filter(c => c.id !== commentId))
  }

  async function saveEdit() {
    await onEdit(post.id, { title: editTitle, body: editBody })
    setEditMode(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {post.channels && (
                <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                  #{post.channels.name}
                </span>
              )}
              <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
            </div>
            {editMode ? (
              <div className="space-y-2 mt-2">
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                />
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                  rows={3}
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg">Kaydet</button>
                  <button onClick={() => setEditMode(false)} className="text-xs text-gray-500 px-3 py-1.5 rounded-lg border">İptal</button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-gray-900 text-sm">{post.title}</h3>
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">{post.body}</p>
                <p className="text-xs text-gray-400 mt-2">{post.profiles?.full_name}</p>
              </>
            )}
          </div>
          {(canEdit || canDelete) && !editMode && (
            <div className="flex gap-1 shrink-0">
              {canEdit && (
                <button onClick={() => setEditMode(true)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {canDelete && (
                <button onClick={() => onDelete(post.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-50 px-4 py-2">
        <button
          onClick={loadComments}
          className="text-xs text-gray-500 hover:text-primary-600 font-medium"
        >
          {loadingComments ? 'Yükleniyor...' : showComments ? 'Yorumları Gizle' : `Yorumlar`}
        </button>
      </div>

      {showComments && (
        <div className="border-t border-gray-50 bg-gray-50 px-4 py-3 space-y-3">
          {comments.length === 0 && <p className="text-xs text-gray-400">Henüz yorum yok.</p>}
          {comments.map(c => (
            <div key={c.id} className="flex gap-2 items-start">
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary-700">{c.profiles?.full_name?.[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700">{c.profiles?.full_name}</p>
                <p className="text-xs text-gray-600">{c.body}</p>
              </div>
              {(profile?.is_admin || profile?.id === c.author_id) && (
                <button onClick={() => deleteComment(c.id)} className="text-gray-300 hover:text-red-400 shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <form onSubmit={submitComment} className="flex gap-2 mt-2">
            <input
              className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Yorum yaz..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
            />
            <button type="submit" className="text-xs bg-primary-600 text-white px-3 py-2 rounded-lg font-medium">
              Gönder
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
