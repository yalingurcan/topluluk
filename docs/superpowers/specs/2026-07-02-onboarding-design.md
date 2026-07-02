# Onboarding: Welcome Modal + "Alamancı Nedir?" Guide Section

## Purpose

Alamancı currently has no explanation, anywhere in the app, of *why* it
exists or *what* each feature is for. New (and existing) users land
straight on the Feed with no framing. This project adds:

1. A short welcome modal explaining the app's mission, shown to every
   user on every visit until they dismiss it once.
2. A dedicated guide section on the existing Help page (`/yardim`)
   that explains the mission in more depth and walks through each
   feature.

## Content & messaging (both surfaces should stay consistent with this)

**Mission statement:** Alamancı exists to organize the Turkish
community around a purpose-built app — one designed specifically for
Turkish migrants/expats in Germany, more useful than WhatsApp,
Instagram, or Facebook for finding each other, organizing, and
surfacing information and people relevant to building a life in
Germany. It's a guide for anyone trying to find their way here.

**Founder line:** Independently created, with no corporate
affiliation, by Dr. Yalın Gürcan and nurse Ebru Bozacı Gürcan, who
have lived in Germany since October 2019, now hold German and
Turkish dual citizenship, and live with their family in
Mönchengladbach.

The welcome modal leads with the mission and closes with a short
version of the founder line (credibility, not the focus). The Help
page guide section opens with a slightly fuller version of both
(mission + founder story together) before the feature cards.

## 1. Welcome modal

**Component:** new `src/components/WelcomeModal.jsx`.

**Trigger/persistence:** Rendered once near the app root — inside the
protected layout in `src/App.jsx` (alongside where `BottomNav` /
`FloatingChat` are rendered), so it shows regardless of which page an
approved user lands on. On mount, it checks
`localStorage.getItem('seenWelcomeModal')`. If not set, it renders
open. Dismissing it (either action below) sets
`localStorage.setItem('seenWelcomeModal', '1')` and closes it. This
mirrors the existing `hideFeedBanner` pattern in `Feed.jsx` — once
dismissed, it never shows again on that device/browser.

Only shown to approved users past the protected-route gate (not on
`/giris`, `/kayit`, `/beklemede`) — i.e. mounted inside the same
layout wrapper that already guards `/`, `/konular`, `/etkinlikler`,
etc. in `App.jsx`.

**Content:**
- Heading: something like "Alamancı'ya Hoş Geldiniz"
- 2–3 short paragraphs covering the mission statement above (Turkish,
  matching the app's existing tone/voice as seen in `Help.jsx`)
- Closing line with the founder credit (short form)

**Actions:**
- **"Rehberi Gör"** (primary) — sets the dismissed flag, closes the
  modal, and navigates to `/yardim` (using `useNavigate`).
- **"Anladım"** (secondary/text) — sets the dismissed flag and closes
  the modal, no navigation.
- An "×" close icon in the corner behaves the same as "Anladım".

**Styling:** Follow existing modal conventions in the codebase (reuse
whatever overlay/card pattern `UserProfileModal.jsx` or
`CreatePostModal.jsx` uses) — centered card, `--r-card` background,
terracotta (`primary-*`) accent color for the primary button, rounded
corners consistent with the rest of the app.

## 2. Help page guide section

**File:** `src/pages/Help.jsx` — add a new section above the existing
`SECTIONS`-driven FAQ accordion. Same route (`/yardim`), no new route
needed.

**Content, in order:**
1. Heading: "Alamancı Nedir ve Nasıl Kullanılır?"
2. Intro paragraph(s): mission statement + founder story (fuller
   version than the modal — can include the "since October 2019",
   dual citizenship, and Mönchengladbach details).
3. A responsive grid of feature cards (reusing the card visual style
   already used elsewhere, e.g. `bg-[var(--r-card)] rounded-2xl
   border border-[var(--r-border)]`), one per app function:

   | Feature | Route | Icon source |
   |---|---|---|
   | Ana Sayfa (Feed) | `/` | `HomeIcon` (BottomNav.jsx) |
   | Şehirler | `/sehirler` | `CityIcon` (BottomNav.jsx) |
   | Konular | `/konular` | `TopicsIcon` (BottomNav.jsx) |
   | Etkinlikler | `/etkinlikler` | `EventIcon` (BottomNav.jsx) |
   | Üyeler | `/uyeler` | member icon already used in `BottomNav.jsx` menuLinks |
   | Arkadaşlar | `/arkadaslar` | reuse/adapt an existing icon (check `Friends.jsx`/menu) |
   | Mesajlar | `/mesajlar` | reuse existing chat icon from `FloatingChat.jsx`/menu |
   | Profil & Gizlilik | `/profil` | profile icon from `BottomNav.jsx` menuLinks |

   Each card: icon, feature name, 1–2 sentence explanation of what
   it's for and why it matters for someone building a life in
   Germany (e.g. Şehirler → find and connect with people in your
   city; Konular → topic-based discussions; Etkinlikler → real-world
   meetups; Üyeler → browse/search the whole community; Arkadaşlar →
   your closer connections and close-friend privacy tier; Mesajlar →
   direct messaging with friend-request gating; Profil & Gizlilik →
   manage what others can see about you).

   Cards are informational only (no click-through required, though
   wrapping each in a `Link` to its route is a reasonable, low-risk
   addition consistent with how `Channels.jsx`/`Cities.jsx` cards
   already link out).

**Styling:** Match the existing Help page's visual language (it
already uses emoji-prefixed headings like "📜 Genel Kurallar" for
section titles) so the new section doesn't feel like a different
product.

## Out of scope

- No multi-step/carousel modal — a single-screen welcome modal only.
- No first-login-specific detection (no new DB column/flag) — persistence
  is purely local via `localStorage`, consistent with existing
  `hideFeedBanner`.
- No changes to the FAQ accordion content itself, only a new section
  added above it.
- No analytics/tracking of who viewed the guide.

## Testing

- Manual verification in the browser (per this project's `/run` and
  `/verify` conventions): confirm the modal appears on first load
  post-login, dismiss via each action, reload and confirm it does not
  reappear, clear `localStorage` and confirm it reappears. Confirm the
  Help page renders the new section correctly in both light and dark
  theme, and that feature card links navigate correctly.
