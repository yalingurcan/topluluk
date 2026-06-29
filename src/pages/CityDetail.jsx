import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'

function formatDate(dt) {
  return new Date(dt).toLocaleString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function CityDetail() {
  const { sehirAdi } = useParams()
  const cityName = decodeURIComponent(sehirAdi)
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'events')
  const [members, setMembers] = useState([])
  const [events, setEvents] = useState([])
  const [posts, setPosts] = useState([])
  const [friendships, setFriendships] = useState([])
  const [rsvps, setRsvps] = useState({})
  const [copiedId, setCopiedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => { fetchAll() }, [cityName])

  async function handleShare(eventId) {
    try {
      const url = `${window.location.origin}/etkinlikler/${eventId}`
      await navigator.clipboard.writeText(url)
      setCopiedId(eventId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDeleteEvent(eventId) {
    if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return
    await supabase.from('events').delete().eq('id', eventId)
    setEvents(ev => ev.filter(e => e.id !== eventId))
  }

  async function handleDeletePost(postId) {
    if (!confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) return
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(x => x.id !== postId))
  }

  async function handleEditPost(postId, updates) {
    await supabase.from('posts').update(updates).eq('id', postId)
    setPosts(prev => prev.map(x => x.id === postId ? { ...x, ...updates } : x))
  }

  const rsvpOptions = [
    { status: 'going', label: '👍 Katılıyorum', color: 'green' },
    { status: 'notgoing', label: '👎 Katılmıyorum', color: 'red' },
  ]

  async function fetchAll() {
    setLoading(true)
    const [
      { data: membersData },
      { data: eventsData },
      { data: postsData },
      { data: friendshipsData },
      { data: rsvpData },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('status', 'approved').ilike('city', cityName),
      supabase.from('events').select('*, profiles!created_by(full_name, username)').ilike('city', cityName).order('event_date', { ascending: true }),
      supabase.from('posts').select('*, profiles(full_name, username), channels(name)').ilike('city', cityName).order('created_at', { ascending: false }),
      supabase.from('friendships').select('*').or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`),
      supabase.from('rsvps').select('event_id, status').eq('user_id', profile.id),
    ])
    setMembers((membersData || []).filter(m => m.id !== profile.id))
    setEvents(eventsData || [])
    setPosts(postsData || [])
    setFriendships(friendshipsData || [])
    const rsvpMap = {}
    ;(rsvpData || []).forEach(r => { rsvpMap[r.event_id] = r.status })
    setRsvps(rsvpMap)
    setLoading(false)
  }

  // Friendship helpers
  const getFriendship = (memberId) =>
    friendships.find(x =>
      (x.sender_id === profile.id && x.receiver_id === memberId) ||
      (x.sender_id === memberId && x.receiver_id === profile.id)
    )

  async function sendRequest(memberId) {
    const { data } = await supabase
      .from('friendships')
      .insert({ sender_id: profile.id, receiver_id: memberId, status: 'pending' })
      .select().single()
    if (data) setFriendships(f => [...f, data])
  }

  async function cancelRequest(memberId) {
    await supabase.from('friendships').delete()
      .eq('sender_id', profile.id).eq('receiver_id', memberId)
    setFriendships(f => f.filter(x => !(x.sender_id === profile.id && x.receiver_id === memberId)))
  }

  async function acceptRequest(senderId) {
    await supabase.from('friendships').update({ status: 'accepted' })
      .eq('sender_id', senderId).eq('receiver_id', profile.id)
    setFriendships(f =>
      f.map(x => (x.sender_id === senderId && x.receiver_id === profile.id ? { ...x, status: 'accepted' } : x))
    )
  }

  async function removeFriend(memberId) {
    await supabase.from('friendships').delete()
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${memberId}),and(sender_id.eq.${memberId},receiver_id.eq.${profile.id})`)
    setFriendships(f => f.filter(x =>
      !((x.sender_id === profile.id && x.receiver_id === memberId) ||
        (x.sender_id === memberId && x.receiver_id === profile.id))
    ))
  }

  // RSVP helper
  async function setRsvp(eventId, status) {
    const current = rsvps[eventId]
    if (current === status) {
      await supabase.from('rsvps').delete().eq('event_id', eventId).eq('user_id', profile.id)
      setRsvps(r => { const n = { ...r }; delete n[eventId]; return n })
    } else {
      await supabase.from('rsvps').upsert({ event_id: eventId, user_id: profile.id, status }, { onConflict: 'event_id,user_id' })
      setRsvps(r => ({ ...r, [eventId]: status }))
    }
  }

  const tabs = [
    { key: 'events', label: 'Etkinlikler', count: events.length },
    { key: 'posts', label: 'Gönderiler', count: posts.length },
    { key: 'members', label: 'Üyeler', count: members.length },
  ]

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-5">
        <Link
          to="/sehirler"
          className="inline-flex items-center gap-1 text-xs text-[var(--r-meta)] hover:text-primary-600 mb-3 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Tüm Şehirler
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary-500/[0.15] text-primary-600 rounded-2xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--r-text)]">{cityName}</h1>
            <p className="text-xs text-[var(--r-meta)]">
              {members.length} üye · {events.length} etkinlik · {posts.length} gönderi
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[var(--r-hover)] p-1.5 rounded-2xl mb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            onClick={() => {
              setActiveTab(tab.key)
              setSearchParams({ tab: tab.key })
            }}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === tab.key
                ? 'bg-[var(--r-card)] text-[var(--r-text)] shadow-sm'
                : 'text-[var(--r-meta)] hover:text-[var(--r-text)]'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Members Tab */}
          {activeTab === 'members' && (
            members.length === 0 ? (
              <div className="text-center py-16 text-[var(--r-meta)] text-sm">
                Bu şehirde henüz üye yok.
              </div>
            ) : (
              <div className="space-y-3">
                {members.map(member => {
                  const rel = getFriendship(member.id)
                  const isFriend = rel?.status === 'accepted'
                  const isPendingOut = rel?.status === 'pending' && rel?.sender_id === profile.id
                  const isPendingIn = rel?.status === 'pending' && rel?.sender_id === member.id

                  return (
                    <div key={member.id} className="bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm p-4 flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0 text-primary-600 font-bold text-sm">
                        {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--r-text)] text-sm truncate">{member.full_name}</p>
                        {member.occupation && (
                          <p className="text-xs text-[var(--r-meta)] truncate">{member.occupation}</p>
                        )}
                      </div>
                      {/* Friendship button */}
                      <div className="shrink-0">
                        {isFriend ? (
                          <button
                            onClick={() => removeFriend(member.id)}
                            className="text-xs bg-green-500/10 text-green-600 border border-green-500/20 px-3 py-1.5 rounded-xl font-medium hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-colors"
                          >
                            Arkadaş ✓
                          </button>
                        ) : isPendingIn ? (
                          <button
                            onClick={() => acceptRequest(member.id)}
                            className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-xl font-medium hover:bg-primary-700 transition-colors"
                          >
                            Kabul Et
                          </button>
                        ) : isPendingOut ? (
                          <button
                            onClick={() => cancelRequest(member.id)}
                            className="text-xs bg-[var(--r-hover)] text-[var(--r-meta)] px-3 py-1.5 rounded-xl font-medium hover:bg-[var(--r-border)] transition-colors"
                          >
                            İstek Gönderildi
                          </button>
                        ) : (
                          <button
                            onClick={() => sendRequest(member.id)}
                            className="text-xs bg-primary-500/10 text-primary-600 border border-primary-500/20 px-3 py-1.5 rounded-xl font-medium hover:bg-primary-500/[0.15] transition-colors"
                          >
                            + Arkadaş Ekle
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div>
              <Link
                to={`/etkinlikler?city=${encodeURIComponent(cityName)}&create=true`}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 mb-4 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Etkinlik Oluştur
              </Link>

              {events.length === 0 ? (
                <div className="text-center py-16 text-[var(--r-meta)] text-sm bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] p-4">
                  Bu şehirde henüz etkinlik yok. İlk etkinliği siz oluşturun!
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map(event => {
                    return (
                      <div
                        key={event.id}
                        onClick={() => navigate(`/etkinlikler/${event.id}`)}
                        className="bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm overflow-hidden cursor-pointer hover:border-primary-500/30 hover:shadow-lg hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 ease-out"
                      >
                        {event.cover_image_url && (
                          <img src={event.cover_image_url} alt="" className="w-full h-40 object-cover" />
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-[var(--r-text)] hover:text-primary-600 transition-colors">{event.title}</h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <p className="text-xs text-primary-600 font-medium">{formatDate(event.event_date)}</p>
                                {event.city && (
                                  <span className="text-xs bg-amber-500/[0.15] text-[var(--r-text)] border border-amber-500/25 px-2.5 py-0.5 rounded-full font-semibold">
                                    📍 {event.city}
                                  </span>
                                )}
                                {event.is_private && (
                                  <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    🔒 Özel
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-[var(--r-meta)] mt-2" onClick={e => e.stopPropagation()}>
                                Düzenleyen:{' '}
                                <button
                                  onClick={() => window.showUserProfile && window.showUserProfile(event.created_by)}
                                  className="text-primary-600 hover:underline font-semibold"
                                >
                                  @{event.profiles?.username}
                                </button>
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-end mt-3">
                            <Link 
                              to={`/etkinlikler/${event.id}`} 
                              onClick={e => e.stopPropagation()}
                              className="text-xs text-primary-600 font-semibold hover:underline"
                            >
                              Detaylar →
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
            )}
          </div>
        )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div>
              <button
                onClick={() => setShowCreatePost(true)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 mb-4 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Gönderi Oluştur
              </button>

              {posts.length === 0 ? (
                <div className="text-center py-16 text-[var(--r-meta)] text-sm bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] p-4">
                  Bu şehirde henüz gönderi paylaşılmamış. İlk gönderiyi siz oluşturun!
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <PostCard
                      key={`post-${post.id}`}
                      post={post}
                      onDelete={handleDeletePost}
                      onEdit={handleEditPost}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          defaultCity={cityName}
          onCreated={newPost => setPosts(prev => [newPost, ...prev])}
        />
      )}
    </div>
  )
}
