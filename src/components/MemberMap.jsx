import { useEffect, useRef, useState } from 'react'

const CITY_COORDS = {
  // Germany
  'berlin': [52.5200, 13.4050],
  'köln': [50.9375, 6.9603],
  'koln': [50.9375, 6.9603],
  'münchen': [48.1351, 11.5820],
  'munchen': [48.1351, 11.5820],
  'hamburg': [53.5511, 9.9937],
  'frankfurt': [50.1109, 8.6821],
  'stuttgart': [48.7758, 9.1829],
  'düsseldorf': [51.2277, 6.7735],
  'dusseldorf': [51.2277, 6.7735],
  'dortmund': [51.5136, 7.4653],
  'essen': [51.4556, 7.0116],
  'bremen': [53.0793, 8.8017],
  'hannover': [52.3759, 9.7320],
  'nürnberg': [49.4521, 11.0767],
  'nurnberg': [49.4521, 11.0767],
  'duisburg': [51.4344, 6.7623],
  'bochum': [51.4818, 7.2162],
  'wuppertal': [51.2562, 7.1508],
  'bielefeld': [52.0302, 8.5325],
  'bonn': [50.7374, 7.0982],
  'münster': [51.9607, 7.6261],
  'munster': [51.9607, 7.6261],
  'karlsruhe': [49.0069, 8.4037],
  'mannheim': [49.4875, 8.4660],
  'wiesbaden': [50.0782, 8.2398],
  'gelsenkirchen': [51.5177, 7.0857],
  'mönchengladbach': [51.1854, 6.4417],
  'monchengladbach': [51.1854, 6.4417],
  'aachen': [50.7753, 6.0839],
  'mainz': [49.9929, 8.2473],
  'freiburg': [47.9990, 7.8421],
  'lübeck': [53.8655, 10.6866],
  'lubeck': [53.8655, 10.6866],
  'erfurt': [50.9848, 11.0299],
  'kassel': [51.3127, 9.4797],
  'hagen': [51.3671, 7.4633],
  'saarbrücken': [49.2402, 6.9969],
  'saarbrucken': [49.2402, 6.9969],
  'potsdam': [52.3989, 13.0657],
  'ludwigshafen': [49.4774, 8.4452],
  'mülheim': [51.4267, 6.8824],
  'mulheim': [51.4267, 6.8824],
  'oldenburg': [53.1439, 8.2139],
  'osnabrück': [52.2799, 8.0472],
  'osnabruck': [52.2799, 8.0472],
  'leverkusen': [51.0459, 6.9956],
  'heidelberg': [49.3988, 8.6724],
  'darmstadt': [49.8728, 8.6512],
  'herne': [51.5424, 7.2289],
  'neuss': [51.1983, 6.6916],
  'regensburg': [49.0134, 12.1016],
  'solingen': [51.1652, 7.0671],

  // Turkey
  'istanbul': [41.0082, 28.9784],
  'istanbul': [41.0082, 28.9784],
  'ankara': [39.9334, 32.8597],
  'izmir': [38.4237, 27.1428],
  'bursa': [40.1885, 29.0610],
  'antalya': [36.8841, 30.7056],
  'adana': [37.0000, 35.3213],
  'konya': [37.8714, 32.4846],
  'gaziantep': [37.0662, 37.3833],
  'şanlıurfa': [37.1583, 38.7917],
  'sanliurfa': [37.1583, 38.7917],
  'kocaeli': [40.8533, 29.8815],
  'izmit': [40.8533, 29.8815],
  'mersin': [36.8121, 34.6415],
  'diyarbakır': [37.9144, 40.2306],
  'diyarbakir': [37.9144, 40.2306],
  'hatay': [36.4018, 36.3498],
  'antakya': [36.2023, 36.1613],
  'manisa': [38.6191, 27.4289],
  'kayseri': [38.7205, 35.4826],
  'samsun': [41.2867, 36.3300],
  'balıkesir': [39.6484, 27.8826],
  'balikesir': [39.6484, 27.8826],
  'kahramanmaraş': [37.5858, 36.9371],
  'kahramanmaras': [37.5858, 36.9371],
  'van': [38.4891, 43.4019],
  'aydın': [37.8560, 27.8416],
  'aydin': [37.8560, 27.8416],
  'denizli': [37.7731, 29.0873],
  'sakarya': [40.7569, 30.3789],
  'adapazarı': [40.7569, 30.3789],
  'eskişehir': [39.7767, 30.5206],
  'eskisehir': [39.7767, 30.5206],
  'muğla': [37.2153, 28.3636],
  'mugla': [37.2153, 28.3636],
  'trabzon': [41.0027, 39.7168]
}

export default function MemberMap({ members, onCitySelect, selectedCity }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [cityData, setCityData] = useState([])
  const [loadingCoords, setLoadingCoords] = useState(false)

  // 1. Load Leaflet script and stylesheet dynamically
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

  // 2. Process members and resolve city coordinates
  useEffect(() => {
    if (!members || members.length === 0) {
      setCityData([])
      return
    }

    // Group members by city
    const groups = {}
    members.forEach(member => {
      const city = member.city ? member.city.trim() : ''
      if (!city) return
      const key = city.toLocaleLowerCase('tr-TR')
      if (!groups[key]) {
        groups[key] = {
          name: city,
          count: 0,
          members: []
        }
      }
      groups[key].count++
      groups[key].members.push(member)
    })

    // Resolve coordinates for each group
    const resolveCoords = async () => {
      setLoadingCoords(true)
      const resolvedList = []
      const keys = Object.keys(groups)

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const group = groups[key]
        let coords = CITY_COORDS[key]

        // If not in local mapping, try fetching from Nominatim
        if (!coords) {
          try {
            // Wait 150ms to avoid hammering Nominatim API and getting 429
            await new Promise(resolve => setTimeout(resolve, 150))
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(group.name)}&limit=1`,
              {
                headers: {
                  'User-Agent': 'AlamanciCommunityApp/1.0'
                }
              }
            )
            const data = await response.json()
            if (data && data[0]) {
              coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
            }
          } catch (e) {
            console.error('Error geocoding city:', group.name, e)
          }
        }

        if (coords) {
          resolvedList.push({
            ...group,
            coords
          })
        }
      }

      setCityData(resolvedList)
      setLoadingCoords(false)
    }

    resolveCoords()
  }, [members])

  // 3. Initialize/update Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || cityData.length === 0) return

    const L = window.L

    // Initialize Map Instance if not created
    if (!mapInstanceRef.current) {
      // Center Europe/Turkey view
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

    // Add markers for each city
    cityData.forEach(city => {
      const isSelected = selectedCity && selectedCity.toLocaleLowerCase('tr-TR') === city.name.toLocaleLowerCase('tr-TR')

      const markerHtml = `
        <div class="flex items-center justify-center">
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${
            isSelected 
              ? 'bg-primary-600 text-white ring-4 ring-primary-100 animate-pulse' 
              : 'bg-primary-500 hover:bg-primary-600 text-white transition-all transform hover:scale-105'
          } shadow-md border-2 border-white font-bold text-xs cursor-pointer">
            ${city.count}
          </div>
        </div>
      `

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-member-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })

      const marker = L.marker(city.coords, { icon: customIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="text-center p-1.5 min-w-[120px]">
            <h3 class="font-bold text-sm text-gray-900">${city.name}</h3>
            <p class="text-xs text-gray-500 mt-0.5">${city.count} Aktif Üye</p>
            <button 
              type="button" 
              id="btn-filter-${city.name.replace(/\s+/g, '-')}"
              class="mt-2.5 w-full bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-semibold py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Üyeleri Filtrele
            </button>
          </div>
        `, { closeButton: false })

      // Setup click listener inside popup
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-filter-${city.name.replace(/\s+/g, '-')}`)
        if (btn) {
          btn.onclick = () => {
            if (onCitySelect) onCitySelect(city.name)
            marker.closePopup()
          }
        }
      })

      markersRef.current.push(marker)
    })

    // Fit bounds automatically if we have markers
    if (cityData.length > 0 && mapInstanceRef.current) {
      const bounds = L.latLngBounds(cityData.map(c => c.coords))
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 })
    }
  }, [leafletLoaded, cityData, selectedCity])

  // Cleanup map instance on component unmount
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
            <p className="text-xs font-medium text-gray-500">Harita yükleniyor...</p>
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
