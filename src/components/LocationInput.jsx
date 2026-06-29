import { useState, useEffect, useRef } from 'react'

export default function LocationInput({ value, onChange, onCityChange, placeholder, className, cityName = '', disabled = false }) {
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
    if (!query || query.trim().length < 2) {
      setSuggestions([])
      return
    }
    setLoading(true)
    try {
      // Prioritize Germany by bounding query, and combine with selected cityName if provided for context
      // Photon API is powered by Elasticsearch and supports extremely high writing-tolerance fuzzy search
      const searchQuery = cityName ? `${query}, ${cityName}` : query
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=8&lang=de`
      )
      const data = await response.json()
      setSuggestions(data.features || [])
      setShowDropdown(true)
    } catch (error) {
      console.error('Error fetching location suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    onChange(val) // Update the parent component state immediately on keystroke

    // Try to guess a city from the free text if possible for onCityChange
    if (onCityChange) {
      const parts = val.split(',')
      if (parts.length > 1) {
        const potentialCity = parts[parts.length - 1].trim()
        if (potentialCity.length > 2 && !/\d/.test(potentialCity)) {
          onCityChange(potentialCity)
        }
      }
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val)
    }, 400)
  }

  const handleSelect = (item) => {
    const p = item.properties || {}
    const name = p.name || ''
    const street = p.street ? `${p.street} ${p.housenumber || ''}`.trim() : ''
    const city = p.city || p.town || p.district || ''
    const zip = p.postcode || ''
    
    // Format full address neatly
    const addressParts = []
    if (name) addressParts.push(name)
    if (street && street !== name) addressParts.push(street)
    if (city) addressParts.push(zip ? `${zip} ${city}` : city)
    
    const displayName = addressParts.join(', ')

    onChange(displayName)
    if (onCityChange && city) {
      onCityChange(city)
    }
    setShowDropdown(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          disabled={disabled}
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true)
          }}
          placeholder={placeholder || 'Adres veya yer adı'}
          className={className || "w-full border border-[var(--r-input-border)] bg-[var(--r-input)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-[100] left-0 right-0 mt-1.5 bg-[var(--r-card)] backdrop-blur-md border border-[var(--r-border)] rounded-2xl shadow-xl max-h-60 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {suggestions.map((item, idx) => {
            const p = item.properties || {}
            
            // Build visual representation
            const mainText = p.name || p.street || 'Konum'
            
            const secondaryParts = []
            // If name is mainText, put street in secondary
            if (p.name && p.street) {
              secondaryParts.push(`${p.street} ${p.housenumber || ''}`.trim())
            }
            const cityPart = p.postcode ? `${p.postcode} ${p.city || ''}`.trim() : p.city || ''
            if (cityPart) secondaryParts.push(cityPart)
            
            const secondaryText = secondaryParts.join(', ')

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full px-4 py-2.5 text-left text-xs hover:bg-primary-500/10 hover:text-primary-600 transition-colors flex items-start gap-2.5 border-b border-[var(--r-border)]/50 last:border-0"
              >
                <span className="text-sm mt-0.5 shrink-0">📍</span>
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--r-text)] truncate">
                    {mainText}
                  </p>
                  {secondaryText && (
                    <p className="text-[var(--r-meta)] truncate mt-0.5">
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
