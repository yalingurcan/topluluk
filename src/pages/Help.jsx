import { useState } from 'react'

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
