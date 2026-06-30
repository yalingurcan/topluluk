import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function FloatingChat() {
  const { profile, displayName, canSeeFullProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPartnerId, setSelectedPartnerId] = useState(null)
  const [isNewChatView, setIsNewChatView] = useState(false)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef(null)
  const profileCache = useRef({})

  const isMessagesPage = location.pathname === '/mesajlar'

  // Fetch DM history & Friend list
  useEffect(() => {
    if (!profile?.id || isMessagesPage) return

    fetchData()

    // Realtime channel for direct messages
    const channel = supabase
      .channel('direct-messages-floating')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages'
      }, async (payload) => {
        const msg = payload.new
        if (msg.sender_id === profile.id || msg.receiver_id === profile.id) {
          const [senderProfile, receiverProfile] = await Promise.all([
            resolveProfile(msg.sender_id),
            resolveProfile(msg.receiver_id)
          ])

          const fullMsg = {
            ...msg,
            sender: senderProfile,
            receiver: receiverProfile
          }

          setMessages(prev => {
            if (prev.some(m => m.id === fullMsg.id)) return prev
            return [...prev, fullMsg]
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id])

  // Scroll to bottom when messages or selected conversation changes
  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, selectedPartnerId, isOpen])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  async function resolveProfile(userId) {
    if (profileCache.current[userId]) return profileCache.current[userId]
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, privacy')
        .eq('id', userId)
        .single()
      if (data) {
        profileCache.current[userId] = data
        return data
      }
    } catch (e) {
      console.error('Error resolving profile details in floating chat:', e)
    }
    return { id: userId, full_name: 'Kullanıcı', username: 'kullanici' }
  }

  async function fetchData() {
    try {
      // 1. Fetch DM list
      const { data: dmData } = await supabase
        .from('direct_messages')
        .select('*, sender:profiles!sender_id(id, full_name, username, privacy), receiver:profiles!receiver_id(id, full_name, username, privacy)')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: true })

      setMessages(dmData || [])

      // Seed profile cache with retrieved records
      ;(dmData || []).forEach(m => {
        if (m.sender) profileCache.current[m.sender.id] = m.sender
        if (m.receiver) profileCache.current[m.receiver.id] = m.receiver
      })

      // 2. Fetch friends to support starting a new chat
      const { data: friendshipData } = await supabase
        .from('friendships')
        .select('*, sender:profiles!sender_id(id, full_name, username, privacy), receiver:profiles!receiver_id(id, full_name, username, privacy)')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)

      const resolvedFriends = (friendshipData || []).map(f => {
        return f.sender_id === profile.id ? f.receiver : f.sender
      }).filter(Boolean)

      setFriends(resolvedFriends)
    } catch (e) {
      console.error('Error fetching chat details in floating chat:', e)
    } finally {
      setLoading(false)
    }
  }

  // Group messages by partner ID
  const getConversations = () => {
    const list = {}
    messages.forEach(m => {
      const partner = m.sender_id === profile.id ? m.receiver : m.sender
      if (!partner) return
      const pId = partner.id

      if (!list[pId]) {
        list[pId] = {
          partner,
          lastMessage: m,
          messages: []
        }
      }
      list[pId].lastMessage = m
      list[pId].messages.push(m)
    })

    // Add placeholder active conversation for target partner if they don't have messages yet
    if (selectedPartnerId && !list[selectedPartnerId] && profileCache.current[selectedPartnerId]) {
      list[selectedPartnerId] = {
        partner: profileCache.current[selectedPartnerId],
        lastMessage: { body: 'Henüz mesaj yok. İlk mesajı gönderin!', created_at: new Date().toISOString() },
        messages: []
      }
    }

    return Object.values(list).sort(
      (a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
    )
  }

  const activeConversations = getConversations()
  const selectedConversation = activeConversations.find(c => c.partner.id === selectedPartnerId)
  const activeChatMessages = selectedConversation ? selectedConversation.messages : []
  const activePartner = selectedConversation ? selectedConversation.partner : null

  async function handleSend(e) {
    e.preventDefault()
    if (!inputText.trim() || !selectedPartnerId || sending) return

    // Double-check active friendship status
    const isFriend = friends.some(f => f.id === selectedPartnerId)
    if (!isFriend) {
      alert('Arkadaşınız olmayan birine mesaj göndermek veya isteği yanıtlamak için Mesajlar sayfasına yönlendiriliyorsunuz.')
      navigate(`/mesajlar?user=${selectedPartnerId}`)
      setIsOpen(false)
      return
    }

    setSending(true)
    const textToSend = inputText.trim()
    setInputText('')

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: profile.id,
          receiver_id: selectedPartnerId,
          body: textToSend
        })

      if (error) throw error
    } catch (e) {
      console.error('Failed to send DM in floating chat:', e)
      alert('Mesaj gönderilemedi.')
      setInputText(textToSend)
    } finally {
      setSending(false)
    }
  }

  // Get up to 3 unique active chat partners to display overlapping avatar circles in collapsed state
  const getRecentPartners = () => {
    return activeConversations.slice(0, 3).map(c => c.partner)
  }
  const recentPartners = getRecentPartners()

  // Minimize or expand toggling
  const toggleOpen = (e) => {
    // Only toggle if not clicking action icons
    if (e.target.closest('.action-btn')) return
    setIsOpen(!isOpen)
  }

  const handleMaximize = () => {
    if (selectedPartnerId) {
      navigate(`/mesajlar?user=${selectedPartnerId}`)
    } else {
      navigate('/mesajlar')
    }
    setIsOpen(false)
  }

  if (isMessagesPage) return null

  return (
    <div
      className={`fixed bottom-0 right-4 md:right-8 z-40 bg-[var(--r-card)] border border-[var(--r-border)] rounded-t-2xl flex flex-col transition-all duration-300 ease-in-out ${
        isOpen ? 'h-[460px] w-80 md:w-96' : 'h-12 w-64 md:w-72 cursor-pointer hover:bg-[var(--r-hover)]'
      }`}
      style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)' }}
      onClick={!isOpen ? toggleOpen : undefined}
    >
      
      {/* Collapsed Header */}
      {!isOpen ? (
        <div className="flex-1 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {/* Contact Avatars overlapping */}
            {recentPartners.length > 0 ? (
              <div className="flex -space-x-2 mr-1">
                {recentPartners.map(p => (
                  <div key={p.id} className="w-6 h-6 rounded-full bg-primary-500/10 border-2 border-[var(--r-card)] flex items-center justify-center text-[10px] font-bold text-primary-600">
                    {(canSeeFullProfile(p.id) ? p.full_name : p.username)?.[0]?.toUpperCase()}
                  </div>
                ))}
              </div>
            ) : (
              <svg className="w-5 h-5 text-[var(--r-meta)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            )}
            <span className="text-sm font-semibold text-[var(--r-text)]">Mesajlar</span>
          </div>
          <svg className="w-4 h-4 text-[var(--r-meta)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
        </div>
      ) : (
        /* Expanded View */
        <>
          {/* Header */}
          <div className="h-14 border-b border-[var(--r-border)] flex items-center justify-between px-4 shrink-0 bg-[var(--r-bg)]/30 rounded-t-2xl">
            {selectedPartnerId || isNewChatView ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedPartnerId(null)
                    setIsNewChatView(false)
                  }}
                  className="p-1 hover:bg-[var(--r-hover)] rounded-lg text-[var(--r-meta)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {activePartner ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center border border-primary-500/20 text-xs font-bold text-primary-600">
                      {(canSeeFullProfile(activePartner.id) ? activePartner.full_name : activePartner.username)?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--r-text)] text-xs leading-tight">{displayName(activePartner)}</h4>
                      <p className="text-[9px] text-[var(--r-meta)]">@{activePartner.username}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-[var(--r-text)]">Yeni Sohbet</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--r-text)]">Mesajlar</span>
              </div>
            )}

            {/* Header Actions */}
            <div className="flex items-center gap-1.5">
              {!selectedPartnerId && !isNewChatView && (
                <button
                  onClick={() => setIsNewChatView(true)}
                  className="action-btn p-1.5 text-[var(--r-meta)] hover:text-primary-600 hover:bg-[var(--r-hover)] rounded-lg transition-colors"
                  title="Yeni Sohbet Başlat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleMaximize}
                className="action-btn p-1.5 text-[var(--r-meta)] hover:text-[var(--r-text)] hover:bg-[var(--r-hover)] rounded-lg transition-colors"
                title="Tam Ekran Aç"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="action-btn p-1.5 text-[var(--r-meta)] hover:text-[var(--r-text)] hover:bg-[var(--r-hover)] rounded-lg transition-colors"
                title="Kapat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col bg-[var(--r-card)]">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : isNewChatView ? (
              /* New Chat (Friends) List View */
              <div className="flex-1 flex flex-col p-3 space-y-2">
                <div className="text-[10px] font-bold text-[var(--r-meta)] uppercase px-1 tracking-wider mb-1">Arkadaşlarım</div>
                {friends.length === 0 ? (
                  <div className="text-center text-[var(--r-meta)] text-xs py-10 px-4 leading-relaxed">
                    Sohbet edebilmek için önce üyeler sayfasından arkadaş eklemelisiniz.
                  </div>
                ) : (
                  <div className="space-y-1.5 flex-1 overflow-y-auto">
                    {friends.map(friend => (
                      <button
                        key={friend.id}
                        onClick={() => {
                          // Resolve cache if needed
                          if (!profileCache.current[friend.id]) {
                            profileCache.current[friend.id] = friend
                          }
                          setSelectedPartnerId(friend.id)
                          setIsNewChatView(false)
                        }}
                        className="w-full p-2 rounded-xl hover:bg-primary-500/[0.06] border border-[var(--r-border)] flex items-center gap-2.5 transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center border border-primary-500/20 text-xs font-bold text-primary-600">
                          {(canSeeFullProfile(friend) ? friend.full_name : friend.username)?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-[var(--r-text)] text-xs">{displayName(friend)}</h4>
                          <p className="text-[9px] text-[var(--r-meta)]">@{friend.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : selectedPartnerId ? (
              /* Chat Stream View */
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--r-bg)]/10">
                  {activeChatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[var(--r-meta)] space-y-1 text-center py-8">
                      <span className="text-2xl">👋</span>
                      <p className="text-[11px]">Sohbeti başlatmak için ilk mesajı gönderin!</p>
                    </div>
                  ) : (
                    activeChatMessages.map(msg => {
                      const isMe = msg.sender_id === profile.id
                      const timeStr = new Date(msg.created_at).toLocaleTimeString('tr-TR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })

                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`flex items-end gap-1 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`px-3 py-2 rounded-xl text-xs shadow-sm leading-relaxed ${
                              isMe 
                                ? 'bg-primary-600 text-white rounded-tr-none' 
                                : 'bg-[var(--r-hover)] text-[var(--r-text)] rounded-tl-none border border-[var(--r-border)]'
                            }`}>
                              {msg.body}
                            </div>
                            <span className="text-[8px] text-[var(--r-meta)] select-none pb-0.5 shrink-0">
                              {timeStr}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Footer Input Area */}
                {friends.some(f => f.id === selectedPartnerId) ? (
                  <form onSubmit={handleSend} className="p-2.5 border-t border-[var(--r-border)] flex gap-2 shrink-0 bg-[var(--r-card)]">
                    <input
                      type="text"
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      placeholder="Mesajınızı yazın..."
                      className="flex-1 border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || sending}
                      className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center justify-center"
                    >
                      {sending ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Gönder'
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="p-3 border-t border-[var(--r-border)] bg-[var(--r-bg)] text-center text-[10px] text-[var(--r-meta)] font-medium">
                    🔒 Bu kullanıcıya mesaj göndermek için arkadaş olmalısınız.
                  </div>
                )}
              </div>
            ) : (
              /* Chat Conversations List View */
              <div className="flex-1 divide-y divide-[var(--r-border)] overflow-y-auto">
                {activeConversations.length === 0 ? (
                  <div className="p-8 text-center text-[var(--r-meta)] text-xs leading-relaxed">
                    Aktif sohbetiniz bulunmuyor.<br />
                    <button
                      onClick={() => setIsNewChatView(true)}
                      className="text-primary-600 hover:underline font-semibold mt-1"
                    >
                      Yeni bir sohbet başlatın!
                    </button>
                  </div>
                ) : (
                  activeConversations.map(c => {
                    const timeStr = c.lastMessage.created_at
                      ? new Date(c.lastMessage.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                      : ''

                    return (
                      <button
                        key={c.partner.id}
                        onClick={() => setSelectedPartnerId(c.partner.id)}
                        className="w-full p-3.5 text-left hover:bg-[var(--r-hover)]/50 transition-colors flex gap-2.5 items-center"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0 border border-primary-500/20 text-xs font-bold text-primary-600">
                          {(canSeeFullProfile(c.partner.id) ? c.partner.full_name : c.partner.username)?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h4 className="font-bold text-[var(--r-text)] text-xs truncate">{displayName(c.partner)}</h4>
                            <span className="text-[9px] text-[var(--r-meta)] shrink-0">{timeStr}</span>
                          </div>
                          <p className="text-[11px] text-[var(--r-meta)] truncate">{c.lastMessage.body}</p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
