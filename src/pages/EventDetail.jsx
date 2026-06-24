import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function formatDate(dt) {
  return new Date(dt).toLocaleString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function EventDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [rsvps, setRsvps] = useState([])
  const [myRsvp, setMyRsvp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    const [{ data: ev }, { data: allRsvps }] = await Promise.all([
      supabase.from('events').select('*, profiles(full_name)').eq('id', id).single(),
      supabase.from('rsvps').select('*, profiles(full_name)').eq('event_id', id)
    ])
    setEvent(ev)
    setForm({ title: ev?.title, description: ev?.description, location: ev?.location, event_date: ev?.event_date?.slice(0, 16), cover_image_url: ev?.cover_image_url || '' })
    setRsvps(allRsvps || [])
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
        return [...filtered, { event_id: id, user_id: profile.id, status, profiles: { full_name: profile.full_name } }]
      })
      setMyRsvp(status)
    }
  }

  async function handleSave() {
    await supabase.from('events').update(form).eq('id', id)
    setEvent(ev => ({ ...ev, ...form }))
    setEditMode(false)
  }

  async function handleDelete() {
    if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return
    await supabase.from('events').delete().eq('id', id)
    navigate('/etkinlikler')
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!event) return <div className="text-center py-12 text-gray-400">Etkinlik bulunamadı.</div>

  const going = rsvps.filter(r => r.status === 'going')
  const maybe = rsvps.filter(r => r.status === 'maybe')
  const notgoing = rsvps.filter(r => r.status === 'notgoing')
  const canEdit = profile?.is_admin || profile?.id === event.created_by

  const rsvpOptions = [
    { status: 'going', label: 'Katılıyorum', color: 'green', count: going.length },
    { status: 'maybe', label: 'Belki', color: 'yellow', count: maybe.length },
    { status: 'notgoing', label: 'Katılmıyorum', color: 'red', count: notgoing.length },
  ]

  return (
    <div>
      <Link to="/etkinlikler" className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Etkinlikler
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {event.cover_image_url && !editMode && (
          <img src={event.cover_image_url} alt="" className="w-full h-48 object-cover" />
        )}
        <div className="p-5">
          {editMode ? (
            <div className="space-y-3">
              {[
                { key: 'title', label: 'Başlık', type: 'text' },
                { key: 'event_date', label: 'Tarih ve Saat', type: 'datetime-local' },
                { key: 'location', label: 'Konum', type: 'text' },
                { key: 'cover_image_url', label: 'Kapak Görseli URL', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">{label}</label>
                  <input
                    type={type}
                    value={form[key] || ''}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Açıklama</label>
                <textarea
                  value={form.description || ''}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl text-sm font-medium">Kaydet</button>
                <button onClick={() => setEditMode(false)} className="px-4 py-2.5 border rounded-xl text-sm text-gray-600">İptal</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
                {canEdit && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditMode(true)} className="p-1.5 text-gray-400 hover:text-primary-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <p className="text-primary-600 font-medium text-sm mt-2">{formatDate(event.event_date)}</p>
              {event.location && <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>}
              {event.description && <p className="text-gray-600 text-sm mt-3 leading-relaxed">{event.description}</p>}
              <p className="text-xs text-gray-400 mt-3">Düzenleyen: {event.profiles?.full_name}</p>
            </>
          )}
        </div>
      </div>

      {!editMode && (
        <>
          <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Katılım Durumu</h2>
            <div className="flex gap-2 flex-wrap">
              {rsvpOptions.map(({ status, label, color, count }) => (
                <button
                  key={status}
                  onClick={() => setRsvpStatus(status)}
                  className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium transition-colors border ${
                    myRsvp === status
                      ? color === 'green' ? 'bg-green-50 text-green-700 border-green-200'
                      : color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {label}
                  <span className="bg-white/60 text-xs px-1.5 py-0.5 rounded-full">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {going.length > 0 && (
            <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h2 className="font-semibold text-gray-900 text-sm mb-3">Katılanlar ({going.length})</h2>
              <div className="flex flex-wrap gap-2">
                {going.map(r => (
                  <span key={r.user_id} className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full">
                    {r.profiles?.full_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {maybe.length > 0 && (
            <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h2 className="font-semibold text-gray-900 text-sm mb-3">Belki Katılanlar ({maybe.length})</h2>
              <div className="flex flex-wrap gap-2">
                {maybe.map(r => (
                  <span key={r.user_id} className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">
                    {r.profiles?.full_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
