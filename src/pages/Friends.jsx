import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Friends() {
  const { profile } = useAuth()
  const [friendships, setFriendships] = useState([])
  const [friendProfiles, setFriendProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active') // 'active' or 'requests'

  useEffect(() => {
    fetchFriendsData()
  }, [])

  async function fetchFriendsData() {
    setLoading(true)
    const { data: rels } = await supabase
      .from('friendships')
      .select('*')
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)

    if (!rels || rels.length === 0) {
      setFriendships([])
      setFriendProfiles({})
      setLoading(false)
      return
    }

    const ids = rels.map(r => (r.sender_id === profile.id ? r.receiver_id : r.sender_id))
    const { data: profs } = await supabase
      .from('profiles')
      .select('*')
      .in('id', ids)

    const profMap = {}
    profs?.forEach(p => {
      profMap[p.id] = p
    })

    setFriendships(rels)
    setFriendProfiles(profMap)
    setLoading(false)
  }

  async function acceptRequest(senderId) {
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('sender_id', senderId)
      .eq('receiver_id', profile.id)

    setFriendships(f =>
      f.map(x => (x.sender_id === senderId && x.receiver_id === profile.id ? { ...x, status: 'accepted' } : x))
    )
  }

  async function deleteFriendship(memberId) {
    await supabase
      .from('friendships')
      .delete()
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${memberId}),and(sender_id.eq.${memberId},receiver_id.eq.${profile.id})`)

    setFriendships(f =>
      f.filter(
        x =>
          !(
            (x.sender_id === profile.id && x.receiver_id === memberId) ||
            (x.sender_id === memberId && x.receiver_id === profile.id)
          )
      )
    )
  }

  const incomingRequests = friendships.filter(x => x.status === 'pending' && x.receiver_id === profile.id)
  const activeFriends = friendships.filter(x => x.status === 'accepted')

  return (
    <div className="pb-8">
      <h1 className="text-xl font-bold text-[var(--r-text)] mb-4">Arkadaşlarım</h1>

      {/* Tabs */}
      <div className="flex bg-[var(--r-hover)] p-1.5 rounded-2xl mb-4">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'active' ? 'bg-[var(--r-card)] text-[var(--r-text)] shadow-sm' : 'text-[var(--r-meta)] hover:text-[var(--r-text)]'
          }`}
        >
          Arkadaşlar ({activeFriends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl transition-all relative ${
            activeTab === 'requests' ? 'bg-[var(--r-card)] text-[var(--r-text)] shadow-sm' : 'text-[var(--r-meta)] hover:text-[var(--r-text)]'
          }`}
        >
          İstekler ({incomingRequests.length})
          {incomingRequests.length > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
              {incomingRequests.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'requests' ? (
        <div className="space-y-3">
          {incomingRequests.length === 0 ? (
            <div className="text-center py-16 text-[var(--r-meta)] bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] p-8">
              <p className="text-sm">Gelen arkadaşlık isteği bulunmuyor.</p>
            </div>
          ) : (
            incomingRequests.map(r => {
              const senderId = r.sender_id
              const senderProfile = friendProfiles[senderId] || {}
              return (
                <div key={r.sender_id} className="bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm p-4 flex items-center justify-between hover:bg-[var(--r-hover)] transition-colors duration-150">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0 border border-primary-500/20">
                      <span className="text-sm font-bold text-primary-600">{senderProfile.full_name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-[var(--r-text)] text-sm truncate">{senderProfile.full_name}</h3>
                      <p className="text-[11px] text-[var(--r-meta)] truncate">📍 {senderProfile.city} | 💼 {senderProfile.occupation}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => acceptRequest(senderId)}
                      className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                      Kabul Et
                    </button>
                    <button
                      onClick={() => deleteFriendship(senderId)}
                      className="bg-[var(--r-hover)] hover:bg-red-500/10 hover:text-red-500 text-[var(--r-meta)] text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                    >
                      Yoksay
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {activeFriends.length === 0 ? (
            <div className="text-center py-16 text-[var(--r-meta)] bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] p-8">
              <p className="text-sm">Henüz arkadaşınız bulunmuyor. Üyeler sayfasından arkadaş ekleyebilirsiniz.</p>
            </div>
          ) : (
            activeFriends.map(f => {
              const friendId = f.sender_id === profile.id ? f.receiver_id : f.sender_id
              const friendProfile = friendProfiles[friendId] || {}
              return (
                <div key={friendId} className="bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm p-4 flex items-center justify-between hover:bg-[var(--r-hover)] transition-colors duration-150">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0 border border-primary-500/20">
                      <span className="text-sm font-bold text-primary-600">{friendProfile.full_name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-[var(--r-text)] text-sm truncate">{friendProfile.full_name}</h3>
                      <p className="text-[11px] text-[var(--r-meta)] truncate">📍 {friendProfile.city} | 💼 {friendProfile.occupation}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center ml-3 shrink-0">
                    <Link
                      to={`/mesajlar?user=${friendId}`}
                      className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Mesaj Gönder
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(`${friendProfile.full_name} isimli üyeyi arkadaşlarınızdan çıkarmak istediğinize emin misiniz?`)) {
                          deleteFriendship(friendId)
                        }
                      }}
                      className="bg-[var(--r-card)] hover:bg-red-500/10 text-[var(--r-meta)] hover:text-red-500 border border-[var(--r-border)] hover:border-red-500/20 text-xs font-medium px-3.5 py-2 rounded-xl transition-colors"
                    >
                      Çıkar
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
