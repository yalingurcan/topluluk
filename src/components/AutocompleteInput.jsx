import { useState, useEffect, useRef } from 'react'

export const CITIES = [
  'Berlin', 'Köln', 'München', 'Hamburg', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund',
  'Essen', 'Bremen', 'Hannover', 'Nürnberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld',
  'Bonn', 'Münster', 'Karlsruhe', 'Mannheim', 'Wiesbaden', 'Gelsenkirchen', 'Mönchengladbach',
  'Aachen', 'Mainz', 'Freiburg', 'Lübeck', 'Erfurt', 'Kassel', 'Hagen', 'Saarbrücken', 'Potsdam',
  'Ludwigshafen', 'Mülheim', 'Oldenburg', 'Osnabrück', 'Leverkusen', 'Heidelberg', 'Darmstadt',
  'Herne', 'Neuss', 'Regensburg', 'Solingen',
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Şanlıurfa',
  'Kocaeli', 'Mersin', 'Diyarbakır', 'Hatay', 'Manisa', 'Kayseri', 'Samsun', 'Balıkesir',
  'Kahramanmaraş', 'Van', 'Aydın', 'Denizli', 'Sakarya', 'Eskişehir', 'Muğla', 'Trabzon',
  'Erzurum', 'Malatya', 'Sivas', 'Tokat', 'Ordu', 'Giresun', 'Rize', 'Zonguldak', 'Edirne',
  'Tekirdağ', 'Çanakkale', 'Kars', 'Şırnak'
]

export const OCCUPATIONS = [
  'Yazılım Mühendisi', 'Yazılım Geliştirici', 'Bilgisayar Mühendisi', 'Elektrik Mühendisi',
  'İnşaat Mühendisi', 'Makine Mühendisi', 'Endüstri Mühendisi', 'Mimar', 'İç Mimar',
  'Doktor', 'Diş Hekimi', 'Eczacı', 'Hemşire', 'Hasta Bakıcı', 'Fizyoterapist',
  'Öğretmen', 'Öğretim Üyesi', 'Akademisyen', 'Avukat', 'Hukuk Müşaviri', 'Psikolog',
  'Sosyolog', 'Gazeteci', 'Yazar', 'Çevirmen', 'Grafiker', 'Grafik Tasarımcı', 'UX/UI Tasarımcı',
  'Muhasebeci', 'Mali Müşavir', 'Finans Uzmanı', 'İK Uzmanı', 'Pazarlama Uzmanı',
  'Satış Danışmanı', 'Müşteri Temsilcisi', 'Yönetici', 'Proje Yöneticisi', 'Esnaf',
  'Girişimci', 'Berber', 'Kuaför', 'Aşçı', 'Garson', 'Şoför', 'Kurye', 'Güvenlik Görevlisi',
  'Teknisyen', 'Tekniker', 'Öğrenci', 'Emekli', 'Ev Hanımı', 'Ressam', 'Müzisyen', 'Fotoğrafçı'
]

export default function AutocompleteInput({ 
  value, 
  onChange, 
  suggestions = [], 
  placeholder = '', 
  label = '', 
  required = false,
  className = ''
}) {
  const [filtered, setFiltered] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    const val = e.target.value
    onChange(val)

    if (val.trim().length > 0) {
      const query = val.toLocaleLowerCase('tr-TR')
      const filteredList = suggestions.filter(item => 
        item.toLocaleLowerCase('tr-TR').includes(query)
      ).slice(0, 5)
      setFiltered(filteredList)
      setShowDropdown(true)
    } else {
      setFiltered([])
      setShowDropdown(false)
    }
  }

  const handleFocus = () => {
    if (value && value.trim().length > 0) {
      const query = value.toLocaleLowerCase('tr-TR')
      const filteredList = suggestions.filter(item =>
        item.toLocaleLowerCase('tr-TR').includes(query)
      ).slice(0, 5)
      setFiltered(filteredList)
      setShowDropdown(true)
    }
  }

  const handleSelect = (item) => {
    onChange(item)
    setShowDropdown(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        type="text"
        value={value || ''}
        onChange={handleInputChange}
        onFocus={handleFocus}
        required={required}
        placeholder={placeholder}
        className={className || "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"}
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-[100] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {filtered.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors border-b border-gray-50 last:border-0"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
