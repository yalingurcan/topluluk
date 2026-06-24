import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function formatDate(dt) {
  return new Date(dt).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Events() {
  const { profile } = useAuth()
  const [events, setEvents] = useState([])
  const [rsvps, setRsvps] = useState({})
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', location: '', event_date: '', cover_image_url: '' })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: ev }, { data: myRsvps }] = await Promise.all([
      supabase.from('events').select('*, profiles(full_name)').order('event_date', { ascending: true }),
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
    const { data } = await supabase
      .from('events')
      .insert({ ...form, created_by: profile.id })
      .select('*, profiles(full_name)')
      .single()
    if (data) setEvents(ev => [data, ...ev])
    setForm({ title: '', description: '', location: '', event_date: '', cover_image_url: '' })
    setShowCreate(false)
  }

  async function handleDelete(eventId) {
    if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return
    await supabase.from('events').delete().eq('id', eventId)
    setEvents(ev => ev.filter(e => e.id !== eventId))
  }

  const rsvpOptions = [
    { status: 'going', label: 'Katılıyorum', color: 'green' },
    { status: 'maybe', label: 'Belki', color: 'yellow' },
    { status: 'notgoing', label: 'Katılmıyorum', color: 'red' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Etkinlikler</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Etkinlik Ekle
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Henüz etkinlik yok.</div>
      ) : (
        <div className="space-y-4">
          {events.map(ev => (
            <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {ev.cover_image_url && (
                <img src={ev.cover_image_url} alt="" className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link to={`/etkinlikler/${ev.id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-primary-600">{ev.title}</h3>
                    </Link>
                    <p className="text-xs text-primary-600 mt-1 font-medium">{formatDate(ev.event_date)}</p>
                    {ev.location && <p className="text-xs text-gray-500 mt-0.5">📍 {ev.location}</p>}
                    {ev.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{ev.description}</p>}
                    <p className="text-xs text-gray-400 mt-2">Düzenleyen: {ev.profiles?.full_name}</p>
                  </div>
                  {(profile?.is_admin || profile?.id === ev.created_by) && (
                    <button onClick={() => handleDelete(ev.id)} className="p-1.5 text-gray-300 hover:text-red-500 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="flex gap-2 mt-3 flex-wrap">
                  {rsvpOptions.map(({ status, label, color }) => (
                    <button
                      key={status}
                      onClick={() => setRsvp(ev.id, status)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${
                        rsvps[ev.id] === status
                          ? color === 'green' ? 'bg-green-50 text-green-700 border-green-200'
                          : color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <Link to={`/etkinlikler/${ev.id}`} className="text-xs text-primary-600 px-3 py-1.5 hover:underline ml-auto">
                    Detaylar →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Yeni Etkinlik</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              {[
                { key: 'title', label: 'Başlık', type: 'text', required: true },
                { key: 'event_date', label: 'Tarih ve Saat', type: 'datetime-local', required: true },
                { key: 'location', label: 'Konum', type: 'text' },
                { key: 'cover_image_url', label: 'Kapak Görseli URL', type: 'url' },
              ].map(({ key, label, type, required }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">{label}</label>
                  <input
                    type={type}
                    required={required}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Açıklama</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-medium text-sm">Etkinlik Oluştur</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
