import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function UserProfileModal() {
  const { profile, displayName, canSeeField, refreshFriendIds } = useAuth()
  const navigate = useNavigate()
  const [userId, setUserId] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [friendship, setFriendship] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    // Expose a global function to trigger the profile modal from anywhere
    window.showUserProfile = (id) => {
      setUserId(id)
      setIsOpen(true)
    }

    return () => {
      delete window.showUserProfile
    }
  }, [])

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile()
    } else {
      setUserProfile(null)
      setFriendship(null)
    }
  }, [isOpen, userId])

  async function fetchUserProfile() {
    setLoading(true)
    try {
      // 1. Fetch target profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      setUserProfile(prof)

      // 2. Fetch friendship status
      if (userId !== profile?.id) {
        const { data: rel } = await supabase
          .from('friendships')
          .select('*')
          .or(`and(sender_id.eq.${profile?.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${profile?.id})`)
          .maybeSingle()
        setFriendship(rel)
      }
    } catch (err) {
      console.error('Error fetching user profile modal data:', err)
    } finally {
      setLoading(false)
    }
  }

  const isSelf = profile?.id === userId

  async function handleSendRequest() {
    if (actionLoading) return
    setActionLoading(true)
    const { data } = await supabase
      .from('friendships')
      .insert({ sender_id: profile.id, receiver_id: userId, status: 'pending' })
      .select()
      .single()
    if (data) {
      setFriendship(data)
    }
    setActionLoading(false)
  }

  async function handleCancelRequest() {
    if (actionLoading) return
    setActionLoading(true)
    await supabase
      .from('friendships')
      .delete()
      .eq('sender_id', profile.id)
      .eq('receiver_id', userId)
    setFriendship(null)
    setActionLoading(false)
  }

  async function handleAcceptRequest() {
    if (actionLoading) return
    setActionLoading(true)
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('sender_id', userId)
      .eq('receiver_id', profile.id)
    setFriendship(prev => prev ? { ...prev, status: 'accepted' } : null)
    setActionLoading(false)
    refreshFriendIds()
  }

  async function handleRemoveFriend() {
    if (!confirm('Bu arkadaşlığı sonlandırmak istediğinize emin misiniz?')) return
    if (actionLoading) return
    setActionLoading(true)
    await supabase
      .from('friendships')
      .delete()
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${profile.id})`)
    setFriendship(null)
    setActionLoading(false)
    refreshFriendIds()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200">
      <div className="bg-[var(--r-card)] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-[var(--r-border)] flex items-center justify-between shrink-0 bg-[var(--r-bg)]/50">
          <h3 className="font-bold text-[var(--r-text)] text-base">Üye Profili</h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-[var(--r-meta)] hover:text-[var(--r-text)] p-1.5 rounded-xl hover:bg-[var(--r-hover)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !userProfile ? (
            <p className="text-center text-[var(--r-meta)] text-sm py-12">Üye bulunamadı.</p>
          ) : (
            <>
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 border-b border-[var(--r-border)] pb-4">
                <div className="w-14 h-14 rounded-full bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shrink-0">
                  <span className="text-xl font-bold text-primary-600">
                    {canSeeField(userProfile, 'full_name') ? userProfile.full_name?.[0]?.toUpperCase() : userProfile.username?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-[var(--r-text)] text-base truncate">
                    {displayName(userProfile)}
                  </h2>
                  <p className="text-xs text-[var(--r-meta)] truncate">@{userProfile.username}</p>
                </div>
              </div>

              {/* Profile Stats / Fields — city & occupation are public, each other field follows its own privacy setting */}
              <div className="space-y-3.5 text-sm text-[var(--r-text)]">
                <div className="flex items-center justify-between border-b border-[var(--r-border)] pb-2">
                  <span className="text-[var(--r-meta)] text-xs">📍 ŞEHİR</span>
                  <span className="font-semibold text-[var(--r-text)]">{userProfile.city || 'Belirtilmemiş'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--r-border)] pb-2">
                  <span className="text-[var(--r-meta)] text-xs">💼 MESLEK</span>
                  <span className="font-semibold text-[var(--r-text)]">{userProfile.occupation || 'Belirtilmemiş'}</span>
                </div>

                {canSeeField(userProfile, 'age') && userProfile.age && (
                  <div className="flex items-center justify-between border-b border-[var(--r-border)] pb-2">
                    <span className="text-[var(--r-meta)] text-xs">📅 YAŞ</span>
                    <span className="font-semibold text-[var(--r-text)]">{userProfile.age}</span>
                  </div>
                )}
                {canSeeField(userProfile, 'gender') && userProfile.gender && (
                  <div className="flex items-center justify-between border-b border-[var(--r-border)] pb-2">
                    <span className="text-[var(--r-meta)] text-xs">👤 CİNSİYET</span>
                    <span className="font-semibold text-[var(--r-text)]">{userProfile.gender}</span>
                  </div>
                )}
                {(canSeeField(userProfile, 'marital_status') || canSeeField(userProfile, 'children_count')) &&
                  (userProfile.marital_status || userProfile.children_count !== undefined) && (
                  <div className="flex items-center justify-between border-b border-[var(--r-border)] pb-2">
                    <span className="text-[var(--r-meta)] text-xs">👪 AİLE DURUMU</span>
                    <span className="font-semibold text-[var(--r-text)]">
                      {[
                        userProfile.marital_status,
                        userProfile.children_count > 0 ? `${userProfile.children_count} Çocuklu` : (userProfile.children_count === 0 ? 'Çocuksuz' : null)
                      ].filter(Boolean).join(' | ')}
                    </span>
                  </div>
                )}
                {canSeeField(userProfile, 'hobbies') && userProfile.hobbies && (
                  <div className="flex flex-col gap-1 border-b border-[var(--r-border)] pb-2">
                    <span className="text-[var(--r-meta)] text-xs">🎨 HOBİLER</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {userProfile.hobbies.split(',').map((h, i) => (
                        <span key={i} className="text-[11px] bg-primary-500/10 text-primary-600 px-2.5 py-0.5 rounded-full font-medium">{h.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
                {canSeeField(userProfile, 'interests') && userProfile.interests && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[var(--r-meta)] text-xs">✨ İLGİ ALANLARI</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {userProfile.interests.split(',').map((it, i) => (
                        <span key={i} className="text-[11px] bg-primary-500/[0.07] text-primary-500 px-2.5 py-0.5 rounded-full font-medium">{it.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
                {['age', 'gender', 'marital_status', 'hobbies', 'interests'].some(f => !canSeeField(userProfile, f)) && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                    <span className="text-xl">🔒</span>
                    <h4 className="font-bold text-amber-600 text-xs mt-2">Bazı Bilgiler Gizli</h4>
                    <p className="text-[11px] text-amber-500 mt-1 leading-relaxed">
                      Bu üye bazı bilgilerini sadece arkadaşlarına veya yakın arkadaşlarına açmış.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!isSelf && (
                <div className="flex gap-2 pt-4 border-t border-[var(--r-border)] mt-6 flex-wrap shrink-0">
                  {/* Friendship Action Button */}
                  {!friendship ? (
                    <button
                      onClick={handleSendRequest}
                      disabled={actionLoading}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition-colors"
                    >
                      Arkadaş Ekle
                    </button>
                  ) : friendship.status === 'pending' && friendship.sender_id === profile.id ? (
                    <button
                      onClick={handleCancelRequest}
                      disabled={actionLoading}
                      className="flex-1 bg-[var(--r-hover)] hover:bg-[var(--r-border)] disabled:opacity-50 text-[var(--r-text)] font-bold py-2 rounded-xl text-xs transition-colors"
                    >
                      İsteği İptal Et
                    </button>
                  ) : friendship.status === 'pending' && friendship.receiver_id === profile.id ? (
                    <button
                      onClick={handleAcceptRequest}
                      disabled={actionLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition-colors"
                    >
                      İsteği Kabul Et
                    </button>
                  ) : (
                    <button
                      onClick={handleRemoveFriend}
                      disabled={actionLoading}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/[0.15] disabled:opacity-50 text-red-500 font-bold py-2 rounded-xl text-xs transition-colors"
                    >
                      Arkadaşlıktan Çıkar
                    </button>
                  )}

                  {/* Send Message Button */}
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      navigate(`/mesajlar?user=${userId}`)
                    }}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Mesaj Gönder
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
