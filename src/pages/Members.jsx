import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import MemberMap from '../components/MemberMap'

export default function Members() {
  const { profile } = useAuth()
  const [members, setMembers] = useState([])
  const [friendships, setFriendships] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [occupationFilter, setOccupationFilter] = useState('')
  const [viewMode, setViewMode] = useState('list')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: profilesData }, { data: friendshipsData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('status', 'approved'),
      supabase.from('friendships').select('*').or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
    ])
    setMembers(profilesData || [])
    setFriendships(friendshipsData || [])
    setLoading(false)
  }

  async function sendRequest(memberId) {
    const { data } = await supabase
      .from('friendships')
      .insert({ sender_id: profile.id, receiver_id: memberId, status: 'pending' })
      .select()
      .single()
    if (data) {
      setFriendships(f => [...f, data])
    }
  }

  async function cancelRequest(memberId) {
    await supabase
      .from('friendships')
      .delete()
      .eq('sender_id', profile.id)
      .eq('receiver_id', memberId)
    setFriendships(f => f.filter(x => !(x.sender_id === profile.id && x.receiver_id === memberId)))
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

  const getFriendshipStatus = (memberId) => {
    const rel = friendships.find(
      x =>
        (x.sender_id === profile.id && x.receiver_id === memberId) ||
        (x.sender_id === memberId && x.receiver_id === profile.id)
    )
    if (!rel) return null
    return rel
  }

  // Filter members
  const filteredMembers = members.filter(m => {
    if (m.id === profile.id) return false // Hide self

    const query = search.toLowerCase()
    const matchesSearch =
      m.full_name?.toLowerCase().includes(query) ||
      m.username?.toLowerCase().includes(query) ||
      m.hobbies?.toLowerCase().includes(query) ||
      m.interests?.toLowerCase().includes(query)

    const matchesCity = !cityFilter || m.city?.toLowerCase().includes(cityFilter.toLowerCase())
    const matchesOccupation = !occupationFilter || m.occupation?.toLowerCase().includes(occupationFilter.toLowerCase())

    return matchesSearch && matchesCity && matchesOccupation
  })

  // For geographic map count (apply filters except city to see density across all cities)
  const mapMembers = members.filter(m => {
    if (m.id === profile.id) return false
    const query = search.toLowerCase()
    const matchesSearch =
      m.full_name?.toLowerCase().includes(query) ||
      m.username?.toLowerCase().includes(query) ||
      m.hobbies?.toLowerCase().includes(query) ||
      m.interests?.toLowerCase().includes(query)
    const matchesOccupation = !occupationFilter || m.occupation?.toLowerCase().includes(occupationFilter.toLowerCase())
    return matchesSearch && matchesOccupation
  })

  // Extract cities and occupations for filtering lists
  const uniqueCities = [...new Set(members.map(m => m.city).filter(Boolean))]
  const uniqueOccupations = [...new Set(members.map(m => m.occupation).filter(Boolean))]

  return (
    <div className="pb-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-900">Üyeler & Eşleşme</h1>
        <div className="flex bg-gray-100/85 backdrop-blur-md rounded-xl p-0.5 border border-gray-200/50">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              viewMode === 'list' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Liste Görünümü
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              viewMode === 'map' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Harita Görünümü
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="İsim, kullanıcı adı, hobi, ilgi alanı ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <select
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tüm Şehirler</option>
              {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <select
              value={occupationFilter}
              onChange={e => setOccupationFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tüm Meslekler</option>
              {uniqueOccupations.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'map' && !loading && (
        <div className="mb-4">
          <MemberMap
            members={mapMembers}
            onCitySelect={city => setCityFilter(city)}
            selectedCity={cityFilter}
          />
          {cityFilter && (
            <div className="flex items-center justify-between bg-primary-50 border border-primary-100 rounded-xl px-4 py-2.5 mt-2.5">
              <span className="text-xs text-primary-700 font-medium">
                📍 Harita Filtresi: <strong>{cityFilter}</strong> şehrindeki üyeler gösteriliyor
              </span>
              <button
                type="button"
                onClick={() => setCityFilter('')}
                className="text-xs text-primary-700 hover:text-primary-900 font-bold bg-primary-100 hover:bg-primary-200/80 px-2 py-0.5 rounded-md transition-colors"
              >
                Temizle
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100 p-8">
          <p className="text-sm">Aradığınız kriterlere uygun üye bulunamadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMembers.map(m => {
            const rel = getFriendshipStatus(m.id)

            return (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-primary-700">{m.full_name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold text-gray-900 text-sm truncate">{m.full_name}</h2>
                      <p className="text-xs text-gray-500 truncate">@{m.username}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <span>📍</span>
                      <span className="font-semibold text-gray-800">{m.city || 'Belirtilmemiş'}</span>
                      {m.age && <span className="text-gray-300">|</span>}
                      {m.age && <span>{m.age} Yaş</span>}
                      {m.gender && <span className="text-gray-300">|</span>}
                      {m.gender && <span>{m.gender}</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>💼</span>
                      <span>{m.occupation || 'Belirtilmemiş'}</span>
                    </div>

                    {m.hobbies && (
                      <div className="pt-2 border-t border-gray-50">
                        <span className="text-[10px] text-gray-400 block font-medium">🎨 HOBİLER</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.hobbies.split(',').map((h, i) => (
                            <span key={i} className="text-[10px] bg-gray-50 text-gray-600 px-2 py-0.5 rounded-md border border-gray-100 truncate max-w-[120px]">
                              {h.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.interests && (
                      <div className="pt-2 border-t border-gray-50">
                        <span className="text-[10px] text-gray-400 block font-medium">🎯 İLGİ ALANLARI</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.interests.split(',').map((int, i) => (
                            <span key={i} className="text-[10px] bg-primary-50/50 text-primary-700 px-2 py-0.5 rounded-md border border-primary-50/30 truncate max-w-[120px]">
                              {int.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Friendship & Message Buttons */}
                <div className="pt-3 border-t border-gray-50 mt-auto flex gap-2">
                  <div className="flex-1">
                    {!rel && (
                      <button
                        onClick={() => sendRequest(m.id)}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
                      >
                        Arkadaş Ekle
                      </button>
                    )}

                    {rel && rel.status === 'pending' && rel.sender_id === profile.id && (
                      <button
                        onClick={() => cancelRequest(m.id)}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold py-2 rounded-xl transition-colors"
                      >
                        İstek Gönderildi (İptal)
                      </button>
                    )}

                    {rel && rel.status === 'pending' && rel.receiver_id === profile.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptRequest(rel.sender_id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
                        >
                          Kabul Et
                        </button>
                        <button
                          onClick={() => deleteFriendship(m.id)}
                          className="px-3 bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-500 text-xs font-semibold py-2 rounded-xl transition-colors"
                        >
                          Yoksay
                        </button>
                      </div>
                    )}

                    {rel && rel.status === 'accepted' && (
                      <button
                        onClick={() => {
                          if (confirm('Arkadaşlıktan çıkarmak istediğinize emin misiniz?')) {
                            deleteFriendship(m.id)
                          }
                        }}
                        className="w-full bg-green-50 hover:bg-red-50 text-green-700 hover:text-red-600 border border-green-200 hover:border-red-200 text-xs font-semibold py-2 rounded-xl transition-colors"
                      >
                        Arkadaşınız (Çıkar)
                      </button>
                    )}
                  </div>

                  {rel && rel.status === 'accepted' && (
                    <Link
                      to={`/mesajlar?user=${m.id}`}
                      className="flex items-center justify-center px-3 bg-primary-50 hover:bg-primary-100/80 text-primary-700 border border-primary-100/60 rounded-xl transition-colors shrink-0"
                      title="Mesaj Gönder"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
