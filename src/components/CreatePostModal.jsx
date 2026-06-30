import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import AutocompleteInput, { CITIES } from './AutocompleteInput'

export default function CreatePostModal({ onClose, onCreated, defaultChannelId = null, defaultCity = '' }) {
  const { profile } = useAuth()
  const [channels, setChannels] = useState([])
  const [selectedParentId, setSelectedParentId] = useState('')
  const [selectedSubId, setSelectedSubId] = useState('')
  const [form, setForm] = useState({ title: '', body: '', city: defaultCity || '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.from('channels')
      .select('id, name, parent_id')
      .is('city', null)
      .order('name')
      .then(({ data }) => {
        const list = data || []
        setChannels(list)
        if (defaultChannelId) {
          const active = list.find(c => c.id === defaultChannelId)
          if (active) {
            if (active.parent_id) {
              setSelectedParentId(active.parent_id)
              setSelectedSubId(active.id)
            } else {
              setSelectedParentId(active.id)
              setSelectedSubId('')
            }
          }
        }
      })
  }, [defaultChannelId])

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) return
    setLoading(true)
    setError(null)
    const finalChannelId = selectedSubId || selectedParentId || null
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: form.title.trim(),
        body: form.body.trim(),
        author_id: profile.id,
        channel_id: finalChannelId,
        city: form.city || null
      })
      .select('*, profiles(full_name, privacy), channels(name)')
      .single()
    setLoading(false)
    if (error) { setError(error.message); return }
    if (data) onCreated(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-[var(--r-card)] w-full md:max-w-lg md:rounded-2xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto pb-24 md:pb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--r-text)]">Yeni Gönderi</h2>
          <button onClick={onClose} className="text-[var(--r-meta)] hover:text-[var(--r-text)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Konu</label>
            <select
              value={selectedParentId}
              onChange={(e) => {
                setSelectedParentId(e.target.value)
                setSelectedSubId('')
              }}
              className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Konu seçin (isteğe bağlı)</option>
              {channels.filter(c => !c.parent_id).map(c => (
                <option key={c.id} value={c.id}>
                  {c.name.toLocaleUpperCase('tr-TR')}
                </option>
              ))}
            </select>
          </div>

          {selectedParentId && channels.some(c => c.parent_id === selectedParentId) && (
            <div>
              <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Alt Konu *</label>
              <select
                required
                value={selectedSubId}
                onChange={(e) => setSelectedSubId(e.target.value)}
                className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Alt konu seçin</option>
                {channels.filter(c => c.parent_id === selectedParentId).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name.toLocaleUpperCase('tr-TR')}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">Başlık</label>
            <input
              required
              value={form.title}
              onChange={set('title')}
              className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Gönderi başlığı"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">
              Şehir {defaultCity && <span className="text-[var(--r-meta)] font-normal">(Kilitli)</span>}
            </label>
            <AutocompleteInput
              value={form.city}
              onChange={(val) => setForm(f => ({ ...f, city: val }))}
              suggestions={CITIES}
              placeholder="Şehir adı yazın... (örn: Mönchengladbach)"
              disabled={!!defaultCity}
              className={`w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                defaultCity ? 'bg-[var(--r-bg)] text-[var(--r-meta)] cursor-not-allowed' : ''
              }`}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--r-text)] mb-1 block">İçerik</label>
            <textarea
              required
              value={form.body}
              onChange={set('body')}
              rows={4}
              className="w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Ne paylaşmak istiyorsunuz?"
            />
          </div>
          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-primary-700 disabled:opacity-60"
          >
            {loading ? 'Gönderiliyor...' : 'Paylaş'}
          </button>
        </form>
      </div>
    </div>
  )
}
