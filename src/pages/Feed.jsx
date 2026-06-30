import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'

function formatEventDate(dt) {
  return new Date(dt).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Feed() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showBanner, setShowBanner] = useState(!localStorage.getItem('hideFeedBanner'))
  const [follows, setFollows] = useState({ cities: [], channels: [] })
  const menuRef = useRef(null)

  useEffect(() => { fetchFeed() }, [])

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    if (showMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  async function fetchFeed() {
    setLoading(true)

    // Fetch followed cities and channels
    const [{ data: followedCities }, { data: followedChannels }] = await Promise.all([
      supabase.from('city_follows').select('city_name').eq('user_id', profile.id),
      supabase.from('channel_follows').select('channel_id').eq('user_id', profile.id)
    ])

    const myCities = (followedCities || []).map(f => f.city_name.toLowerCase())
    const myChannels = (followedChannels || []).map(f => f.channel_id)
    setFollows({ cities: myCities, channels: myChannels })

    // Fetch posts and events
    const [{ data: postsData }, { data: eventsData }] = await Promise.all([
      supabase
        .from('posts')
        .select('*, profiles(full_name, username), channels(name, city)')
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('events')
        .select('*, profiles!created_by(full_name, username)')
        .order('created_at', { ascending: false })
        .limit(30)
    ])

    // Filter based on follows (if any follows exist)
    const hasFollows = myCities.length > 0 || myChannels.length > 0

    const filteredPosts = (postsData || []).filter(post => {
      if (!hasFollows) return true // Show all if no follows yet
      
      const channelCity = post.channels?.city?.toLowerCase()
      const isChannelFollowed = myChannels.includes(post.channel_id)
      const isCityFollowed = channelCity && myCities.includes(channelCity)

      return isChannelFollowed || isCityFollowed
    })

    const filteredEvents = (eventsData || []).filter(event => {
      if (!hasFollows) return true // Show all if no follows yet

      const eventCity = event.city?.toLowerCase()
      return eventCity && myCities.includes(eventCity)
    })

    const merged = [
      ...filteredPosts.map(p => ({ ...p, feedType: 'post' })),
      ...filteredEvents.map(e => ({ ...e, feedType: 'event' }))
    ]

    merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    setItems(merged)
    setLoading(false)
  }

  const dismissBanner = () => {
    localStorage.setItem('hideFeedBanner', 'true')
    setShowBanner(false)
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
    <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6">
      {/* Main feed column */}
      <div>
        {showBanner && (
          <div className="bg-primary-500/[0.07] border border-primary-500/20 rounded-2xl p-4 mb-5">
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">📢</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[var(--r-text)] text-sm mb-1">Akışını kişiselleştir</h4>
                <p className="text-xs text-[var(--r-meta)] leading-relaxed">
                  Şehirler ve Konular sayfalarından takip ettiklerini burada görürsün. Henüz takip etmediysen tüm paylaşımlar gösterilir.
                </p>
                <button
                  onClick={dismissBanner}
                  className="mt-3 border border-primary-500/40 text-primary-600 hover:bg-primary-500/10 text-[11px] font-semibold px-4 py-1.5 rounded-xl transition-all"
                >
                  Anladım
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[var(--r-text)]">Ana Sayfa</h1>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(m => !m)}
              className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Paylaş
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-[var(--r-card)] border border-[var(--r-border)] rounded-2xl shadow-xl z-50 overflow-hidden">
                <button
                  onClick={() => { setShowMenu(false); setShowCreate(true) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--r-text)] hover:bg-[var(--r-hover)] transition-colors"
                >
                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Gönderi
                </button>
                <div className="border-t border-[var(--r-border)]" />
                <button
                  onClick={() => { setShowMenu(false); navigate('/etkinlikler?create=true') }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--r-text)] hover:bg-[var(--r-hover)] transition-colors"
                >
                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Etkinlik
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-[var(--r-meta)] bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)]">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-sm font-medium">Henüz paylaşım yok</p>
            <p className="text-xs mt-1 opacity-70">İlk gönderiyi sen yap veya şehir ve konu takip et.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-colors"
            >
              Gönderi Oluştur
            </button>
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
                  <div key={`event-${item.id}`} className="bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm overflow-hidden border-l-4 border-l-primary-500 hover:bg-[var(--r-hover)] transition-colors duration-150">
                    {item.cover_image_url && (
                      <img src={item.cover_image_url} alt="" className="w-full h-40 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] bg-primary-500/10 text-primary-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Etkinlik
                        </span>
                        <span className="text-xs text-[var(--r-meta)]">
                          {new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} eklendi
                        </span>
                      </div>
                      <Link to={`/etkinlikler/${item.id}`}>
                        <h3 className="font-semibold text-[var(--r-text)] hover:text-primary-600 text-sm">{item.title}</h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-xs text-primary-600 font-medium">📅 {formatEventDate(item.event_date)}</p>
                        {item.city && (
                          <span className="text-xs bg-amber-500/10 text-[var(--r-text)] border border-amber-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                            📍 {item.city}
                          </span>
                        )}
                      </div>
                      {item.location && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--r-meta)] hover:text-primary-600 hover:underline mt-0.5 inline-flex items-center gap-1"
                        >
                          📍 {item.location}
                        </a>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--r-border)]">
                        <p className="text-[11px] text-[var(--r-meta)]">
                          Düzenleyen:{' '}
                          <button
                            onClick={() => window.showUserProfile && window.showUserProfile(item.created_by)}
                            className="text-primary-600 hover:underline font-semibold"
                          >
                            @{item.profiles?.username}
                          </button>
                        </p>
                        <Link to={`/etkinlikler/${item.id}`} className="text-xs text-primary-600 font-medium hover:underline">
                          Katıl ve Detaylar →
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              }
            })}
          </div>
        )}
      </div>

      {/* Sidebar — desktop only */}
      <aside className="hidden lg:block space-y-4">
        {/* Quick actions */}
        <div className="bg-[var(--r-card)] border border-[var(--r-border)] rounded-2xl p-4">
          <h3 className="text-xs font-bold text-[var(--r-meta)] uppercase tracking-wider mb-3">Hızlı Erişim</h3>
          <div className="space-y-2">
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--r-text)] hover:bg-[var(--r-hover)] border border-[var(--r-border)] transition-colors text-left"
            >
              <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span className="font-medium">Gönderi paylaş</span>
            </button>
            <button
              onClick={() => navigate('/etkinlikler?create=true')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--r-text)] hover:bg-[var(--r-hover)] border border-[var(--r-border)] transition-colors text-left"
            >
              <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Etkinlik oluştur</span>
            </button>
          </div>
        </div>

        {/* Followed cities */}
        {follows.cities.length > 0 && (
          <div className="bg-[var(--r-card)] border border-[var(--r-border)] rounded-2xl p-4">
            <h3 className="text-xs font-bold text-[var(--r-meta)] uppercase tracking-wider mb-3">Takip Ettiğim Şehirler</h3>
            <div className="space-y-1">
              {follows.cities.map(city => (
                <Link
                  key={city}
                  to={`/sehirler/${encodeURIComponent(city)}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-[var(--r-text)] hover:bg-[var(--r-hover)] transition-colors"
                >
                  <span className="text-primary-500 text-base">📍</span>
                  <span className="font-medium capitalize">{city}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Followed channels */}
        {follows.channels.length > 0 && (
          <div className="bg-[var(--r-card)] border border-[var(--r-border)] rounded-2xl p-4">
            <h3 className="text-xs font-bold text-[var(--r-meta)] uppercase tracking-wider mb-3">Takip Ettiğim Konular</h3>
            <div className="space-y-1">
              {follows.channels.map(channelId => (
                <Link
                  key={channelId}
                  to={`/konular/${channelId}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-[var(--r-text)] hover:bg-[var(--r-hover)] transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                  <span className="font-medium text-xs">Konuya git</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Discover prompt when nothing followed */}
        {follows.cities.length === 0 && follows.channels.length === 0 && !loading && (
          <div className="bg-[var(--r-card)] border border-[var(--r-border)] rounded-2xl p-4">
            <h3 className="text-xs font-bold text-[var(--r-meta)] uppercase tracking-wider mb-2">Keşfet</h3>
            <p className="text-xs text-[var(--r-meta)] leading-relaxed mb-3">Şehir ve konu takip ederek akışını kişiselleştir.</p>
            <div className="space-y-2">
              <Link to="/sehirler" className="block text-center text-xs font-semibold text-primary-600 border border-primary-500/30 rounded-xl py-2 hover:bg-primary-500/5 transition-colors">
                Şehirleri Keşfet
              </Link>
              <Link to="/konular" className="block text-center text-xs font-semibold text-primary-600 border border-primary-500/30 rounded-xl py-2 hover:bg-primary-500/5 transition-colors">
                Konuları Keşfet
              </Link>
            </div>
          </div>
        )}
      </aside>

      {showCreate && (
        <CreatePostModal
          onClose={() => setShowCreate(false)}
          onCreated={post => setItems(items => [{ ...post, feedType: 'post' }, ...items])}
        />
      )}
    </div>
  )
}
