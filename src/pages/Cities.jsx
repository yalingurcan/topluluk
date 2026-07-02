import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const CityIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export default function Cities() {
  const { profile } = useAuth()
  const [cities, setCities] = useState([])
  const [followedCities, setFollowedCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchCities() }, [])

  async function fetchCities() {
    setLoading(true)

    const [{ data: members }, { data: events }, { data: channels }, { data: follows }] = await Promise.all([
      supabase.from('profiles').select('city').eq('status', 'approved').not('city', 'is', null),
      supabase.from('events').select('city').not('city', 'is', null),
      supabase.from('channels').select('city').not('city', 'is', null),
      supabase.from('city_follows').select('city_name').eq('user_id', profile.id)
    ])

    const memberCounts = {}
    ;(members || []).forEach(m => {
      if (m.city) memberCounts[m.city] = (memberCounts[m.city] || 0) + 1
    })

    const eventCounts = {}
    ;(events || []).forEach(e => {
      if (e.city) eventCounts[e.city] = (eventCounts[e.city] || 0) + 1
    })

    const channelCounts = {}
    ;(channels || []).forEach(c => {
      if (c.city) channelCounts[c.city] = (channelCounts[c.city] || 0) + 1
    })

    const allCities = new Set([
      ...Object.keys(memberCounts),
      ...Object.keys(eventCounts),
      ...Object.keys(channelCounts),
    ])

    const cityList = Array.from(allCities).map(city => ({
      name: city,
      memberCount: memberCounts[city] || 0,
      eventCount: eventCounts[city] || 0,
      channelCount: channelCounts[city] || 0,
    }))

    cityList.sort((a, b) => {
      const aIsOwn = profile?.city && a.name.toLowerCase() === profile.city.toLowerCase()
      const bIsOwn = profile?.city && b.name.toLowerCase() === profile.city.toLowerCase()
      if (aIsOwn && !bIsOwn) return -1
      if (!aIsOwn && bIsOwn) return 1
      return b.memberCount - a.memberCount
    })

    setFollowedCities((follows || []).map(f => f.city_name.toLowerCase()))
    setCities(cityList)
    setLoading(false)
  }

  async function toggleFollow(cityName, e) {
    e.preventDefault()
    e.stopPropagation()
    const nameLower = cityName.toLowerCase()
    const isFollowed = followedCities.includes(nameLower)

    if (isFollowed) {
      await supabase.from('city_follows').delete().eq('user_id', profile.id).eq('city_name', cityName)
      setFollowedCities(prev => prev.filter(c => c !== nameLower))
    } else {
      await supabase.from('city_follows').insert({ user_id: profile.id, city_name: cityName })
      setFollowedCities(prev => [...prev, nameLower])
    }
  }

  const filteredCities = cities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const isMyCity = (cityName) =>
    profile?.city && cityName.toLowerCase() === profile.city.toLowerCase()

  const myCities = filteredCities.filter(c => followedCities.includes(c.name.toLowerCase()))
  const exploreCities = filteredCities.filter(c => !followedCities.includes(c.name.toLowerCase()))

  const renderCityCard = (city) => (
    <Link
      key={city.name}
      to={`/sehirler/${encodeURIComponent(city.name)}`}
      id={`city-card-${city.name.replace(/\s+/g, '-').toLowerCase()}`}
      className={`group bg-[var(--r-card)] rounded-2xl border shadow-sm p-4 hover:shadow-md hover:border-primary-500/30 transition-all duration-200 ${
        isMyCity(city.name)
          ? 'border-primary-500/40 ring-1 ring-primary-500/20'
          : 'border-[var(--r-border)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isMyCity(city.name)
            ? 'bg-primary-500/[0.15] text-primary-600'
            : 'bg-[var(--r-hover)] text-[var(--r-meta)] group-hover:bg-primary-500/10 group-hover:text-primary-500 transition-colors'
        }`}>
          <CityIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-[var(--r-text)] text-sm group-hover:text-primary-600 transition-colors leading-snug">
              {city.name}
            </h3>
            <button
              onClick={(e) => toggleFollow(city.name, e)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all border shrink-0 ${
                followedCities.includes(city.name.toLowerCase())
                  ? 'bg-primary-500/10 text-primary-600 border-primary-500/20 hover:bg-primary-500/[0.15]'
                  : 'bg-[var(--r-card)] text-[var(--r-meta)] border-[var(--r-border)] hover:border-primary-500/30 hover:text-primary-600'
              }`}
            >
              {followedCities.includes(city.name.toLowerCase()) ? 'Katıldın ✓' : 'Katıl +'}
            </button>
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-[var(--r-meta)]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium text-[var(--r-text)]">{city.memberCount}</span> üye
            </span>
            {city.eventCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-[var(--r-meta)]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium text-[var(--r-text)]">{city.eventCount}</span> etkinlik
              </span>
            )}
            {city.channelCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-[var(--r-meta)]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="font-medium text-[var(--r-text)]">{city.channelCount}</span> konu
              </span>
            )}
          </div>
        </div>
        <svg
          className="w-4 h-4 text-[var(--r-border)] group-hover:text-primary-500 transition-colors shrink-0 self-center"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )

  return (
    <div className="pb-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-[var(--r-text)] mb-1">Şehirler</h1>
        <p className="text-sm text-[var(--r-meta)]">
          Şehrindeki topluluğu keşfet — üyeler, etkinlikler ve konular.
        </p>
      </div>

      <div className="relative mb-5">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--r-meta)]"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          id="city-search"
          type="text"
          placeholder="Şehir ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCities.length === 0 ? (
        <div className="text-center py-16 text-[var(--r-meta)]">
          <div className="w-12 h-12 mx-auto mb-3 opacity-30 flex items-center justify-center">
            <CityIcon />
          </div>
          <p className="text-sm">
            {search ? 'Aradığınız şehir bulunamadı.' : 'Henüz şehir bilgisi girilmemiş.'}
          </p>
          {!search && (
            <p className="text-xs mt-1">
              Üyeler profillerini güncelledikçe şehirler burada görünecek.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {myCities.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-[var(--r-meta)] uppercase tracking-wider px-1">Şehirlerim</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {myCities.map(renderCityCard)}
              </div>
            </div>
          )}

          {exploreCities.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-[var(--r-meta)] uppercase tracking-wider px-1">Keşfet</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {exploreCities.map(renderCityCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
