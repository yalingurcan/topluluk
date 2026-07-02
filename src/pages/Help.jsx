import { useState } from 'react'
import { Link } from 'react-router-dom'

const GUIDE_FEATURES = [
  {
    to: '/',
    label: 'Ana Sayfa',
    description: 'Takip ettiğiniz şehir ve konulardaki en güncel gönderileri, yorumları ve etkinlikleri tek bir akışta görün.',
    paths: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    )
  },
  {
    to: '/sehirler',
    label: 'Şehirler',
    description: "Almanya'da yaşadığınız ya da taşınmayı düşündüğünüz şehri bulun, o şehirdeki diğer Türklerle ve yerel bilgilerle buluşun.",
    paths: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    )
  },
  {
    to: '/konular',
    label: 'Konular',
    description: 'İş, vize, okul, sağlık gibi konu bazlı tartışma alanlarına katılın, deneyimlerinizi paylaşın ve soru sorun.',
    paths: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    )
  },
  {
    to: '/etkinlikler',
    label: 'Etkinlikler',
    description: 'Yakınınızdaki buluşmaları, piknikleri ve organizasyonları görün, katılımınızı bildirin ve yeni insanlarla tanışın.',
    paths: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    )
  },
  {
    to: '/uyeler',
    label: 'Tüm Üyeler',
    description: 'Topluluktaki tüm onaylı üyeleri arayın; şehir, meslek, hobi ve ilgi alanına göre filtreleyin.',
    paths: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
    )
  },
  {
    to: '/arkadaslar',
    label: 'Arkadaşlar',
    description: "Tanıştığınız kişileri arkadaş olarak ekleyin; en yakın bağlantılarınızı \"Yakın Arkadaş\" olarak işaretleyip onlara profilinizde daha fazla bilgi gösterin.",
    paths: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    )
  },
  {
    to: '/mesajlar',
    label: 'Mesajlar',
    description: 'Arkadaşlarınızla birebir mesajlaşın; henüz arkadaş olmadığınız biriyle konuşmak isterseniz önce bir mesaj isteği gönderin.',
    paths: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    )
  },
  {
    to: '/profil',
    label: 'Profil & Gizlilik',
    description: 'Ad-soyad, yaş, medeni durum gibi bilgilerinizi kimlerin görebileceğini — herkes, arkadaşlar ya da sadece yakın arkadaşlar — kendiniz belirleyin.',
    paths: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    )
  }
]

const SECTIONS = [
  {
    title: '📜 Genel Kurallar',
    items: [
      {
        q: 'Bu topluluğun amacı nedir?',
        a: 'Alamancı, Almanya\'da yaşayan üyelerin birbirini bulması, tanışması ve etkinliklerde bir araya gelmesi için kurulmuş bir topluluk uygulamasıdır.'
      },
      {
        q: 'Üyelerden ne bekleniyor?',
        a: 'Birbirinize saygılı davranmanızı, gerçek bilgilerle kayıt olmanızı, spam ya da ticari reklam paylaşmamanızı ve başka üyelerin gizlilik tercihlerine saygı göstermenizi bekliyoruz.'
      },
      {
        q: 'Uygunsuz bir paylaşım veya üye gördüğümde ne yapmalıyım?',
        a: 'Şüpheli ya da uygunsuz bir durumla karşılaşırsanız bir yöneticiyle iletişime geçin. Yöneticiler gerekli gördüğü içerikleri kaldırma ve üyeleri uyarma/çıkarma yetkisine sahiptir.'
      }
    ]
  },
  {
    title: '🔒 Gizlilik Seviyeleri',
    items: [
      {
        q: 'Profilimde kimler neyi görebilir?',
        a: 'Kullanıcı adınız, şehriniz ve mesleğiniz her zaman herkese açıktır. Ad-soyad, yaş, cinsiyet, medeni durum, çocuk bilgisi, hobiler ve ilgi alanlarınız için ise üç seviyeden birini seçebilirsiniz: Herkese Açık, Arkadaşlar veya Yakın Arkadaşlar.'
      },
      {
        q: 'Bu üç seviye ne anlama geliyor?',
        a: '"Herkese Açık" onaylanmış tüm üyeler tarafından görülebilir. "Arkadaşlar" sadece arkadaşlık isteğinizi kabul ettiğiniz kişiler tarafından görülebilir. "Yakın Arkadaşlar" ise yalnızca arkadaşlarınız arasından özel olarak seçtiğiniz, daha sınırlı bir grup tarafından görülebilir.'
      },
      {
        q: 'Gizlilik ayarlarımı nereden değiştirebilirim?',
        a: 'Profilim sayfasında "Profili Düzenle" butonuna basıp formun altındaki "Gizlilik Ayarları" bölümünden her bilgi için ayrı ayrı seviye seçebilirsiniz.'
      },
      {
        q: 'Birisini Yakın Arkadaş olarak nasıl işaretlerim?',
        a: 'Arkadaşlarım sayfasında, arkadaş listenizdeki her kişinin altında "Yakın Arkadaş Yap" butonu bulunur. Bu işaretleme tek yönlüdür: siz birini yakın arkadaş yaptığınızda, o kişi sizin "Yakın Arkadaşlar" için ayırdığınız bilgilerinizi görebilir hale gelir. Karşı tarafın da sizi yakın arkadaş olarak işaretlemesi gerekmez.'
      },
      {
        q: 'Gönderilerde ve etkinliklerde adım nasıl görünür?',
        a: 'Ad-soyad gizlilik tercihinize bağlı olarak, gönderiler, yorumlar, etkinlikler ve mesajlarda adınız ya gerçek adınızla ya da kullanıcı adınızla (@kullaniciadi) görünür.'
      }
    ]
  },
  {
    title: '🤝 Arkadaşlık Sistemi',
    items: [
      {
        q: 'Nasıl arkadaş eklerim?',
        a: 'Üyeler sayfasından ya da bir üyenin profiline tıklayarak "Arkadaş Ekle" butonuna basabilirsiniz. Karşı taraf isteğinizi kabul ettiğinde arkadaş olursunuz.'
      },
      {
        q: 'Arkadaşlığı sonlandırabilir miyim?',
        a: 'Evet, Arkadaşlarım sayfasından istediğiniz zaman bir arkadaşlığı sonlandırabilirsiniz.'
      }
    ]
  },
  {
    title: '📝 Gönderiler & Etkinlikler',
    items: [
      {
        q: 'Gönderi veya etkinlik nasıl paylaşırım?',
        a: 'Ana Sayfa, Konular veya Şehir sayfalarındaki "Gönderi Oluştur" / "Etkinlik Oluştur" butonlarını kullanarak paylaşım yapabilirsiniz.'
      },
      {
        q: 'Bir etkinliğe nasıl katılırım?',
        a: 'Etkinlik detay sayfasında "Katılıyorum" seçeneğini işaretleyebilir, etkinlik sohbetine katılabilir ve arkadaşlarınızı davet edebilirsiniz.'
      }
    ]
  },
  {
    title: '💬 Mesajlaşma',
    items: [
      {
        q: 'Herkese mesaj gönderebilir miyim?',
        a: 'Mesajlaşmaya başlamak için karşı tarafla arkadaş olmanız gerekir. Arkadaş olmadığınız biriyle mesajlaşma isteği gönderebilir, kabul edilirse sohbete devam edebilirsiniz.'
      }
    ]
  }
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[var(--r-border)] last:border-0 py-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-semibold text-[var(--r-text)]">{q}</span>
        <svg
          className={`w-4 h-4 text-[var(--r-meta)] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <p className="text-xs text-[var(--r-meta)] mt-2 leading-relaxed">{a}</p>
      )}
    </div>
  )
}

export default function Help() {
  return (
    <div className="pb-8">
      <h1 className="text-xl font-bold text-[var(--r-text)] mb-1">Yardım & SSS</h1>
      <p className="text-sm text-[var(--r-meta)] mb-5">
        Topluluğun nasıl çalıştığı, gizlilik seçenekleri ve genel kurallar hakkında sık sorulan sorular.
      </p>

      <div className="bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm p-4 mb-6">
        <h2 className="text-base font-bold text-[var(--r-text)] mb-2">Alamancı Nedir ve Nasıl Kullanılır?</h2>
        <div className="text-xs text-[var(--r-meta)] leading-relaxed space-y-2 mb-4">
          <p>
            Alamancı, Almanya'daki Türk toplumunu bir araya getirmek için özel olarak tasarlanmış bir topluluk uygulamasıdır. Almanya'da yaşayan ya da yeni gelen Türk göçmenlerin ve gurbetçilerin; WhatsApp, Instagram veya Facebook'tan çok daha kullanışlı bir şekilde birbirini bulması, organize olması, faydalı bilgilere ulaşması ve kendine özel insanlarla tanışması için tasarlandı. Şirket bağlantısı olmayan, bağımsız bir topluluk projesidir.
          </p>
          <p>
            Alamancı, Ekim 2019'dan beri Almanya'da yaşayan, çift (Türk-Alman) vatandaşlığa sahip ve ailesiyle Mönchengladbach'ta yaşayan Dr. Yalın Gürcan ve hemşire Ebru Bozacı Gürcan tarafından kuruldu.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GUIDE_FEATURES.map(f => (
            <Link
              key={f.to}
              to={f.to}
              className="bg-[var(--r-bg)] rounded-2xl border border-[var(--r-border)] p-3.5 flex items-start gap-3 hover:border-primary-500/30 transition-colors"
            >
              <span className="w-9 h-9 rounded-xl bg-primary-500/10 text-primary-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {f.paths}
                </svg>
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[var(--r-text)]">{f.label}</h3>
                <p className="text-xs text-[var(--r-meta)] mt-0.5 leading-relaxed">{f.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {SECTIONS.map(section => (
          <div key={section.title} className="bg-[var(--r-card)] rounded-2xl border border-[var(--r-border)] shadow-sm p-4">
            <h2 className="text-sm font-bold text-primary-600 mb-1">{section.title}</h2>
            <div>
              {section.items.map(item => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
