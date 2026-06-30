import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import LocationInput from '../components/LocationInput'
import EventChat from '../components/EventChat'

function formatDate(dt) {
  return new Date(dt).toLocaleString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function EventDetail() {
  const { id } = useParams()
  const { profile, displayName } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [rsvps, setRsvps] = useState([])
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [activeReplyId, setActiveReplyId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [myRsvp, setMyRsvp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({})
  const [activeTab, setActiveTab] = useState('details')
  const [copied, setCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showShareSheet, setShowShareSheet] = useState(false)
  const menuRef = useRef(null)

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [friends, setFriends] = useState([])
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [invitingIds, setInvitingIds] = useState(new Set())
  const [invitedIds, setInvitedIds] = useState(new Set())

  useEffect(() => {
    if (showInviteModal) {
      fetchFriends()
    }
  }, [showInviteModal])

  async function fetchFriends() {
    setFriendsLoading(true)
    const { data } = await supabase
      .from('friendships')
      .select('*, sender:profiles!sender_id(id, full_name, username, privacy), receiver:profiles!receiver_id(id, full_name, username, privacy)')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
    
    if (data) {
      const list = data.map(f => f.sender_id === profile.id ? f.receiver : f.sender)
      setFriends(list)
    }
    setFriendsLoading(false)
  }

  async function handleInviteFriend(friendId) {
    setInvitingIds(prev => new Set([...prev, friendId]))
    const inviteMessage = `Selam! Seni "${event?.title}" etkinliğine davet etmek istedim. Detaylara buradan göz atabilirsin: ${window.location.origin}/etkinlikler/${event?.id}`
    
    const { error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: profile.id,
        receiver_id: friendId,
        body: inviteMessage
      })
    
    if (!error) {
      setInvitedIds(prev => new Set([...prev, friendId]))
    }
    setInvitingIds(prev => {
      const next = new Set(prev)
      next.delete(friendId)
      return next
    })
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => { fetchData() }, [id])

  async function handleShare() {
    const urlToShare = `${window.location.origin}/etkinlikler/${id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Alamanci Etkinlik',
          url: urlToShare
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to share event:', err)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(urlToShare)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy link: ', err)
      }
    }
  }

  async function fetchData() {
    const [{ data: ev }, { data: allRsvps }, { data: allComments }] = await Promise.all([
      supabase.from('events').select('*, profiles!created_by(full_name, username, privacy)').eq('id', id).single(),
      supabase.from('rsvps').select('*, profiles(full_name, username, privacy)').eq('event_id', id),
      supabase.from('event_comments').select('*, profiles(full_name, username, privacy)').eq('event_id', id).order('created_at', { ascending: true })
    ])
    setEvent(ev)
    setForm({ title: ev?.title, description: ev?.description, location: ev?.location, datetime: ev?.event_date?.slice(0, 16) || '' })
    setRsvps(allRsvps || [])
    setComments(allComments || [])
    setMyRsvp((allRsvps || []).find(r => r.user_id === profile.id)?.status || null)
    setLoading(false)
  }

  async function setRsvpStatus(status) {
    if (myRsvp === status) {
      await supabase.from('rsvps').delete().eq('event_id', id).eq('user_id', profile.id)
      setRsvps(r => r.filter(x => x.user_id !== profile.id))
      setMyRsvp(null)
    } else {
      await supabase.from('rsvps').upsert({ event_id: id, user_id: profile.id, status }, { onConflict: 'event_id,user_id' })
      setRsvps(r => {
        const filtered = r.filter(x => x.user_id !== profile.id)
        return [...filtered, { event_id: id, user_id: profile.id, status, profiles: { full_name: profile.full_name, username: profile.username } }]
      })
      setMyRsvp(status)
    }
  }

  async function handleSave() {
    const event_date = `${form.datetime}:00`
    const updates = { title: form.title, description: form.description || null, location: form.location || null, event_date }
    await supabase.from('events').update(updates).eq('id', id)
    setEvent(ev => ({ ...ev, ...updates }))
    setEditMode(false)
  }

  async function handleDelete() {
    if (!confirm('Bu etkinligi silmek istediginize emin misiniz?')) return
    await supabase.from('events').delete().eq('id', id)
    navigate('/etkinlikler')
  }

  async function submitComment(e, parentId = null) {
    e.preventDefault()
    const text = parentId ? replyText.trim() : commentText.trim()
    if (!text) return
    
    if (parentId) {
      // Just lock or ignore loading if it's quick
    } else {
      setSubmittingComment(true)
    }

    const { data } = await supabase
      .from('event_comments')
      .insert({ event_id: id, author_id: profile.id, body: text, parent_id: parentId })
      .select('*, profiles(full_name, username, privacy)')
      .single()

    if (parentId) {
      setActiveReplyId(null)
      setReplyText('')
    } else {
      setSubmittingComment(false)
      setCommentText('')
    }

    if (data) {
      setComments(c => [...c, data])
    }
  }

  async function deleteComment(commentId) {
    if (!confirm('Bu yorumu silmek istediginize emin misiniz?')) return
    await supabase.from('event_comments').delete().eq('id', commentId)
    setComments(c => c.filter(x => x.id !== commentId))
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!event) return <div className="text-center py-12 text-[var(--r-meta)]">Etkinlik bulunamadi.</div>

  const going = rsvps.filter(r => r.status === 'going')
  const notgoing = rsvps.filter(r => r.status === 'notgoing')
  const canEdit = profile?.is_admin || profile?.id === event.created_by
  const rootComments = comments.filter(c => !c.parent_id)
  const getRepliesFor = (parentId) => comments.filter(c => c.parent_id === parentId)


  return (
    <div>
      <button onClick={() => navigate(-1)} className="text-sm text-[var(--r-meta)] hover:text-[var(--r-text)] mb-4 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Geri Don
      </button>

      <div className="bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm overflow-hidden">
        {event.cover_image_url && !editMode && (
          <img src={event.cover_image_url} alt="" className="w-full h-48 object-cover" />
        )}
        <div className="p-6">
          {editMode ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Baslik</label>
                <input type="text" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Tarih ve Saat</label>
                <input type="datetime-local" value={form.datetime || ''} onChange={e => setForm(f => ({ ...f, datetime: e.target.value }))} className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Konum</label>
                <LocationInput
                  value={form.location || ''}
                  onChange={val => setForm(f => ({ ...f, location: val }))}
                  className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Aciklama</label>
                <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl text-sm font-medium">Kaydet</button>
                <button onClick={() => setEditMode(false)} className="px-4 py-2.5 border border-[var(--r-border)] rounded-xl text-sm text-[var(--r-meta)]">Iptal</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-2xl font-extrabold text-[var(--r-text)] tracking-tight leading-snug flex-1 min-w-0">{event.title}</h1>
              </div>
              <div className="flex flex-col gap-2 mb-5">
                <p className="text-primary-600 font-bold text-sm">{formatDate(event.event_date)}</p>
                {event.city && (
                  <span className="text-xs text-amber-600 font-bold">
                    Şehir: {event.city.toLocaleUpperCase('tr-TR')}
                  </span>
                )}
                {event.location && (
                  <div>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--r-text)] inline-flex items-center gap-1 hover:opacity-75 hover:-translate-y-px transition-all duration-150"
                    >
                      <span className="leading-relaxed">{event.location}</span>
                    </a>
                  </div>
                )}
              </div>
              {event.description && (
                <div className="py-4 border-y border-[var(--r-border)] my-5">
                  <p className="text-[var(--r-text)] text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between border-t border-[var(--r-border)] pt-4 mt-4">
                <p className="text-xs text-[var(--r-meta)] font-medium">
                  Düzenleyen:{' '}
                  <button 
                    onClick={() => window.showUserProfile && window.showUserProfile(event.created_by)}
                    className="text-primary-600 hover:underline font-semibold"
                  >
                    @{event.profiles?.username}
                  </button>
                </p>
                <div className="flex gap-1.5 shrink-0 items-center -mr-3">
                  <button 
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-1 bg-[var(--r-hover)] text-[var(--r-text)] hover:bg-[var(--r-border)] px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-colors border border-[var(--r-border)]"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Davet Et
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1 bg-[var(--r-hover)] text-[var(--r-text)] hover:bg-[var(--r-border)] px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-colors relative border border-[var(--r-border)]"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Paylas
                    {copied && (
                      <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[var(--r-text)] text-[var(--r-card)] text-[9px] px-2 py-1 rounded shadow-md whitespace-nowrap z-10">
                        Kopyalandi!
                      </span>
                    )}
                  </button>
                  {canEdit && (
                    <div className="relative" ref={menuRef}>
                      <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1.5 text-[var(--r-meta)] hover:text-[var(--r-text)] hover:bg-[var(--r-hover)] rounded-xl transition-colors flex items-center justify-center"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>

                      {showMenu && (
                        <div className="absolute right-0 bottom-full mb-1 bg-[var(--r-card)] border border-[var(--r-border)] rounded-xl shadow-lg py-1 w-32 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                          <button
                            onClick={() => {
                              setEditMode(true)
                              setShowMenu(false)
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[var(--r-text)] hover:bg-[var(--r-hover)] hover:text-primary-600 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Duzenle
                          </button>
                          <button
                            onClick={() => {
                              handleDelete()
                              setShowMenu(false)
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 border-t border-[var(--r-border)] mt-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Sil
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {!editMode && (
        <>
          <div className="mt-4 bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[var(--r-text)] text-sm">Katılım Durumu</h2>
              <button
                onClick={() => setRsvpStatus('going')}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium transition-colors border ${
                  myRsvp === 'going'
                    ? 'bg-green-500/10 text-green-600 border-green-500/20'
                    : 'bg-[var(--r-hover)] text-[var(--r-meta)] border-[var(--r-border)] hover:text-[var(--r-text)]'
                }`}
              >
                <span>👍</span>
                <span>Katılıyorum</span>
                <span className="bg-black/10 text-xs px-1.5 py-0.5 rounded-full">{going.length}</span>
              </button>
            </div>
          </div>

          <div className="mt-4 flex border-b border-[var(--r-border)]">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 sm:flex-initial text-center px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'details'
                  ? 'border-primary-600 text-primary-600 font-bold'
                  : 'border-transparent text-[var(--r-meta)] hover:text-[var(--r-text)]'
              }`}
            >
              Katılımcılar &amp; Yorumlar
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 sm:flex-initial text-center px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'border-primary-600 text-primary-600 font-bold'
                  : 'border-transparent text-[var(--r-meta)] hover:text-[var(--r-text)]'
              }`}
            >
              <span>Etkinlik Sohbeti</span>
              <span className="text-[9px] bg-primary-500/10 text-primary-600 px-1.5 py-0.5 rounded-full font-bold">LIVE</span>
            </button>
          </div>

          {activeTab === 'details' ? (
            <>
              {going.length > 0 && (
                <div className="mt-4 bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm p-4">
                  <h2 className="font-semibold text-[var(--r-text)] text-sm mb-3">Katılanlar ({going.length})</h2>
                  <div className="flex flex-wrap gap-2">
                    {going.map(r => (
                      <button 
                        key={r.user_id} 
                        onClick={() => window.showUserProfile && window.showUserProfile(r.user_id)}
                        className="text-xs bg-green-500/10 text-green-600 hover:bg-green-500/[0.15] px-3 py-1 rounded-full font-semibold transition-colors"
                      >
                        @{r.profiles?.username}
                      </button>
                    ))}
                  </div>
                </div>
              )}



              {/* Yorumlar Bolumu */}
              <div className="mt-4 bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm p-4">
                <h2 className="font-semibold text-[var(--r-text)] text-sm mb-4">Yorumlar ({comments.length})</h2>
                
                <div className="space-y-4 mb-4">
                  {rootComments.length === 0 ? (
                    <p className="text-xs text-[var(--r-meta)]">Henüz yorum yapılmamış. İlk yorumu siz yazın!</p>
                  ) : (
                    rootComments.map(c => {
                      const replies = getRepliesFor(c.id)
                      return (
                        <div key={c.id} className="space-y-3">
                          {/* Ana Yorum */}
                          <div className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0 border border-primary-500/20">
                              <span className="text-xs font-bold text-primary-600">{c.profiles?.username?.[0]?.toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => window.showUserProfile && window.showUserProfile(c.author_id)}
                                  className="text-xs font-bold text-primary-600 hover:underline"
                                >
                                  @{c.profiles?.username}
                                </button>
                                <span className="text-[10px] text-[var(--r-meta)]">
                                  {new Date(c.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--r-meta)] mt-1 leading-relaxed">{c.body}</p>
                              
                              {/* Yanitla Butonu */}
                              <div className="flex items-center gap-3 mt-1.5">
                                <button 
                                  onClick={() => {
                                    if (activeReplyId === c.id) {
                                      setActiveReplyId(null)
                                      setReplyText('')
                                    } else {
                                      setActiveReplyId(c.id)
                                      setReplyText('')
                                    }
                                  }}
                                  className="text-[11px] text-primary-600 hover:underline font-medium"
                                >
                                  Yanitla
                                </button>
                              </div>
                            </div>
                            {(profile?.is_admin || profile?.id === c.author_id) && (
                              <button onClick={() => deleteComment(c.id)} className="text-[var(--r-border)] hover:text-red-500 shrink-0 p-1 rounded-lg transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>

                          {/* Yanitlari Listeleme */}
                          {replies.length > 0 && (
                            <div className="pl-8 border-l-2 border-[var(--r-border)] ml-4 space-y-3 mt-2">
                              {replies.map(reply => (
                                <div key={reply.id} className="flex gap-2.5 items-start">
                                  <div className="w-7 h-7 rounded-full bg-[var(--r-hover)] flex items-center justify-center shrink-0 border border-[var(--r-border)]">
                                    <span className="text-[11px] font-bold text-[var(--r-meta)]">{reply.profiles?.username?.[0]?.toUpperCase()}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => window.showUserProfile && window.showUserProfile(reply.author_id)}
                                        className="text-xs font-bold text-primary-600 hover:underline"
                                      >
                                        @{reply.profiles?.username}
                                      </button>
                                      <span className="text-[10px] text-[var(--r-meta)]">
                                        {new Date(reply.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="text-xs text-[var(--r-meta)] mt-1 leading-relaxed">{reply.body}</p>
                                  </div>
                                  {(profile?.is_admin || profile?.id === reply.author_id) && (
                                    <button onClick={() => deleteComment(reply.id)} className="text-[var(--r-border)] hover:text-red-500 shrink-0 p-1 rounded-lg transition-colors">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Aktif Cevap Yazma Formu */}
                          {activeReplyId === c.id && (
                            <form onSubmit={(e) => submitComment(e, c.id)} className="flex gap-2 pl-8 ml-4 mt-2">
                              <input
                                required
                                className="flex-1 text-xs border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2 focus:bg-[var(--r-card)] focus:outline-none focus:ring-1 focus:ring-primary-500"
                                placeholder="Cevap yazın..."
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                              />
                              <button 
                                type="submit" 
                                className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-xl font-medium transition-colors"
                              >
                                Gönder
                              </button>
                            </form>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>

                <form onSubmit={(e) => submitComment(e)} className="flex gap-2">
                  <input
                    required
                    className="flex-1 text-xs border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 focus:bg-[var(--r-card)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Yorum yazın..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    disabled={submittingComment}
                    className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-medium disabled:opacity-60 transition-colors"
                  >
                    Gönder
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="mt-4">
              <EventChat eventId={id} />
            </div>
          )}
        </>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[var(--r-card)] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[var(--r-border)] flex items-center justify-between">
              <h3 className="font-bold text-[var(--r-text)] text-base">Arkadaşlarını Davet Et</h3>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-[var(--r-meta)] hover:text-[var(--r-text)] p-1 rounded-lg hover:bg-[var(--r-hover)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 max-h-[300px] overflow-y-auto space-y-3">
              {friendsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : friends.length === 0 ? (
                <p className="text-center text-[var(--r-meta)] text-xs py-8">Henüz arkadaşınız yok.</p>
              ) : (
                friends.map(friend => {
                  const isInviting = invitingIds.has(friend.id)
                  const isInvited = invitedIds.has(friend.id)
                  return (
                    <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-[var(--r-hover)] rounded-2xl transition-colors">
                      <span className="text-sm font-semibold text-[var(--r-text)]">{displayName(friend)}</span>
                      <button
                        disabled={isInviting || isInvited}
                        onClick={() => handleInviteFriend(friend.id)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all ${
                          isInvited
                            ? 'bg-green-500/10 text-green-600 border border-green-500/20 cursor-default'
                            : isInviting
                            ? 'bg-[var(--r-hover)] text-[var(--r-meta)] cursor-not-allowed'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/[0.15] active:scale-95'
                        }`}
                      >
                        {isInvited ? 'Davet Edildi' : isInviting ? 'Gönderiliyor...' : 'Davet Et'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
