import { useEffect, useState } from 'react'

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // 1. Zaten kurulmuşsa veya standalone moddaysa gösterme
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    if (isStandalone) return

    // Kullanıcı daha önce kapatmışsa gösterme
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed') === 'true'
    if (isDismissed) return

    // 2. iOS tespiti
    const userAgent = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(ios)

    if (ios) {
      // iOS ise (ve standalone değilse) kılavuz gösterebiliriz
      // Kullanıcıyı hemen darlamamak için biraz gecikmeli gösterebiliriz
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 2000)
      return () => clearTimeout(timer)
    } else {
      // 3. Android / Chrome için event dinle
      const handler = (e) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setShowPrompt(true)
      }

      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }

    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_prompt_dismissed', 'true')
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa_prompt_dismissed', 'true')
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <>
      {/* Banner */}
      <div className="lg:hidden fixed bottom-16 left-4 right-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white p-4 rounded-xl shadow-xl z-50 flex items-center justify-between border border-white/10 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div className="pr-2">
            <h4 className="font-semibold text-xs">Alamancı'yı Uygulama Olarak Yükle</h4>
            <p className="text-[10px] text-white/80">Tek tıkla ana ekranına ekle ve hızlıca eriş!</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleInstallClick} 
            className="bg-white text-primary-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-opacity-95 transition-all shadow-sm shrink-0"
          >
            Yükle
          </button>
          <button 
            onClick={handleDismiss} 
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
            aria-label="Kapat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* iOS Kurulum Rehberi Modalı */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-sm w-full p-6 text-gray-800 shadow-2xl relative animate-slide-up">
            <button 
              onClick={() => setShowIOSInstructions(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-primary-500/10 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">iPhone'a Yükle</h3>
              <p className="text-sm text-gray-500 mt-1">Uygulamayı ana ekranınıza eklemek için aşağıdaki adımları takip edin:</p>
            </div>
            
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex gap-3 items-center">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">1</span>
                <span>Safari tarayıcısının altındaki <strong>Paylaş (Share)</strong> simgesine tıklayın:</span>
                <span className="p-1.5 bg-gray-100 rounded text-gray-700 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l1.677-.838L10 8.016l-3.328 1.664M12 21V12m0 0l-3 3m3-3l3 3m2.684-9.258l-1.677.838M12 3v3m0 0l-3-3m3 3l3-3" />
                  </svg>
                </span>
              </div>
              
              <div className="flex gap-3 items-center">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">2</span>
                <span>Menüyü kaydırıp <strong>Ana Ekrana Ekle (Add to Home Screen)</strong> seçeneğine tıklayın.</span>
              </div>

              <div className="flex gap-3 items-center">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">3</span>
                <span>Sağ üstteki <strong>Ekle (Add)</strong> butonuna tıklayarak tamamlayın.</span>
              </div>
            </div>

            <button 
              onClick={() => {
                setShowIOSInstructions(false)
                handleDismiss()
              }} 
              className="mt-6 w-full bg-primary-600 text-white font-semibold py-2.5 rounded-xl hover:bg-primary-700 transition-colors shadow"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </>
  )
}
