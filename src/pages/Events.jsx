import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import LocationInput from '../components/LocationInput'
import EventMap from '../components/EventMap'
import { CITIES } from '../components/AutocompleteInput'

function formatDate(dt) {
  return new Date(dt).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Events() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultCity = searchParams.get('city') || ''

  const [events, setEvents] = useState([])
  const [rsvps, setRsvps] = useState({})
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', location: '', city: defaultCity || '', datetime: '', is_private: false })
  const [viewMode, setViewMode] = useState('list')
  const [copiedId, setCopiedId] = useState(null)
  const [feedTab, setFeedTab] = useState('upcoming')

  useEffect(() => {
    // If defaultCity is changed, update the form city too
    if (defaultCity) {
      setForm(f => ({ ...f, city: defaultCity }))
    }
  }, [defaultCity])

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreate(true)
    }
  }, [searchParams])

  useEffect(() => { fetchData() }, [])

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

  async function fetchData() {
    const [{ data: ev }, { data: myRsvps }] = await Promise.all([
      supabase.from('events').select('*, profiles!created_by(full_name, username, privacy)').order('event_date', { ascending: true }),
      supabase.from('rsvps').select('event_id, status').eq('user_id', profile.id)
    ])
    setEvents(ev || [])
    const map = {}
    ;(myRsvps || []).forEach(r => { map[r.event_id] = r.status })
    setRsvps(map)
    setLoading(false)
  }

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

  async function handleCreate(e) {
    e.preventDefault()
    setCreateError('')
    if (!form.datetime) { setCreateError('Tarih ve saat zorunludur.'); return }
    setCreating(true)
    const event_date = `${form.datetime}:00`
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: form.title,
        description: form.description || null,
        location: form.location || null,
        city: form.city || null,
        event_date,
        is_private: form.is_private,
        created_by: profile.id
      })
      .select('*, profiles!created_by(full_name, username, privacy)')
      .single()
    setCreating(false)
    if (error) { setCreateError(error.message); return }
    if (data) setEvents(ev => [data, ...ev].sort((a, b) => new Date(a.event_date) - new Date(b.event_date)))
    setForm({ title: '', description: '', location: '', city: '', datetime: '', is_private: false })
    setShowCreate(false)
  }

  async function handleDelete(eventId) {
    if (!confirm('Bu etkinligi silmek istediginize emin misiniz?')) return
    await supabase.from('events').delete().eq('id', eventId)
    setEvents(ev => ev.filter(e => e.id !== eventId))
  }

  const rsvpOptions = [
    { status: 'going', label: 'Katılıyorum', color: 'green' },
    { status: 'notgoing', label: 'Katılmıyorum', color: 'red' },
  ]

  return (
    <div className="pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-[var(--r-text)]">Etkinlikler</h1>
          <div className="flex bg-[var(--r-hover)]/80 rounded-xl p-0.5 border border-[var(--r-border)]/50">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                viewMode === 'list' 
                  ? 'bg-[var(--r-card)] text-[var(--r-text)] shadow-sm' 
                  : 'text-[var(--r-meta)] hover:text-[var(--r-text)]'
              }`}
            >
              Liste
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                viewMode === 'map' 
                  ? 'bg-[var(--r-card)] text-[var(--r-text)] shadow-sm' 
                  : 'text-[var(--r-meta)] hover:text-[var(--r-text)]'
              }`}
            >
              Harita
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-1.5 border border-primary-500/40 text-primary-600 hover:bg-primary-500/[0.06] px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Etkinlik Oluştur
        </button>
      </div>

      {/* Feed tabs */}
      {!loading && (
        <div className="flex border-b border-[var(--r-border)] mb-4">
          {[
            { key: 'upcoming', label: 'Yaklaşan' },
            { key: 'going', label: 'Katılacaklarım' },
            { key: 'past', label: 'Geçmiş' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFeedTab(tab.key)}
              className={`flex-1 text-center py-2.5 text-sm font-semibold border-b-2 transition-all ${
                feedTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-[var(--r-meta)] hover:text-[var(--r-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {viewMode === 'map' && !loading && events.length > 0 && (
        <div className="mb-4">
          <EventMap events={events} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (() => {
        const now = new Date()
        let filtered = events

        if (feedTab === 'upcoming') {
          filtered = events.filter(ev => new Date(ev.event_date) >= now)
        } else if (feedTab === 'going') {
          filtered = events.filter(ev => new Date(ev.event_date) >= now && rsvps[ev.id] === 'going')
        } else if (feedTab === 'past') {
          filtered = events
            .filter(ev => new Date(ev.event_date) < now)
            .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
        }

        if (filtered.length === 0) {
          const emptyMessages = {
            upcoming: { title: 'Yaklaşan etkinlik yok', sub: 'İlk etkinliği sen oluştur.' },
            going: { title: 'Katılacağın etkinlik yok', sub: 'Etkinlikleri inceleyip "Katılıyorum" de.' },
            past: { title: 'Geçmiş etkinlik yok', sub: 'Geçmiş etkinlikler burada görünür.' },
          }
          const msg = emptyMessages[feedTab]
          return (
            <div className="text-center py-20 text-[var(--r-meta)] bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)]">
              <svg className="w-10 h-10 mx-auto mb-3 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium">{msg.title}</p>
              <p className="text-xs mt-1 opacity-70">{msg.sub}</p>
              {feedTab === 'upcoming' && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-colors"
                >
                  Etkinlik Oluştur
                </button>
              )}
            </div>
          )
        }

        return (
          <div className="space-y-4">
            {filtered.map(ev => {
              const isPast = new Date(ev.event_date) < now
              const myStatus = rsvps[ev.id]
              return (
                <div
                  key={ev.id}
                  onClick={() => navigate(`/etkinlikler/${ev.id}`)}
                  className={`bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm overflow-hidden cursor-pointer border-l-4 hover:bg-[var(--r-hover)] transition-colors duration-150 ${
                    isPast ? 'border-l-[var(--r-border)] opacity-80' : 'border-l-primary-500'
                  }`}
                >
                  {ev.cover_image_url && (
                    <img src={ev.cover_image_url} alt="" className="w-full h-40 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {isPast ? (
                        <span className="text-[10px] bg-[var(--r-hover)] text-[var(--r-meta)] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-[var(--r-border)]">
                          Geçmiş
                        </span>
                      ) : (
                        <span className="text-[10px] bg-primary-500/10 text-primary-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Etkinlik
                        </span>
                      )}
                      {ev.is_private && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          Özel
                        </span>
                      )}
                      {myStatus === 'going' && (
                        <span className="text-[10px] bg-green-500/10 text-green-600 border border-green-500/20 px-2 py-0.5 rounded-full font-bold">
                          ✓ {isPast ? 'Katıldım' : 'Katılıyorum'}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-[var(--r-text)] text-sm">{ev.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-xs text-primary-600 font-medium">📅 {formatDate(ev.event_date)}</p>
                      {ev.city && (
                        <span className="text-xs bg-amber-500/10 text-[var(--r-text)] border border-amber-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                          📍 {ev.city}
                        </span>
                      )}
                    </div>
                    {ev.location && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-[var(--r-meta)] hover:text-primary-600 hover:underline mt-0.5 inline-flex items-center gap-1"
                      >
                        📍 {ev.location}
                      </a>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--r-border)]">
                      <p className="text-[11px] text-[var(--r-meta)]" onClick={e => e.stopPropagation()}>
                        Düzenleyen:{' '}
                        <button
                          onClick={() => window.showUserProfile && window.showUserProfile(ev.created_by)}
                          className="text-primary-600 hover:underline font-semibold"
                        >
                          @{ev.profiles?.username}
                        </button>
                      </p>
                      <Link
                        to={`/etkinlikler/${ev.id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-primary-600 font-medium hover:underline"
                      >
                        {isPast ? 'Detaylar →' : 'Katıl ve Detaylar →'}
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-[var(--r-card)] w-full md:max-w-lg md:rounded-2xl rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto pb-24 md:pb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[var(--r-text)]">Yeni Etkinlik</h2>
              <button onClick={() => setShowCreate(false)} className="text-[var(--r-meta)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Baslik *</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Etkinlik adı"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Tarih ve Saat *</label>
                <input
                  required
                  type="datetime-local"
                  value={form.datetime}
                  onChange={e => setForm(f => ({ ...f, datetime: e.target.value }))}
                  className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">
                  Şehir * {defaultCity && <span className="text-[var(--r-meta)] font-normal">(Kilitli)</span>}
                </label>
                <select
                  required
                  disabled={!!defaultCity}
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value, location: '' }))}
                  className={`w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    defaultCity ? 'text-[var(--r-meta)] cursor-not-allowed font-medium' : ''
                  }`}
                >
                  <option value="">Şehir seçin</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Konum *</label>
                <LocationInput
                  disabled={!form.city}
                  cityName={form.city}
                  value={form.location}
                  onChange={val => setForm(f => ({ ...f, location: val }))}
                  placeholder={form.city ? `${form.city} içinde adres veya mekan adı...` : 'Lütfen önce şehir seçin'}
                  className={`w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    !form.city ? 'text-[var(--r-meta)] cursor-not-allowed' : ''
                  }`}
                />
                <span className="text-[10px] text-[var(--r-meta)] mt-1 block">
                  İpucu: Yazdığınız konum Google Haritalar linkine dönüştürülecektir.
                </span>
              </div>
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="is_private"
                  checked={form.is_private}
                  onChange={e => setForm(f => ({ ...f, is_private: e.target.checked }))}
                  className="rounded border-[var(--r-input-border)] text-primary-600 focus:ring-primary-500 h-4 w-4"
                />
                <label htmlFor="is_private" className="text-xs font-medium text-[var(--r-text)] select-none">
                  Sadece arkadaşlarıma özel (Gizli Etkinlik)
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Açıklama</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Etkinlik hakkında bilgi..."
                />
              </div>
              {createError && <div className="bg-red-500/10 text-red-500 text-xs px-3 py-2 rounded-lg">{createError}</div>}
              <button type="submit" disabled={creating} className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-medium text-sm disabled:opacity-60">
                {creating ? 'Oluşturuluyor...' : 'Etkinlik Oluştur'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
