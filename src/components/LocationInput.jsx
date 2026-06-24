import { useState, useEffect, useRef } from 'react'

export default function LocationInput({ value, onChange, onCityChange, placeholder, className }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = async (query) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([])
      return
    }
    setLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CommunityApp/1.0'
          }
        }
      )
      const data = await response.json()
      setSuggestions(data || [])
      setShowDropdown(true)
    } catch (error) {
      console.error('Error fetching location suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    onChange(val)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val)
    }, 450)
  }

  const handleSelect = (item) => {
    onChange(item.display_name)
    if (onCityChange) {
      const addr = item.address || {}
      const city = addr.city || addr.town || addr.village || addr.municipality || ''
      onCityChange(city)
    }
    setShowDropdown(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true)
          }}
          placeholder={placeholder || 'Adres veya yer adı'}
          className={className || "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-[100] left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {suggestions.map((item, idx) => {
            const displayName = item.display_name || ''
            const parts = displayName.split(',')
            const mainText = parts[0]?.trim()
            const secondaryText = parts.slice(1).map(p => p.trim()).join(', ')

            return (
              <button
                key={item.place_id || idx}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full px-4 py-2.5 text-left text-xs hover:bg-primary-50 hover:text-primary-700 transition-colors flex items-start gap-2.5 border-b border-gray-50/50 last:border-0"
              >
                <span className="text-sm mt-0.5 shrink-0">📍</span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {mainText || 'Konum'}
                  </p>
                  {secondaryText && (
                    <p className="text-gray-500 truncate mt-0.5">
                      {secondaryText}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
