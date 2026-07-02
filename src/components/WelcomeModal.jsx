import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'seenWelcomeModal'

export default function WelcomeModal() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(() => !localStorage.getItem(STORAGE_KEY))

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setIsOpen(false)
  }

  const handleSeeGuide = () => {
    dismiss()
    navigate('/yardim')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200">
      <div className="bg-[var(--r-card)] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[85vh]">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full text-[var(--r-meta)] hover:bg-[var(--r-hover)] transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <img src="/favicon.svg" alt="Alamancı" className="w-8 h-8" />
            <span className="text-lg font-bold text-brand-orange tracking-tight">Alamancı</span>
          </div>

          <h2 className="text-lg font-bold text-[var(--r-text)] mb-3">Alamancı'ya Hoş Geldiniz</h2>

          <div className="space-y-3 text-sm text-[var(--r-text)] leading-relaxed">
            <p>
              Alamancı, Almanya'daki Türk toplumunu bir araya getirmek için özel olarak tasarlanmış bir topluluk uygulamasıdır. Almanya'da yaşayan ya da yeni gelen Türk göçmenleri ve gurbetçileri; WhatsApp, Instagram veya Facebook'tan çok daha kullanışlı bir şekilde birbirini bulması, organize olması ve kendine özel bilgilere ulaşması için tasarladık.
            </p>
            <p>
              Almanya'da bir hayat kurmaya çalışan herkes için bir rehber olmayı hedefliyoruz.
            </p>
            <p className="text-xs text-[var(--r-meta)] pt-2 border-t border-[var(--r-border)]">
              Alamancı, hiçbir şirkete bağlı olmadan, Dr. Yalın Gürcan ve hemşire Ebru Bozacı Gürcan tarafından bağımsız olarak kuruldu.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--r-border)] flex gap-3 shrink-0">
          <button
            onClick={dismiss}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[var(--r-meta)] hover:bg-[var(--r-hover)] transition-colors"
          >
            Anladım
          </button>
          <button
            onClick={handleSeeGuide}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            Rehberi Gör
          </button>
        </div>
      </div>
    </div>
  )
}
