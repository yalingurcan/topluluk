import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function EventChat({ eventId }) {
  const { profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const profileCache = useRef({})

  useEffect(() => {
    if (!eventId) return
    fetchMessages()

    const channel = supabase
      .channel(`event-chat-${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'event_messages',
        filter: `event_id=eq.${eventId}`
      }, async (payload) => {
        // Resolve sender profile details
        let senderProfile = null
        if (payload.new.sender_id === profile.id) {
          senderProfile = { full_name: profile.full_name, username: profile.username }
        } else {
          senderProfile = await getSenderProfile(payload.new.sender_id)
        }

        const newMsg = {
          ...payload.new,
          profiles: senderProfile
        }
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function getSenderProfile(userId) {
    if (profileCache.current[userId]) {
      return profileCache.current[userId]
    }
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', userId)
        .single()
      if (data) {
        profileCache.current[userId] = data
        return data
      }
    } catch (e) {
      console.error('Error fetching sender profile:', e)
    }
    return { full_name: 'Bilinmeyen Kullanıcı', username: 'bilinmeyen' }
  }

  async function fetchMessages() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('event_messages')
        .select('*, profiles!sender_id(full_name, username)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (e) {
      console.error('Error fetching event messages:', e)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!inputText.trim() || sending) return
    setSending(true)
    const textToSend = inputText.trim()
    setInputText('')

    try {
      const { error } = await supabase
        .from('event_messages')
        .insert({
          event_id: eventId,
          sender_id: profile.id,
          body: textToSend
        })

      if (error) throw error
    } catch (err) {
      console.error('Failed to send message:', err)
      alert('Mesaj gönderilemedi, lütfen tekrar deneyin.')
      setInputText(textToSend) // restore text
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm overflow-hidden h-[500px]">
      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[var(--r-bg)]/30">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--r-meta)] space-y-2">
            <span className="text-2xl">💬</span>
            <p className="text-xs">Sohbete ilk mesajı göndererek koordinasyonu başlatın!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === profile.id
            const dateStr = new Date(msg.created_at).toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <span className="text-[10px] text-[var(--r-meta)] font-medium ml-1.5 mb-0.5">
                    {msg.profiles?.full_name || 'Yükleniyor...'}
                  </span>
                )}
                <div className={`flex items-end gap-1.5 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`px-3.5 py-2 rounded-2xl text-sm shadow-sm leading-relaxed ${
                    isMe 
                      ? 'bg-primary-600 text-white rounded-tr-none' 
                      : 'bg-[var(--r-card)] text-[var(--r-text)] border border-[var(--r-border)] rounded-tl-none'
                  }`}>
                    {msg.body}
                  </div>
                  <span className="text-[9px] text-[var(--r-meta)] select-none pb-0.5 shrink-0">
                    {dateStr}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 bg-[var(--r-card)] border-t border-[var(--r-border)] flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Etkinlik hakkında konuşun..."
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
    </div>
  )
}
