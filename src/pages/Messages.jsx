import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Messages() {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const targetUserId = searchParams.get('user')

  const [messages, setMessages] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPartnerId, setSelectedPartnerId] = useState(null)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewChatModal, setShowNewChatModal] = useState(false)

  const messagesEndRef = useRef(null)
  const profileCache = useRef({})

  // Fetch DM history & Friend list
  useEffect(() => {
    fetchData()

    // Realtime channel
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

    return () => {
      supabase.removeChannel(channel)
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
        .select('*, sender:profiles!sender_id(id, full_name, username), receiver:profiles!receiver_id(id, full_name, username)')
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
        .select('*, sender:profiles!sender_id(id, full_name, username), receiver:profiles!receiver_id(id, full_name, username)')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)

      const resolvedFriends = (friendshipData || []).map(f => {
        return f.sender_id === profile.id ? f.receiver : f.sender
      }).filter(Boolean)

      setFriends(resolvedFriends)
    } catch (e) {
      console.error('Error fetching chat details:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleUrlTargetUser(userId) {
    if (userId === profile.id) {
      // Cannot chat with self, clear params
      setSearchParams({})
      return
    }

    const hasChat = messages.some(m => m.sender_id === userId || m.receiver_id === userId)
    const isFriend = friends.some(f => f.id === userId)

    // Block starting conversation if they aren't friends and have no history
    if (!hasChat && !isFriend) {
      alert('Sadece arkadaş olduğunuz kişilere mesaj gönderebilirsiniz.')
      setSearchParams({})
      return
    }

    if (hasChat) {
      setSelectedPartnerId(userId)
      setSearchParams({})
      return
    }

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

    return Object.values(list).sort(
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

    // Double-check active friendship status
    const isFriend = friends.some(f => f.id === selectedPartnerId)
    if (!isFriend) {
      alert('Bu kullanıcıya mesaj göndermek için arkadaş olmalısınız.')
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
      console.error('Failed to send DM:', e)
      alert('Mesaj gönderilemedi.')
      setInputText(textToSend)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="pb-8 h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h1 className="text-xl font-bold text-gray-900">Mesajlar</h1>
        <button
          onClick={() => setShowNewChatModal(true)}
          className="bg-primary-550 hover:bg-primary-650 text-primary-700 bg-primary-50 px-3.5 py-2 rounded-xl text-xs font-semibold border border-primary-100/60 transition-colors"
        >
          Yeni Sohbet Başlat
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex min-h-0">
        {/* Left Sidebar: Active Conversations List */}
        <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col shrink-0 ${
          selectedPartnerId ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="p-4 border-b border-gray-100/60 bg-gray-50/20">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sohbetler</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {activeConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
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
                      isSelected ? 'bg-primary-50/50 border-l-4 border-primary-600 pl-3' : 'hover:bg-gray-50/50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0 border border-primary-100">
                      <span className="text-sm font-bold text-primary-700">
                        {c.partner.full_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{c.partner.full_name}</h4>
                        <span className="text-[10px] text-gray-400 shrink-0">{timeStr}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{c.lastMessage.body}</p>
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
              <div className="p-4 border-b border-gray-100 flex items-center gap-3 shrink-0 bg-gray-50/20">
                <button
                  onClick={() => setSelectedPartnerId(null)}
                  className="md:hidden p-1 text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center border border-primary-100">
                  <span className="text-sm font-bold text-primary-700">
                    {activePartner.full_name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{activePartner.full_name}</h3>
                  <p className="text-[10px] text-gray-400 leading-none mt-0.5">@{activePartner.username}</p>
                </div>
              </div>

              {/* Messages History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/10">
                {activeChatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
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
                              : 'bg-white text-gray-800 border border-gray-150 rounded-tl-none'
                          }`}>
                            {msg.body}
                          </div>
                          <span className="text-[9px] text-gray-400 select-none pb-0.5 shrink-0">
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
              {friends.some(f => f.id === selectedPartnerId) ? (
                <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              ) : (
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-500 font-medium">
                  🔒 Bu kullanıcıya mesaj göndermek için arkadaş olmalısınız.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-3 bg-gray-50/5">
              <div className="w-16 h-16 bg-primary-50 border border-primary-100/40 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-800 text-sm">Sohbet Seçin</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-[200px] leading-relaxed">
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
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50 shrink-0">
              <h3 className="font-bold text-gray-900 text-sm">Yeni Sohbet Başlat</h3>
              <button 
                onClick={() => setShowNewChatModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
              {friends.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs leading-relaxed">
                  Henüz arkadaşınız bulunmuyor.<br />Üyeler sayfasından birilerine arkadaşlık isteği göndererek sohbet edebilirsiniz!
                </div>
              ) : (
                friends.map(friend => (
                  <button
                    key={friend.id}
                    onClick={() => {
                      setSelectedPartnerId(friend.id)
                      setShowNewChatModal(false)
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-primary-50/50 border border-gray-100 hover:border-primary-100 flex items-center gap-3 transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center border border-primary-100">
                      <span className="text-sm font-bold text-primary-700">
                        {friend.full_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">{friend.full_name}</h4>
                      <p className="text-[9px] text-gray-500">@{friend.username}</p>
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
