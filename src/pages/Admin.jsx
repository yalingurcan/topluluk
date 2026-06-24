import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-gray-50 bg-gray-50">
        <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export default function Admin() {
  const [pending, setPending] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from('profiles').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('status', 'approved').order('full_name')
    ])
    setPending(p || [])
    setMembers(m || [])
    setLoading(false)
  }

  async function approveUser(userId) {
    await supabase.from('profiles').update({ status: 'approved' }).eq('id', userId)
    const user = pending.find(u => u.id === userId)
    setPending(p => p.filter(u => u.id !== userId))
    if (user) setMembers(m => [...m, { ...user, status: 'approved' }].sort((a, b) => a.full_name?.localeCompare(b.full_name)))
  }

  async function rejectUser(userId) {
    await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId)
    setPending(p => p.filter(u => u.id !== userId))
  }

  async function toggleAdmin(userId, current) {
    await supabase.from('profiles').update({ is_admin: !current }).eq('id', userId)
    setMembers(m => m.map(u => u.id === userId ? { ...u, is_admin: !current } : u))
  }

  const tabs = [
    { key: 'pending', label: `Bekleyenler (${pending.length})` },
    { key: 'members', label: `Üyeler (${members.length})` },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Yönetim Paneli</h1>

      <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'pending' ? (
        <Section title="Onay Bekleyen Başvurular">
          {pending.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Bekleyen başvuru yok.</p>
          ) : (
            <div className="space-y-3">
              {pending.map(u => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                    <span className="font-bold text-yellow-700 text-sm">{u.full_name?.[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{u.full_name}</p>
                    <p className="text-xs text-gray-400">@{u.username}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => approveUser(u.id)}
                      className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium hover:bg-green-100"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => rejectUser(u.id)}
                      className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100"
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      ) : (
        <Section title="Onaylı Üyeler">
          {members.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Henüz onaylı üye yok.</p>
          ) : (
            <div className="space-y-3">
              {members.map(u => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary-700 text-sm">{u.full_name?.[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-gray-900">{u.full_name}</p>
                      {u.is_admin && <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">Yönetici</span>}
                    </div>
                    <p className="text-xs text-gray-400">@{u.username}</p>
                  </div>
                  <button
                    onClick={() => toggleAdmin(u.id, u.is_admin)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium shrink-0 ${
                      u.is_admin ? 'bg-primary-50 text-primary-700 hover:bg-primary-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {u.is_admin ? 'Yetki Al' : 'Yönetici Yap'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  )
}
