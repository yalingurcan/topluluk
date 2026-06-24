import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function CreatePostModal({ onClose, onCreated, defaultChannelId = null }) {
  const { profile } = useAuth()
  const [channels, setChannels] = useState([])
  const [form, setForm] = useState({ title: '', body: '', channel_id: defaultChannelId || '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('channels').select('id, name').order('name').then(({ data }) => setChannels(data || []))
  }, [])

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) return
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .insert({
        title: form.title.trim(),
        body: form.body.trim(),
        author_id: profile.id,
        channel_id: form.channel_id || null
      })
      .select('*, profiles(full_name), channels(name)')
      .single()
    if (data) onCreated(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Yeni Gönderi</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Konu</label>
            <select
              value={form.channel_id}
              onChange={set('channel_id')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Konu seçin (isteğe bağlı)</option>
              {channels.map(c => <option key={c.id} value={c.id}>{c.name.toLocaleUpperCase('tr-TR')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Başlık</label>
            <input
              required
              value={form.title}
              onChange={set('title')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Gönderi başlığı"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">İçerik</label>
            <textarea
              required
              value={form.body}
              onChange={set('body')}
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Ne paylaşmak istiyorsunuz?"
            />
          </div>
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
