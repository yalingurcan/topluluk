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
      const d = new Date(ev.event_date)
      const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
      const day = d.getDate()
      const month = months[d.getMonth()]

      const markerHtml = `
        <div style="display:flex;align-items:center;justify-content:center;">
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#6366f1;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:2px solid white;cursor:pointer;line-height:1;">
            <span style="font-size:14px;font-weight:700;">${day}</span>
            <span style="font-size:8px;font-weight:600;opacity:0.85;margin-top:1px;">${month}</span>
          </div>
        </div>
      `

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-event-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
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
          <div style="padding:8px;min-width:160px;text-align:left;">
            <h3 style="font-weight:700;font-size:13px;color:#111827;line-height:1.3;margin:0 0 6px 0;">${ev.title}</h3>
            <p style="font-size:11px;color:#6366f1;font-weight:600;margin:0 0 3px 0;">📅 ${dateStr}</p>
            <p style="font-size:11px;color:#6b7280;margin:0 0 8px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">📍 ${ev.location}</p>
            <a
              href="/etkinlikler/${ev.id}"
              style="display:block;text-align:center;background:#6366f1;color:#ffffff !important;font-size:11px;font-weight:600;padding:6px 10px;border-radius:8px;text-decoration:none;"
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
