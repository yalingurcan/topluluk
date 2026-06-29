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
      supabase.from('events').select('*, profiles!created_by(full_name, username)').order('event_date', { ascending: true }),
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
      .select('*, profiles!created_by(full_name, username)')
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
          <h1 className="text-xl font-bold text-[var(--r-text)]">Etkinlikler</h1>
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
          className="flex items-center justify-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Etkinlik Oluştur
        </button>
      </div>

      {viewMode === 'map' && !loading && events.length > 0 && (
        <div className="mb-4">
          <EventMap events={events} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-[var(--r-meta)] text-sm">Henüz etkinlik yok.</div>
      ) : (
        <div className="space-y-4">
          {events.map(ev => (
            <div
              key={ev.id}
              onClick={() => navigate(`/etkinlikler/${ev.id}`)}
              className="bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm overflow-hidden cursor-pointer border-l-4 border-l-primary-500 hover:bg-[var(--r-hover)] transition-colors duration-150"
            >
              {ev.cover_image_url && (
                <img src={ev.cover_image_url} alt="" className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] bg-primary-500/10 text-primary-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Etkinlik
                  </span>
                  {ev.is_private && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      Özel
                    </span>
                  )}
                  <span className="text-xs text-[var(--r-meta)]">
                    {new Date(ev.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} eklendi
                  </span>
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
                    Katıl ve Detaylar →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
