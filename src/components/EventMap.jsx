import { useEffect, useRef, useState } from 'react'

export default function EventMap({ events }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [eventLocations, setEventLocations] = useState([])
  const [loadingCoords, setLoadingCoords] = useState(false)

  // Load Leaflet dynamically
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true)
      return
    }

    // Load CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    // Load JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => setLeafletLoaded(true)
    document.body.appendChild(script)
  }, [])

  // Resolve coordinates
  useEffect(() => {
    if (!events || events.length === 0) {
      setEventLocations([])
      return
    }

    const resolveCoords = async () => {
      setLoadingCoords(true)
      const uniqueLocs = [...new Set(events.map(e => e.location).filter(Boolean))]
      const resolved = {}

      for (let i = 0; i < uniqueLocs.length; i++) {
        const loc = uniqueLocs[i]
        try {
          // Wait 150ms to avoid hammering Nominatim API and getting 429
          await new Promise(resolve => setTimeout(resolve, 150))
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}&limit=1`,
            {
              headers: {
                'User-Agent': 'AlamanciEventsMapApp/1.0'
              }
            }
          )
          const data = await response.json()
          if (data && data[0]) {
            resolved[loc] = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
          }
        } catch (e) {
          console.error('Error geocoding event location:', loc, e)
        }
      }

      // Map events to their coordinates
      const list = events.map(ev => {
        if (!ev.location || !resolved[ev.location]) return null
        return {
          ...ev,
          coords: resolved[ev.location]
        }
      }).filter(Boolean)

      setEventLocations(list)
      setLoadingCoords(false)
    }

    resolveCoords()
  }, [events])

  // Draw Map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || eventLocations.length === 0) return

    const L = window.L

    // Initialize Map Instance if not created
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([47.5, 20], 4)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstanceRef.current)
    }

    // Clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // Add markers
    eventLocations.forEach(ev => {
      const markerHtml = `
        <div class="flex items-center justify-center">
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-all transform hover:scale-105 shadow-md border-2 border-white text-xs cursor-pointer">
            📅
          </div>
        </div>
      `

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-event-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })

      const dateStr = new Date(ev.event_date).toLocaleString('tr-TR', { 
        day: 'numeric', 
        month: 'long', 
        hour: '2-digit', 
        minute: '2-digit' 
      })

      const marker = L.marker(ev.coords, { icon: customIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="p-2 min-w-[160px] text-left">
            <h3 class="font-bold text-sm text-gray-900 leading-tight">${ev.title}</h3>
            <p class="text-[11px] text-primary-600 font-semibold mt-1">📅 ${dateStr}</p>
            <p class="text-[11px] text-gray-500 truncate mt-0.5">📍 ${ev.location}</p>
            <a 
              href="/etkinlikler/${ev.id}" 
              class="mt-2.5 block text-center bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-semibold py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Etkinlik Detayı
            </a>
          </div>
        `, { closeButton: false })

      markersRef.current.push(marker)
    })

    // Fit bounds automatically if we have markers
    if (eventLocations.length > 0 && mapInstanceRef.current) {
      const bounds = L.latLngBounds(eventLocations.map(e => e.coords))
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 })
    }
  }, [leafletLoaded, eventLocations])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div className="relative">
      {(!leafletLoaded || loadingCoords) && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-[100] rounded-2xl border border-gray-100">
          <div className="text-center bg-white p-4 rounded-2xl shadow-md border border-gray-100">
            <div className="w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-500">Etkinlik haritası yükleniyor...</p>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="h-[380px] w-full rounded-2xl border border-gray-100 shadow-sm z-10 overflow-hidden" 
        style={{ minHeight: '380px' }}
      />
    </div>
  )
}
