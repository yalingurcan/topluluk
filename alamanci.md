# Alamancı Topluluk — Proje Özeti

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
  - *Not: Gelecekteki testler ve doğrulamalar için bu hesabı kullanabilirsiniz. Bu hesap admin tarafından onaylanmıştır.*

## Yapılan Şeyler / Özellikler

### 1. Üyelik ve Kimlik Doğrulama
- **Kayıt Akışı (Otomatik Tamamlamalı):** E-posta/şifre ile kayıt. Kayıt esnasında **Ad-Soyad**, **Yaşadığı Şehir** ve **Meslek** alanlarının girilmesi zorunludur. Yazım hatalarını (typo) önlemek için Şehir ve Meslek alanlarında kullanıcılar yazdıkça popüler seçenekleri gösteren dropdown öneri menüsü (autocomplete) sunulur.
- **Admin Onayı:** Kayıt olan kullanıcılar admin onay verene kadar bekletilir (`Pending.jsx` ekranı).
- **Profil Yönetimi (Etiket Seçimli & Otomatik Tamamlamalı):** Profil düzenleme sayfasında yaş ve cinsiyet eklenebilir. Yaşadığı şehir ve meslek alanları kayıt sayfasında olduğu gibi otomatik tamamlama önerilerine sahiptir. Hobiler ve ilgi alanları artık elle yazmak yerine tek tıkla seçilebilen/kaldırılabilen LinkedIn tarzı etkileşimli etiket (tag) seçici panelleri ile seçilebilir ve isteğe bağlı olarak özel etiketler eklenebilir. Profil sayfasında da bu hobiler ve ilgi alanları şık rozetler (badge) olarak sergilenir.

### 2. Sosyal ve Arkadaşlık Özellikleri
- **Üye Keşfetme / Arama (`Members.jsx`):** Tüm üyeler şehir, meslek, hobiler ve ilgi alanlarına göre aranabilir. **Harita Görünümü (OpenStreetMap & Leaflet Entegrasyonu):** Liste ve Harita görünümleri arasında geçiş yapılabilir. Harita görünümü, arama sonuçlarına uyan üyelerin hangi şehirlerde yoğunlaştığını (üye sayısını gösteren şık rozet-marker'lar ile) gösterir. Haritadaki bir şehir baloncuğuna tıklandığında üyeler otomatik olarak o şehre göre filtrelenir. Şehir koordinatları yerel önbellekten veya Nominatim API geocoding ile dinamik çözümlenir.
- **Arkadaşlık Sistemi (`Friends.jsx`):** Üyelere arkadaşlık isteği gönderilebilir. Gelen arkadaşlık istekleri onaylanabilir veya reddedilebilir. Arkadaş listesi yönetilebilir.

### 3. Etkinlikler ve Konum Arama
- **Genel ve Özel Etkinlikler:** Etkinlik oluştururken "Sadece Arkadaşlar" seçeneği (özel etkinlik) seçilebilir. Özel etkinlikler kartlarda kilit simgesiyle gösterilir. **Harita Görünümü (EventMap.jsx):** Etkinlikler listelenirken "Liste" ve "Harita" görünümleri arasında geçiş yapılabilir. Harita görünümünde etkinliklerin konumları dinamik olarak geocode edilerek harita üzerinde takvim pini olarak gösterilir. Pine tıklandığında etkinlik başlığı, tarihi ve detay butonu açılır.
- **RSVP:** 👍 Katılıyorum ve 👎 Katılmıyorum seçenekleri (Belki seçeneği kaldırılmıştır).
- **Konum Otomatik Tamamlama (`LocationInput.jsx`):** Etkinlik oluştururken yer ismi girilirken OpenStreetMap (Nominatim API) aracılığıyla konum önerileri (adres tamamlama) sunulur.

### 4. Forumlar ve Şehir Grupları
- **Sekmeli Yapı:** Kanallar sayfası "Genel Konular" ve "Şehir Grupları" olarak iki sekmeye ayrılmıştır.
- **Alt Forumlar / Konular:** Şehir grupları veya genel kanalların altında hiyerarşik alt kategoriler/forumlar oluşturulabilir.
- **Tasarım:** Konu başlıklarındaki eski hashtag (#) tasarımı kaldırılmış; bunun yerine büyük harfli, mavi çerçeveli, kolay okunabilir premium etiket (badge) tasarımı uygulanmıştır.
- **Admin Düzenleme Yetkisi:** Admin yetkisine sahip kullanıcılar kanal detay sayfalarında grup/alt grup adlarını ve açıklamalarını doğrudan inline olarak düzenleyebilirler.

### 5. Gelişmiş Admin Yönetimi (`Admin.jsx`)
- **Kullanıcı Onaylama & Yetkilendirme:** Kayıtlı kullanıcıları onaylama ve admin rolü tanımlama.
- **Hesap Askıya Alma / Dondurma:** "Dondurulanlar" sekmesi üzerinden kullanıcılar askıya alınabilir, dondurulabilir veya aktif hale getirilebilir.
- **Hesap Silme:** Adminler istenen kullanıcı hesabını ve profil kaydını tamamen sistemden silebilir.

### 6. Arayüz ve Tasarım
- **Header:** Sol üstteki başlık "Alamancı" olarak güncellendi.
- **Navigasyon:** Mobil görünüm için alt navigasyon barı (`BottomNav.jsx`), masaüstü için üst navigasyon barı (`TopNav.jsx`) aktiftir.
- **PWA Desteği:** Offline çalışma yeteneği için manifest ve service worker entegrasyonu mevcuttur.

### 7. Anlık Sohbet ve Haberleşme
- **Instagram Benzeri Yüzen Sohbet Kutusu (Floating Chat):** Ekranın sağ alt köşesinde yer alan yüzen bir mesajlaşma kutusu geliştirilmiştir. Daraltılmış durumda son aktif sohbetlerin avatarlarıyla birlikte kompakt bir görünüm sunar. Tıklandığında yukarı doğru genişleyerek son sohbetlerin listesini gösterir; sohbet başlatmak için tıklanabilir veya yeni bir sohbet başlatılabilir. Dileyen kullanıcılar sağ üstteki tam ekran (`↗`) butonuna tıklayarak tam sayfa mesajlar penceresine (`/mesajlar`) geçiş yapabilir.
- **Birebir DM (Direct Messaging):** Spam ve tacizlerin önlenmesi amacıyla **yalnızca arkadaş olan (accepted status)** üyeler birbirlerine özel mesaj gönderebilir. Üye kartlarından veya arkadaş listelerinden doğrudan sohbet başlatma butonu sadece arkadaşlar için gösterilir. Eski mesaj geçmişleri saklanır ancak arkadaşlıktan çıkarılan kişiler için mesaj yazma alanı kilitlenir. Mesajlar Supabase Realtime ile sayfa yenilenmeden anlık olarak iletilir.
- **Etkinlik Sohbet Odaları (Event Chat):** Her etkinlik sayfasında otomatik olarak canlı bir "Etkinlik Sohbeti" odası oluşturulur. Katılımcılar WhatsApp veya harici bir uygulamaya ihtiyaç duymadan etkinlik içi koordinasyonu buradan anlık olarak sağlayabilirler.

## Proje Yapısı
```
src/
  pages/
    Feed.jsx          — Ana sayfa, gönderi akışı ve gönderi paylaşma modalı
    Channels.jsx      — Kanallar ve şehir grupları sekmeli listesi
    ChannelDetail.jsx — Kanal ve alt forum içi gönderiler, inline admin düzenleme aracı
    Events.jsx        — Etkinlik listesi, özel etkinlik filtresi ve oluşturma modalı
    EventDetail.jsx   — Etkinlik detayları, katılımcılar ve RSVP
    Admin.jsx         — Kullanıcı onaylama, admin yetkisi verme, dondurma ve silme
    Friends.jsx       — Gelen arkadaşlık istekleri ve arkadaş listesi yönetimi
    Members.jsx       — Üye filtreleme/arama (şehir, meslek, hobi) ve arkadaş ekleme
    Messages.jsx      — Birebir mesajlaşma (DM) merkezi ve anlık sohbet geçmişi
    Profile.jsx       — Detaylı profil bilgileri düzenleme ve arkadaşlık sayfasına yönlendirme
    Login.jsx         — Giriş ekranı
    Register.jsx      — Şehir ve meslek zorunluluğu olan kayıt ekranı
    Pending.jsx       — Onay bekleyen kullanıcı ekranı
  components/
    PostCard.jsx      — Gönderi kartı (beğeni, yorum, düzenle, sil)
    CreatePostModal.jsx — Gönderi paylaşırken büyük harfli badge etiket seçimi
    LocationInput.jsx — Konum arama otomatik tamamlama bileşeni (OpenStreetMap)
    EventMap.jsx      — Etkinlik konumlarını interaktif haritada gösteren bileşen
    AutocompleteInput.jsx — Şehir ve meslek için otomatik tamamlama sunan dropdown bileşeni
    Layout.jsx        — Navigasyon ve sayfa sarmalı
    TopNav.jsx        — Masaüstü üst navigasyon barı
    BottomNav.jsx     — Mobil alt navigasyon barı
  contexts/
    AuthContext.jsx   — Oturum, kayıt parametreleri ve profil yönetimi
  lib/
    supabase.js       — Supabase istemci yapılandırması
```

## RLS Mimarisi ve Veritabanı
Sonsuz döngü (infinite recursion) sorunlarını önlemek için `security definer` fonksiyonları kullanılmıştır:
- `get_is_admin()` — Kullanıcının admin olup olmadığını kontrol eder.
- `get_is_approved()` — Kullanıcının onaylanıp onaylanmadığını kontrol eder.
- Politikalar (RLS) doğrudan `profiles` tablosunu sorgulamak yerine bu optimize edilmiş fonksiyonları çağırır.
- Arkadaşlık sorguları performansı ve güvenliği için JS düzeyinde profil eşleştirmeleriyle desteklenmiştir.
