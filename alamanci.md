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
- **Şehir Badge:** Etkinlik kartlarında (Feed.jsx, Events.jsx, EventDetail.jsx) amber arka plan + koyu yazı badge olarak şehir gösterilir.
- **Özel/Genel Etkinlikler:** "Sadece Arkadaşlar" seçeneği. Özel etkinlikler kilit simgesiyle işaretlenir.
- **RSVP:** 👍 Katılıyorum / 👎 Katılmıyorum.
- **EventMap:** Haritada etkinlikler gün+ay kısaltması ("25 Haz") gösteren marker ile gösterilir. Popup "Etkinlik Detayı" butonu inline stil ile düzgün görünür.

### 4. Forumlar / Konular
- **Sekmeli Yapı:** "Genel Konular" ve "Şehir Grupları" sekmeleri.
- **Gönderi Oluştururken Şehir Seçimi:** İsteğe bağlı şehir seçeneği var (dropdown). Gönderilerde şehir badge olarak gösterilir.
- **Şehir Filtresi:** Kanal detay sayfasında şehre göre gönderi filtresi var.
- **Yorum Sayısı:** Yorumlar butonu "Yorumlar (3)" şeklinde sayıyı gösterir (yüklenince).
- **PostCard Spacing:** Rozet ile başlık arasında `mb-3` boşluk.
- **Admin Yönetimi:** Kullanıcı onaylama (onaylayınca Brevo e-postası gider), admin rolü, askıya alma, silme (artık veritabanından tamamen siler).
- **Çıkış Yap Yönlendirmesi:** `Pending.jsx` sayfasında onay bekleyen kullanıcılar "Çıkış Yap" butonuna bastığında otomatik olarak `/giris` sayfasına yönlendirilir.

### 6. Arayüz ve Tasarım
- **Mobil Header:** `md:hidden` fixed header — sol "Alamancı" başlığı, sağ mesajlar ikonu. Mesaj ikonu üzerinde okunmamış mesaj sayısı kırmızı badge gösterilir, `/mesajlar`'a girilince sıfırlanır.
- **iOS Safari Zoom Fix:** `maximum-scale=1.0` viewport meta ile otomatik zoom önlendi.
- **Navigasyon:** BottomNav (mobil) + TopNav (masaüstü).
- **PWA Desteği:** Manifest, service worker, akıllı PWA yükleme yönlendirmesi (`PWAInstallPrompt.jsx` - iOS ve Android için özel yükleme akışları sunar, bilgisayarlarda `lg:hidden` ile gizlenir) ve 3D "A" logosu (`favicon.svg`, `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png` dosyaları güncellendi).

### 7. Mesajlaşma
- **FloatingChat.jsx:** Hook violation düzeltildi — `isMessagesPage` kontrolü tüm hook'lardan sonra yapılır. `/mesajlar` sayfasında FloatingChat render edilmez.
- **Messages.jsx:** Mobil yükseklik `h-[calc(100dvh-160px)]` ile düzeltildi (100dvh iOS Safari adres çubuğunu da hesaplar).
- **Mobil Erişim:** Mobil header'daki mesaj ikonundan direkt `/mesajlar` sayfasına erişilebilir.
- **DM:** Yalnızca arkadaşlar arası. Realtime ile anlık.
- **Etkinlik Sohbet Odaları:** Her etkinlikte canlı sohbet.

### 8. Aile ve Medeni Durum
- **Profil Girişi:** `Profile.jsx` sayfasında "Medeni Durum" (Evli, Bekar, İlişkisi Var) ve "Çocuk Sayısı" alanları düzenlenebilir ve görüntülenebilir.
- **Üye Keşfetme Filtreleri:** `Members.jsx` sayfasına medeni durum ve çocuk sahibi (ebeveyn) olma durumuna göre arama/filtreleme seçenekleri eklendi. Üye kartlarında aile durumları gösterilir.

## Supabase DB Notları
- `profiles` tablosu: `id, username, full_name, avatar_url, is_admin, status, city, occupation, hobbies, interests, age, gender, email, marital_status, children_count`
- `events` tablosu: `city` kolonu eklendi
- `posts` tablosu: `city` kolonu eklendi
- Tablolar: `friendships`, `direct_messages`, `event_messages`, `rsvps`, `comments`, `channels`, `posts`, `events`, `profiles`
- RLS: `security definer` fonksiyonları (`get_is_admin()`, `get_is_approved()`)
- Auth trigger `handle_new_user()`: yeni kayıtta `profiles`'a email de kaydedilir.
- **Otomatik Onay E-postası Tetikleyicisi:** `profiles` tablosunda `status` değeri `'approved'` olarak güncellendiğinde `public.handle_status_approved` tetikleyicisi üzerinden Brevo API'si (`net.http_post`) doğrudan çağrılır ve otomatik mail gönderilir.
- **Güvenli Üye Silme (RPC):** `public.delete_user` fonksiyonu ile bir üye silindiğinde hem `auth.users` kaydı hem de buna bağlı tüm veriler (profiles, posts, friendships, messages vb.) cascade olarak tamamen silinir.

## Supabase Edge Functions
- `send-approval-email` (Alternatif/Yedek): Brevo API ile onay e-postası gönderen Deno/TypeScript fonksiyonu. (Projeye `supabase/` klasörü altına eklendi, ancak şu an veritabanı tetikleyicisi aktif olarak kullanılmaktadır).

## Proje Yapısı
```
src/
  pages/
    Feed.jsx          — Ana sayfa, gönderi akışı
    Channels.jsx      — Kanallar sekmeli listesi (Genel / Şehir)
    ChannelDetail.jsx — Kanal gönderileri, şehir filtresi, admin düzenleme
    Events.jsx        — Etkinlik listesi + oluşturma (datetime-local)
    EventDetail.jsx   — Etkinlik detayları, RSVP, sohbet
    Admin.jsx         — Kullanıcı yönetimi (silme işlemi güvenli RPC'ye bağlandı)
    Friends.jsx       — Arkadaşlık yönetimi
    Members.jsx       — Üye arama (Medeni durum ve Çocuk filtreleri eklendi)
    Messages.jsx      — DM merkezi (mobil uyumlu)
    Profile.jsx       — Profil düzenleme (Medeni durum ve Çocuk bilgileri eklendi)
    Login.jsx         — Giriş
    Register.jsx      — Kayıt (şehir, meslek, autocomplete)
    Pending.jsx       — Onay bekleyen ekran (çıkış yapınca otomatik /giris yönlendirmesi)
  components/
    PostCard.jsx        — Gönderi kartı (yorum sayısı, şehir badge, spacing)
    CreatePostModal.jsx — Gönderi oluşturma (isteğe bağlı şehir)
    LocationInput.jsx   — Konum otomatik tamamlama + onCityChange prop
    EventMap.jsx        — Etkinlik haritası (gün+ay marker, inline popup stili)
    MemberMap.jsx       — Üye haritası (boş state mesajı)
    AutocompleteInput.jsx — Şehir/meslek dropdown (sadece yazarken göster)
    FloatingChat.jsx    — Yüzen sohbet (hook violation düzeltildi)
    Layout.jsx          — Sarmal: mobil header, realtime DM dinleyici
    PWAInstallPrompt.jsx — PWA yükleme yönlendirmesi (iOS/Android destekli)
    TopNav.jsx          — Masaüstü navigasyon
    BottomNav.jsx       — Mobil alt navigasyon
  contexts/
    AuthContext.jsx   — Oturum ve profil
  lib/
    supabase.js       — Supabase istemci
```
