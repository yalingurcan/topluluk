# Alamancı Topluluk — Proje Özeti

## Çalışma Kuralları
- **GitHub push/commit:** Kullanıcı açıkça söylemedikçe `git push` veya `git commit` yapılmaz, öneri de sunulmaz.
- **Bütünlük kontrolü:** Bir bileşende değişiklik yapıldığında aynı verinin/özelliğin göründüğü tüm sayfalar kontrol edilip güncellenir.

## Genel Bilgi
- **Proje adı:** Alamancı (alamanci.netlify.app)
- **GitHub:** https://github.com/yalingurcan/topluluk
- **Supabase proje ID:** zwkyxwtvmhtycguqeoju
- **Stack:** React 18 + Vite + Supabase + Tailwind CSS + PWA
- **Deploy:** Netlify (GitHub'a push → otomatik deploy)

## Giriş ve Test Bilgileri
- **Supabase URL:** `https://zwkyxwtvmhtycguqeoju.supabase.co`
- **Supabase anon key:** `.env` dosyasında (gitignore'da, commit edilmez)
- **Test Kullanıcı Giriş Bilgileri:**
  - **E-posta:** `testuser@example.com`
  - **Şifre:** `Password123!`
  - *Not: Admin tarafından onaylanmış test hesabı.*

## Yapılan Şeyler / Özellikler

### 1. Üyelik ve Kimlik Doğrulama
- **Kayıt Akışı (Otomatik Tamamlamalı):** E-posta/şifre ile kayıt. Ad-Soyad, Şehir ve Meslek zorunludur. Şehir ve Meslek alanlarında yazarken öneri dropdown'ı çıkar (sadece yazarken, tıklayınca değil).
- **Admin Onayı:** Kayıt olan kullanıcılar admin onay verene kadar bekletilir (`Pending.jsx`). Pending sayfasında "sekmeyi kapatabilirsiniz, e-posta bildirim gelecek" açıklaması var.
- **Onay E-postası:** Admin onaylayınca Brevo üzerinden kullanıcıya otomatik e-posta gider (`send-approval-email` Supabase Edge Function). BREVO_API_KEY Supabase Secrets'ta kayıtlı. Gönderen: `info@eylaconsulting.com`.
- **İlk Giriş Yönlendirme:** Onaylanan kullanıcı siteye ilk girdiğinde (şehir ve meslek boşsa) `/profil` sayfasına yönlendirilir, düzenleme modu açık gelir, hoş geldin banner'ı gösterilir. LocalStorage ile tek seferlik kontrol yapılır.
- **Profil Yönetimi:** Yaş, cinsiyet, şehir, meslek, hobi ve ilgi alanları düzenlenebilir. Hobiler/ilgi alanları tag seçici ile seçilir.
- **Profiles tablosunda `email` kolonu** eklendi ve mevcut kullanıcıların e-postaları dolduruldu. Auth trigger güncellendi (yeni kayıtlarda email de kaydedilir).

### 2. Sosyal ve Arkadaşlık Özellikleri
- **Üye Keşfetme / Arama (`Members.jsx`):** Şehir, meslek, hobiler ve ilgi alanlarına göre arama. Liste ve Harita görünümleri.
- **MemberMap (`MemberMap.jsx`):** Şehir bilgisi olan üyeler haritada gösterilir. Şehir bilgisi yoksa "Henüz şehir bilgisi girilmiş üye yok" mesajı ve harita yine de açılır.
- **Arkadaşlık Sistemi (`Friends.jsx`):** İstek gönderme, onaylama, reddetme, liste yönetimi.

### 3. Etkinlikler ve Konum
- **Etkinlik Oluşturma:** Tarih ve saat için tek `datetime-local` input (iOS Safari uyumlu). Konum alanı LocationInput ile Nominatim otomatik tamamlama sunar.
- **Şehir Otomatik Tespiti:** Konum seçilince Nominatim'den `address.city/town/village` çekilerek events tablosuna `city` kaydedilir.
- **Şehir Badge:** Etkinlik kartlarında (Feed.jsx, Events.jsx, EventDetail.jsx) amber arka plan badge olarak şehir gösterilir.
- **Özel/Genel Etkinlikler:** "Sadece Arkadaşlar" seçeneği. Özel etkinlikler "Özel" badge ile işaretlenir.
- **RSVP:** Sadece 👍 Katılıyorum butonu (sağa yaslanmış, sayı ile birlikte). Katılmıyorum butonu kaldırıldı.
- **Davet:** Etkinlik detay sayfasında "Arkadaşlarını Davet Et" modalı — arkadaş listesinden seçip davet mesajı DM olarak gider.
- **EventMap:** Haritada etkinlikler gün+ay kısaltması gösteren marker ile gösterilir.

### 4. Forumlar / Konular
- **Sekmeli Yapı:** "Genel Konular" ve "Şehir Grupları" sekmeleri.
- **Gönderi Oluştururken Şehir Seçimi:** İsteğe bağlı şehir seçeneği var. Gönderilerde şehir badge olarak gösterilir.
- **Şehir Filtresi:** Kanal detay sayfasında şehre göre gönderi filtresi var.
- **Yorum Sayısı:** Yorumlar butonu "Yorumlar (3)" şeklinde sayıyı gösterir.
- **Admin Yönetimi:** Kullanıcı onaylama, admin rolü, askıya alma, silme (güvenli RPC ile tamamen siler).

### 5. Ana Sayfa (Feed.jsx)
- **Paylaş Butonu — İki Seçenek:** Paylaş butonuna tıklayınca dropdown çıkar:
  - **Gönderi** → `CreatePostModal` açılır
  - **Etkinlik** → `/etkinlikler?create=true` sayfasına yönlendirir, etkinlik oluşturma formu otomatik açılır
- **Kişiselleştirilmiş Akış:** Şehirler ve Konular sayfalarından takip edilen içerikler önce gösterilir. Banner bir kez gösterilir (localStorage).
- **Kart Yapısı:** Etkinlik ve gönderi kartları ayrı stil, etkinlik kartlarında sol turuncu çizgi (border-l-4).
- **Kartlarda açıklama gösterilmez** — detay sayfasına tıklayınca görünür.

### 6. Arayüz ve Tasarım — Reddit Dark Mode Sistemi
- **CSS Değişkenleri (`src/index.css`):**
  ```css
  :root {
    --r-bg: #FFFFFF; --r-card: #FFFFFF; --r-nav: #FFFFFF;
    --r-border: #EDEFF1; --r-text: #1C1C1C; --r-meta: #878A8C;
    --r-hover: #F6F7F8; --r-input: #F6F7F8; --r-input-border: #EDEFF1;
  }
  html.dark {
    --r-bg: #0D0D0E; --r-card: #1A1A1B; --r-nav: #1A1A1B;
    --r-border: #2D2D2E; --r-text: #D7DADC; --r-meta: #818384;
    --r-hover: #313135; --r-input: #1A1A1B; --r-input-border: #2D2D2E;
  }
  ```
- **Kart Hover Efekti:** Tüm interaktif kartlarda `hover:bg-[var(--r-hover)] transition-colors duration-150` var (PostCard, etkinlik kartları, üye kartları, arkadaş kartları, kanal kartları).
- **Opacity-based renkler:** `bg-primary-500/10`, `text-primary-600`, `border-primary-500/20` gibi opacity tabanlı renkler kullanılır (light/dark modda otomatik çalışır).
- **Tema Seçici:** TopNav ve mobil header'a açık/koyu mod geçiş butonu eklendi. Tercih `localStorage`'da saklanır. `ThemeContext.jsx` ile yönetilir.
- **Tüm sayfalar dark/light mode uyumlu:** Feed, Events, EventDetail, Channels, ChannelDetail, Friends, Members, Admin, Pending, Messages, FloatingChat, PostCard, CityDetail.

### 7. Etkinlik Detay Sayfası (EventDetail.jsx)
- **Konum linki:** Altı çizili değil, `text-[var(--r-text)]` (beyaz/dark mod uyumlu). Hover'da hafif opacity + yukarı kayma animasyonu.
- **Davet Et / Paylaş butonları:** Nötr `--r-hover` arka plan, `--r-text` renk (turuncu değil sekonder).
- **Katılım Durumu:** Sadece 👍 Katılıyorum butonu, sağa hizalı, sayı badge ile.
- **Sekmeler:** "Katılımcılar & Yorumlar" ve "Etkinlik Sohbeti LIVE".
- **Yorumlar:** Yorum yazın... / Cevap yazın... inputlar + Gönder butonu.

### 8. Kart Tasarımı Standardı
- **Feed etkinlik kartı:** `border-l-4 border-l-primary-500`, badge "ETKİNLİK", tarih (turuncu), şehir badge, konum linki, "Düzenleyen / Katıl ve Detaylar →" alt satır.
- **Events sayfası kartları:** Feed ile aynı tasarım (badge, tarih, şehir, konum, Düzenleyen / Katıl ve Detaylar →).
- **PostCard:** Gönderi kartlarında başlık, yorum/beğeni satırı. **Açıklama/body kartlarda gösterilmez.**
- **Tüm kartlarda açıklama kaldırıldı** — sadece detay sayfasında görünür.

### 9. Türkçe Karakter Düzeltmeleri
Tüm sayfalarda Türkçe karakterler düzeltildi:
- `Gonder` → `Gönder`, `Olustur` → `Oluştur`, `Katiliyorum` → `Katılıyorum`
- `Sehir` → `Şehir`, `Duzenleyen` → `Düzenleyen`, `Katilim` → `Katılım`
- `Arkadaslar` → `Arkadaşlar`, `Henuz` → `Henüz`, `Aciklama` → `Açıklama`
- `Lutfen once sehir secin` → `Lütfen önce şehir seçin`
- `Etkinligine` → `Etkinliğine`, `goz at` → `göz at`
- EventDetail, Events, Feed sayfaları dahil tüm JSX metinleri kontrol edildi.

### 10. Mesajlaşma
- **FloatingChat.jsx:** `/mesajlar` sayfasında FloatingChat render edilmez.
- **Messages.jsx:** Mobil yükseklik `h-[calc(100dvh-160px)]` ile düzeltildi.
- **DM:** Yalnızca arkadaşlar arası. Realtime ile anlık.
- **Etkinlik Sohbet Odaları:** Her etkinlikte canlı sohbet.

### 11. Aile ve Medeni Durum
- **Profil Girişi:** Medeni Durum (Evli, Bekar, İlişkisi Var) ve Çocuk Sayısı alanları.
- **Üye Keşfetme Filtreleri:** Medeni durum ve ebeveyn durumuna göre filtreleme. Üye kartlarında aile durumları gösterilir.

### 12. PWA ve Teknik
- **PWA Desteği:** Manifest, service worker, iOS/Android özel yükleme akışları (`PWAInstallPrompt.jsx`).
- **iOS Safari Zoom Fix:** `maximum-scale=1.0` viewport meta.
- **Mobil Bottom Nav / Desktop Top Nav** navigasyon.

## Supabase DB Notları
- `profiles` tablosu: `id, username, full_name, avatar_url, is_admin, status, city, occupation, hobbies, interests, age, gender, email, marital_status, children_count`
- `events` tablosu: `city` kolonu eklendi
- `posts` tablosu: `city` kolonu eklendi
- Tablolar: `friendships`, `direct_messages`, `event_messages`, `rsvps`, `comments`, `channels`, `posts`, `events`, `profiles`
- RLS: `security definer` fonksiyonları (`get_is_admin()`, `get_is_approved()`)
- Auth trigger `handle_new_user()`: yeni kayıtta `profiles`'a email de kaydedilir.
- **Otomatik Bildirim Tetikleyicileri:** `send_notification_webhook` fonksiyonu → `send-notification` Edge Function:
  - Yeni Kayıt (pending), Üyelik Onayı, Etkinlik Güncellemesi, Yeni Yorum, Yorum Yanıtı
- **Güvenli Üye Silme (RPC):** `public.delete_user` fonksiyonu cascade siler.

## Supabase Edge Functions
- `send-notification`: Deno/TypeScript, Resend API ile e-posta bildirimleri. `x-notification-secret` güvenlik başlığı ile doğrulama.
- `send-approval-email` (Eski): Brevo ile onay maili.

## Proje Yapısı
```
src/
  pages/
    Feed.jsx          — Ana sayfa; Paylaş butonu → Gönderi/Etkinlik seçici dropdown
    Channels.jsx      — Konu listesi; Yeni Konu modali max-h-[80vh] overflow-y-auto pb-20 md:pb-5
    ChannelDetail.jsx — Kanal gönderileri, şehir filtresi, admin düzenleme
    Events.jsx        — Etkinlik listesi + oluşturma; ?create=true ile modal otomatik açılır
    EventDetail.jsx   — Etkinlik detayları, RSVP (sadece Katılıyorum), davet modali, yorumlar
    Admin.jsx         — Kullanıcı yönetimi (güvenli RPC silme)
    Friends.jsx       — Arkadaşlık yönetimi
    Members.jsx       — Üye arama (Medeni durum ve Çocuk filtreleri)
    Messages.jsx      — DM merkezi (mobil uyumlu)
    Profile.jsx       — Profil düzenleme
    Login.jsx         — Giriş
    Register.jsx      — Kayıt (şehir, meslek, autocomplete)
    Pending.jsx       — Onay bekleyen ekran
    Cities.jsx        — Şehir listesi
    CityDetail.jsx    — Şehir detay sayfası
  components/
    PostCard.jsx        — Gönderi kartı (açıklama/body kartlarda gösterilmez)
    CreatePostModal.jsx — Gönderi oluşturma (isteğe bağlı şehir)
    LocationInput.jsx   — Konum otomatik tamamlama + onCityChange prop
    EventMap.jsx        — Etkinlik haritası
    MemberMap.jsx       — Üye haritası
    AutocompleteInput.jsx — Şehir/meslek dropdown
    FloatingChat.jsx    — Yüzen sohbet (/mesajlar sayfasında gizlenir)
    EventChat.jsx       — Etkinlik canlı sohbet
    UserProfileModal.jsx — Kullanıcı profil popup modalı
    Layout.jsx          — Sarmal: mobil header, realtime DM dinleyici
    PWAInstallPrompt.jsx — PWA yükleme yönlendirmesi
    TopNav.jsx          — Masaüstü navigasyon
    BottomNav.jsx       — Mobil alt navigasyon
  contexts/
    AuthContext.jsx   — Oturum ve profil
    ThemeContext.jsx  — Tema yönetimi (Light/Dark mode, localStorage)
  lib/
    supabase.js       — Supabase istemci
  index.css           — CSS değişkenleri (--r-* light/dark), Tailwind base
```
