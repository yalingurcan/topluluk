import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function Section({ title, children }) {
  return (
    <div className="bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-[var(--r-border)] bg-[var(--r-bg)]/50">
        <h2 className="font-semibold text-[var(--r-text)] text-sm">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export default function Admin() {
  const [pending, setPending] = useState([])
  const [members, setMembers] = useState([])
  const [rejected, setRejected] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: p }, { data: m }, { data: r }] = await Promise.all([
      supabase.from('profiles').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('status', 'approved').order('full_name'),
      supabase.from('profiles').select('*').eq('status', 'rejected').order('created_at', { ascending: false })
    ])
    setPending(p || [])
    setMembers(m || [])
    setRejected(r || [])
    setLoading(false)
  }

  async function approveUser(userId) {
    await supabase.from('profiles').update({ status: 'approved' }).eq('id', userId)

    let user = pending.find(u => u.id === userId)
    if (!user) user = rejected.find(u => u.id === userId)

    setPending(p => p.filter(u => u.id !== userId))
    setRejected(r => r.filter(u => u.id !== userId))

    if (user) {
      setMembers(m => [...m, { ...user, status: 'approved' }].sort((a, b) => a.full_name?.localeCompare(b.full_name)))
    }
  }

  async function rejectUser(userId) {
    await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId)
    const user = pending.find(u => u.id === userId)
    setPending(p => p.filter(u => u.id !== userId))
    if (user) {
      setRejected(r => [{ ...user, status: 'rejected' }, ...r])
    }
  }

  async function suspendUser(userId) {
    if (!confirm('Bu kullanıcının hesabını askıya almak istediğinize emin misiniz?')) return
    await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId)
    const user = members.find(u => u.id === userId)
    setMembers(m => m.filter(u => u.id !== userId))
    if (user) {
      setRejected(r => [{ ...user, status: 'rejected' }, ...r])
    }
  }

  async function deleteUser(userId) {
    if (!confirm('Bu kullanıcının profil kaydını veritabanından tamamen silmek istediğinize emin misiniz? (Bu işlem geri alınamaz)')) return
    const { error } = await supabase.rpc('delete_user', { target_user_id: userId })
    if (error) {
      alert('Kullanıcı silinemedi: ' + error.message)
      return
    }
    setPending(p => p.filter(u => u.id !== userId))
    setMembers(m => m.filter(u => u.id !== userId))
    setRejected(r => r.filter(u => u.id !== userId))
  }

  async function toggleAdmin(userId, current) {
    await supabase.from('profiles').update({ is_admin: !current }).eq('id', userId)
    setMembers(m => m.map(u => u.id === userId ? { ...u, is_admin: !current } : u))
  }

  const tabs = [
    { key: 'pending', label: `Bekleyenler (${pending.length})` },
    { key: 'members', label: `Üyeler (${members.length})` },
    { key: 'rejected', label: `Dondurulanlar (${rejected.length})` },
  ]

  return (
    <div className="pb-8">
      <h1 className="text-xl font-bold text-[var(--r-text)] mb-4">Yönetim Paneli</h1>

      <div className="flex gap-2 mb-4 bg-[var(--r-hover)] p-1.5 rounded-2xl">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === t.key ? 'bg-[var(--r-card)] text-[var(--r-text)] shadow-sm' : 'text-[var(--r-meta)] hover:text-[var(--r-text)]'
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
            <p className="text-xs text-[var(--r-meta)] text-center py-4">Bekleyen başvuru yok.</p>
          ) : (
            <div className="space-y-3">
              {pending.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3.5 bg-[var(--r-card)] border border-[var(--r-border)] rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                      <span className="font-bold text-amber-600 text-sm">{u.full_name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[var(--r-text)] truncate">{u.full_name}</p>
                      <p className="text-xs text-[var(--r-meta)] truncate">@{u.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => approveUser(u.id)}
                      className="text-xs bg-green-500/10 hover:bg-green-500/[0.15] text-green-600 px-3.5 py-2 rounded-xl font-semibold transition-colors border border-green-500/20"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => rejectUser(u.id)}
                      className="text-xs bg-amber-500/10 hover:bg-amber-500/[0.15] text-amber-600 px-3 py-2 rounded-xl font-semibold transition-colors border border-amber-500/20"
                    >
                      Reddet
                    </button>
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="text-xs bg-red-500/10 hover:bg-red-500/[0.15] text-red-500 p-2 rounded-xl font-semibold transition-colors border border-red-500/20"
                      title="Komple Sil"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      ) : activeTab === 'rejected' ? (
        <Section title="Dondurulmuş / Reddedilmiş Hesaplar">
          {rejected.length === 0 ? (
            <p className="text-xs text-[var(--r-meta)] text-center py-4">Dondurulmuş hesap yok.</p>
          ) : (
            <div className="space-y-3">
              {rejected.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3.5 bg-[var(--r-card)] border border-[var(--r-border)] rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                      <span className="font-bold text-red-500 text-sm">{u.full_name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[var(--r-text)] truncate">{u.full_name}</p>
                      <p className="text-xs text-[var(--r-meta)] truncate">@{u.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => approveUser(u.id)}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 rounded-xl font-semibold transition-colors"
                    >
                      Aktifleştir (Onayla)
                    </button>
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="text-xs bg-red-500/10 hover:bg-red-500/[0.15] text-red-500 p-2 rounded-xl font-semibold transition-colors border border-red-500/20"
                      title="Komple Sil"
                    >
                      Sil
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
            <p className="text-xs text-[var(--r-meta)] text-center py-4">Henüz onaylı üye yok.</p>
          ) : (
            <div className="space-y-3">
              {members.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3.5 bg-[var(--r-card)] border border-[var(--r-border)] rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0 border border-primary-500/20">
                      <span className="font-bold text-primary-600 text-sm">{u.full_name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-[var(--r-text)] truncate">{u.full_name}</p>
                        {u.is_admin && <span className="text-[9px] bg-primary-500/10 text-primary-600 px-1.5 py-0.5 rounded font-bold uppercase border border-primary-500/20">Yönetici</span>}
                      </div>
                      <p className="text-xs text-[var(--r-meta)] truncate">@{u.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => toggleAdmin(u.id, u.is_admin)}
                      className={`text-xs px-3.5 py-2 rounded-xl font-semibold transition-colors border ${
                        u.is_admin
                          ? 'bg-primary-500/10 text-primary-600 hover:bg-primary-500/[0.15] border-primary-500/20'
                          : 'bg-[var(--r-hover)] text-[var(--r-meta)] hover:bg-[var(--r-border)] border-[var(--r-border)]'
                      }`}
                    >
                      {u.is_admin ? 'Yetki Al' : 'Yönetici Yap'}
                    </button>
                    {!u.is_admin && (
                      <>
                        <button
                          onClick={() => suspendUser(u.id)}
                          className="text-xs bg-amber-500/10 hover:bg-amber-500/[0.15] text-amber-600 px-3.5 py-2 rounded-xl font-semibold transition-colors border border-amber-500/20"
                        >
                          Askıya Al
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="text-xs bg-red-500/10 hover:bg-red-500/[0.15] text-red-500 p-2 rounded-xl font-semibold transition-colors border border-red-500/20"
                          title="Komple Sil"
                        >
                          Sil
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  )
}
