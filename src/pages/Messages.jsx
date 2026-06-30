import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Messages() {
  const { profile, displayName, canSeeFullProfile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const targetUserId = searchParams.get('user')

  const [messages, setMessages] = useState([])
  const [friends, setFriends] = useState([])
  const [messageRequests, setMessageRequests] = useState([])
  const [activeSection, setActiveSection] = useState('chats') // 'chats' or 'requests'
  const [loading, setLoading] = useState(true)
  const [selectedPartnerId, setSelectedPartnerId] = useState(null)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (showNewChatModal) {
      fetchAllUsers()
    }
  }, [showNewChatModal])

  async function fetchAllUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .eq('status', 'approved')
      .neq('id', profile.id)
    
    setAllUsers(data || [])
  }

  const messagesEndRef = useRef(null)
  const profileCache = useRef({})

  // Fetch DM history & Friend list
  useEffect(() => {
    fetchData()

    // Realtime direct messages
    const channel = supabase
      .channel('direct-messages-global')
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

    // Realtime message requests
    const reqChannel = supabase
      .channel('message-requests-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_requests'
      }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(reqChannel)
    }
  }, [profile.id])

  // Handle URL redirect query '?user=USER_ID'
  useEffect(() => {
    if (targetUserId && !loading) {
      handleUrlTargetUser(targetUserId)
    }
  }, [targetUserId, loading, messages, friends])

  // Scroll to bottom when messages or selected conversation changes
  useEffect(() => {
    scrollToBottom()
  }, [messages, selectedPartnerId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function resolveProfile(userId) {
    if (profileCache.current[userId]) return profileCache.current[userId]
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .eq('id', userId)
        .single()
      if (data) {
        profileCache.current[userId] = data
        return data
      }
    } catch (e) {
      console.error('Error resolving profile details:', e)
    }
    return { id: userId, full_name: 'Kullanıcı', username: 'kullanici' }
  }

  async function fetchData() {
    setLoading(true)
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

      // 3. Fetch message requests
      const { data: requestData } = await supabase
        .from('message_requests')
        .select('*')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)

      setMessageRequests(requestData || [])
    } catch (e) {
      console.error('Error fetching chat details:', e)
    } finally {
      setLoading(false)
    }
  }

  const getRequestFor = (partnerId) => {
    return messageRequests.find(r => 
      (r.sender_id === profile.id && r.receiver_id === partnerId) ||
      (r.sender_id === partnerId && r.receiver_id === profile.id)
    )
  }

  const isPartnerAccepted = (partnerId) => {
    if (friends.some(f => f.id === partnerId)) return true
    const req = getRequestFor(partnerId)
    return req && req.status === 'accepted'
  }

  async function handleUrlTargetUser(userId) {
    if (userId === profile.id) {
      setSearchParams({})
      return
    }

    const hasChat = messages.some(m => m.sender_id === userId || m.receiver_id === userId)

    // Force load target user profile if not in cache
    if (!profileCache.current[userId]) {
      const resolved = await resolveProfile(userId)
      if (resolved) {
        profileCache.current[userId] = resolved
      }
    }

    setSelectedPartnerId(userId)
    setSearchParams({})
  }

  // Group messages by partner ID to render conversations sidebar
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

    const allConvs = Object.values(list)

    return allConvs.filter(c => {
      const accepted = isPartnerAccepted(c.partner.id)
      const req = getRequestFor(c.partner.id)

      if (activeSection === 'requests') {
        // Only show pending requests where the current user is the receiver
        return !accepted && req && req.receiver_id === profile.id && req.status === 'pending'
      } else {
        // Show accepted, OR pending requests sent by the current user, OR messages with no request record (fallback)
        const isMyPendingRequest = req && req.sender_id === profile.id && req.status === 'pending'
        const hasNoRequestButHasMessages = !req && c.messages.length > 0
        return accepted || isMyPendingRequest || hasNoRequestButHasMessages
      }
    }).sort(
      (a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
    )
  };

  const activeConversations = getConversations()
  const selectedConversation = activeConversations.find(c => c.partner.id === selectedPartnerId)
  const activeChatMessages = selectedConversation ? selectedConversation.messages : []
  const activePartner = selectedConversation ? selectedConversation.partner : null

  async function handleSend(e) {
    e.preventDefault()
    if (!inputText.trim() || !selectedPartnerId || sending) return

    setSending(true)
    const textToSend = inputText.trim()
    setInputText('')

    try {
      const isFriend = friends.some(f => f.id === selectedPartnerId)
      const existingReq = getRequestFor(selectedPartnerId)

      if (!isFriend && !existingReq) {
        // Create pending request
        await supabase
          .from('message_requests')
          .insert({
            sender_id: profile.id,
            receiver_id: selectedPartnerId,
            status: 'pending'
          })
      }

      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: profile.id,
          receiver_id: selectedPartnerId,
          body: textToSend
        })

      if (error) throw error
      fetchData()
    } catch (e) {
      console.error('Failed to send DM:', e)
      alert('Mesaj gönderilemedi.')
      setInputText(textToSend)
    } finally {
      setSending(false)
    }
  }

  async function handleAcceptRequest(partnerId) {
    const { error } = await supabase
      .from('message_requests')
      .update({ status: 'accepted' })
      .eq('sender_id', partnerId)
      .eq('receiver_id', profile.id)

    if (!error) {
      fetchData()
    }
  }

  async function handleDeclineRequest(partnerId) {
    if (!confirm('Bu mesaj isteğini silmek istediğinize emin misiniz? Tüm mesaj geçmişi silinecektir.')) return

    // 1. Delete request
    await supabase
      .from('message_requests')
      .delete()
      .eq('sender_id', partnerId)
      .eq('receiver_id', profile.id)

    // 2. Delete messages
    await supabase
      .from('direct_messages')
      .delete()
      .or(`and(sender_id.eq.${partnerId},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${partnerId})`)

    setSelectedPartnerId(null)
    fetchData()
  }

  const pendingRequestsCount = messageRequests.filter(r => r.receiver_id === profile.id && r.status === 'pending').length
  const filteredUsers = allUsers.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-[calc(100dvh-160px)] md:h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h1 className="text-xl font-bold text-[var(--r-text)]">Mesajlar</h1>
        <button
          onClick={() => setShowNewChatModal(true)}
          className="bg-primary-500/10 hover:bg-primary-500/[0.15] text-primary-600 px-3.5 py-2 rounded-xl text-xs font-semibold border border-primary-500/20 transition-colors"
        >
          Yeni Sohbet Başlat
        </button>
      </div>

      <div className="flex-1 bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm overflow-hidden flex min-h-0">
        {/* Left Sidebar: Active Conversations List */}
        <div className={`w-full md:w-80 border-r border-[var(--r-border)] flex flex-col shrink-0 ${
          selectedPartnerId ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="flex border-b border-[var(--r-border)] bg-[var(--r-bg)]/40 p-2 gap-1">
            <button
              onClick={() => {
                setActiveSection('chats')
                setSelectedPartnerId(null)
              }}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${
                activeSection === 'chats'
                  ? 'bg-[var(--r-card)] text-[var(--r-text)] shadow-sm border border-[var(--r-border)]'
                  : 'text-[var(--r-meta)] hover:text-[var(--r-text)]'
              }`}
            >
              Sohbetler
            </button>
            <button
              onClick={() => {
                setActiveSection('requests')
                setSelectedPartnerId(null)
              }}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeSection === 'requests'
                  ? 'bg-[var(--r-card)] text-[var(--r-text)] shadow-sm border border-[var(--r-border)]'
                  : 'text-[var(--r-meta)] hover:text-[var(--r-text)]'
              }`}
            >
              <span>İstekler</span>
              {pendingRequestsCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold leading-none animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--r-border)]">
            {activeConversations.length === 0 ? (
              <div className="p-8 text-center text-[var(--r-meta)] text-xs">
                Aktif sohbetiniz bulunmuyor. Yeni bir sohbet başlatın!
              </div>
            ) : (
              activeConversations.map(c => {
                const isSelected = c.partner.id === selectedPartnerId
                const timeStr = c.lastMessage.created_at
                  ? new Date(c.lastMessage.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                  : ''

                return (
                  <button
                    key={c.partner.id}
                    onClick={() => setSelectedPartnerId(c.partner.id)}
                    className={`w-full p-4 text-left transition-colors flex gap-3 items-center ${
                      isSelected ? 'bg-primary-500/10 border-l-4 border-primary-600 pl-3' : 'hover:bg-[var(--r-hover)]/50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0 border border-primary-500/20">
                      <span className="text-sm font-bold text-primary-600">
                        {(canSeeFullProfile(c.partner.id) ? c.partner.full_name : c.partner.username)?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="font-bold text-[var(--r-text)] text-sm truncate">{displayName(c.partner)}</h4>
                        <span className="text-[10px] text-[var(--r-meta)] shrink-0">{timeStr}</span>
                      </div>
                      <p className="text-xs text-[var(--r-meta)] truncate">{c.lastMessage.body}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Area: Messages Stream */}
        <div className={`flex-1 flex flex-col min-w-0 ${
          !selectedPartnerId ? 'hidden md:flex' : 'flex'
        }`}>
          {activePartner ? (
            <>
              {/* Partner Header */}
              <div className="p-4 border-b border-[var(--r-border)] flex items-center gap-3 shrink-0 bg-[var(--r-bg)]/20">
                <button
                  onClick={() => setSelectedPartnerId(null)}
                  className="md:hidden p-1 text-[var(--r-meta)] hover:text-[var(--r-text)]"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-9 h-9 rounded-full bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
                  <span className="text-sm font-bold text-primary-600">
                    {(canSeeFullProfile(activePartner.id) ? activePartner.full_name : activePartner.username)?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-[var(--r-text)] text-sm leading-tight">{displayName(activePartner)}</h3>
                  <p className="text-[10px] text-[var(--r-meta)] leading-none mt-0.5">@{activePartner.username}</p>
                </div>
              </div>

              {/* Messages History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--r-bg)]/10">
                {activeChatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--r-meta)] space-y-2">
                    <span className="text-3xl">👋</span>
                    <p className="text-xs">Sohbeti başlatmak için ilk mesajı gönderin!</p>
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
                        <div className={`flex items-end gap-1.5 max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed ${
                            isMe 
                              ? 'bg-primary-600 text-white rounded-tr-none' 
                              : 'bg-[var(--r-card)] text-[var(--r-text)] border border-[var(--r-border)] rounded-tl-none'
                          }`}>
                            {msg.body}
                          </div>
                          <span className="text-[9px] text-[var(--r-meta)] select-none pb-0.5 shrink-0">
                            {timeStr}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* DM Input Footer or Friendship Requirement Banner */}
              {isPartnerAccepted(selectedPartnerId) || !getRequestFor(selectedPartnerId) ? (
                <form onSubmit={handleSend} className="p-3 border-t border-[var(--r-border)] flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 flex items-center justify-center"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Gönder'
                    )}
                  </button>
                </form>
              ) : getRequestFor(selectedPartnerId)?.receiver_id === profile.id ? (
                <div className="p-5 border-t border-[var(--r-border)] bg-amber-500/[0.06] text-center flex flex-col items-center gap-3 shrink-0">
                  <p className="text-xs text-amber-600 font-bold">Bu kullanıcıdan gelen mesaj isteğini kabul ediyor musunuz?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(selectedPartnerId)}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                    >
                      Kabul Et
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(selectedPartnerId)}
                      className="bg-[var(--r-card)] border border-[var(--r-border)] text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                    >
                      İsteği Sil
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t border-[var(--r-border)] bg-[var(--r-bg)] text-center text-xs text-[var(--r-meta)] font-medium">
                  ✉️ Mesaj isteği gönderildi. Karşı tarafın kabul etmesi bekleniyor.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--r-meta)] space-y-3 bg-[var(--r-bg)]/5">
              <div className="w-16 h-16 bg-primary-500/10 border border-primary-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-[var(--r-text)] text-sm">Sohbet Seçin</h3>
                <p className="text-xs text-[var(--r-meta)] mt-1 max-w-[200px] leading-relaxed">
                  Mesaj geçmişini görmek için soldan bir konuşma seçin veya arkadaşlarınızla yeni bir sohbet başlatın.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Start New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-[var(--r-card)] w-full max-w-sm rounded-2xl p-5 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--r-border)] shrink-0">
              <h3 className="font-bold text-[var(--r-text)] text-sm">Yeni Sohbet Başlat</h3>
              <button 
                onClick={() => {
                  setShowNewChatModal(false)
                  setSearchQuery('')
                }}
                className="text-[var(--r-meta)] hover:text-[var(--r-text)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mx-1 mb-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 shrink-0">
              <p className="text-[11px] text-amber-600 leading-relaxed">💡 Arkadaş olmadığınız kişilere göndereceğiniz ilk mesaj <span className="font-semibold">"Mesaj İsteği"</span> olarak iletilecektir.</p>
            </div>
            
            <div className="mb-4 shrink-0">
              <input
                type="text"
                placeholder="İsim veya kullanıcı adı arayın..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2 focus:bg-[var(--r-card)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
              {filteredUsers.length === 0 ? (
                <div className="p-6 text-center text-[var(--r-meta)] text-xs leading-relaxed">
                  Aramanıza uygun üye bulunamadı.
                </div>
              ) : (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedPartnerId(user.id)
                      setShowNewChatModal(false)
                      setSearchQuery('')
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-primary-500/[0.06] border border-[var(--r-border)] hover:border-primary-500/25 flex items-center gap-3 transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
                      <span className="text-sm font-bold text-primary-600">
                        {(canSeeFullProfile(user.id) ? user.full_name : user.username)?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--r-text)] text-xs">{displayName(user)}</h4>
                      <p className="text-[9px] text-[var(--r-meta)]">@{user.username}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
