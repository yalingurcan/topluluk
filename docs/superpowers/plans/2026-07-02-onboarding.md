# Onboarding (Welcome Modal + Help Guide Section) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dismissible welcome modal explaining Alamancı's mission (shown to every user until dismissed once) plus a new "Alamancı Nedir ve Nasıl Kullanılır?" guide section on the Help page, per `docs/superpowers/specs/2026-07-02-onboarding-design.md`.

**Architecture:** Two small additions to an existing React + Vite + Tailwind SPA. A new self-contained `WelcomeModal` component mounts inside the already-existing protected `Layout`, gated the same way `FloatingChat` is (only for approved profiles). It manages its own open/dismissed state via `localStorage`, mirroring the existing `hideFeedBanner` pattern in `Feed.jsx`. The Help page gets a new static content section inserted above its existing FAQ accordion — no new route, no new state beyond what already exists on that page.

**Tech Stack:** React 18, react-router-dom v6, Tailwind CSS (with the project's `--r-*` CSS custom properties and `primary-*` terracotta palette), no test runner (verify manually via `npm run dev`).

## Global Constraints

- No test framework exists in this repo (confirmed via `package.json` — no test script, no `*.test.*` files). Every task's "verify" step is a manual check against the running dev server (`npm run dev`, already running at `http://localhost:5173/` per this session) instead of an automated test run.
- Match existing visual conventions exactly: modal overlay/card classes copied from `src/components/UserProfileModal.jsx:122-123`; icons copied verbatim (same `d` attributes) from `src/components/BottomNav.jsx` and `src/components/Layout.jsx` — do not invent new icon paths.
- All user-facing copy is Turkish, matching the tone already used in `src/pages/Help.jsx`.
- Terracotta primary color only (`primary-500`/`primary-600`/`bg-primary-500/10` etc., or `var(--r-*)` tokens) — no indigo/purple.
- `WelcomeModal` only renders for `profile.status === 'approved'` — same gating condition already used for `FloatingChat` in `Layout.jsx:100`.

---

## Task 1: Create the `WelcomeModal` component

**Files:**
- Create: `src/components/WelcomeModal.jsx`

**Interfaces:**
- Consumes: nothing from other new code (uses `react-router-dom`'s `useNavigate`, plain `localStorage`).
- Produces: default export `WelcomeModal` (no props) — a self-contained component with no external state dependency, for Task 2 to import and render.

- [ ] **Step 1: Write the component**

```jsx
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
```

- [ ] **Step 2: Verify the file has no syntax errors**

Run: `cd "/Users/yalingurcan/Desktop/Claude Code/Community" && node --input-type=module -e "$(cat src/components/WelcomeModal.jsx | sed 's/^import.*$//' )" 2>&1 | head -5 || true`

This is a rough smoke check only (JSX won't actually execute under plain node); the real verification happens visually in Task 2's step once it's mounted in the app. Skip further static checks here — proceed to Task 2.

- [ ] **Step 3: Commit**

```bash
cd "/Users/yalingurcan/Desktop/Claude Code/Community"
git add src/components/WelcomeModal.jsx
git commit -m "feat: add WelcomeModal component explaining Alamancı's mission"
```

---

## Task 2: Mount `WelcomeModal` in the protected layout

**Files:**
- Modify: `src/components/Layout.jsx:1-7` (imports), `src/components/Layout.jsx:100-103` (render)

**Interfaces:**
- Consumes: `WelcomeModal` default export from Task 1 (`src/components/WelcomeModal.jsx`).
- Produces: nothing new consumed by later tasks — this is the mounting point, verified visually.

- [ ] **Step 1: Add the import**

In `src/components/Layout.jsx`, after the existing `UserProfileModal` import (line 7), add:

```jsx
import UserProfileModal from './UserProfileModal'
import WelcomeModal from './WelcomeModal'
```

- [ ] **Step 2: Render it next to `FloatingChat`, gated the same way**

Find this block (currently lines 100-103):

```jsx
      {profile && profile.status === 'approved' && <FloatingChat />}
      <BottomNav />
      <PWAInstallPrompt />
      <UserProfileModal />
    </div>
  )
}
```

Replace with:

```jsx
      {profile && profile.status === 'approved' && <FloatingChat />}
      {profile && profile.status === 'approved' && <WelcomeModal />}
      <BottomNav />
      <PWAInstallPrompt />
      <UserProfileModal />
    </div>
  )
}
```

- [ ] **Step 3: Manually verify in the browser**

The dev server should already be running at `http://localhost:5173/` (started earlier this session via `npm run dev`). If it isn't running, start it:

```bash
cd "/Users/yalingurcan/Desktop/Claude Code/Community" && npm run dev
```

Then, using the `claude-in-chrome` or `playwright` browser tool (load tools via `ToolSearch` if deferred):
1. Navigate to `http://localhost:5173/` while logged in as an approved user.
2. Confirm the welcome modal appears centered with the mission text, founder line, and both buttons ("Anladım" and "Rehberi Gör").
3. Click "Rehberi Gör" — confirm it navigates to `/yardim` and the modal closes.
4. Reload the page — confirm the modal does NOT reappear (dismissed state persisted).
5. In the browser devtools console, run `localStorage.removeItem('seenWelcomeModal')`, then reload — confirm the modal reappears.
6. Click "Anladım" this time — confirm it dismisses without navigating away from the current page.
7. Toggle dark mode (moon/sun icon in the mobile header or side menu) and re-trigger the modal (clear the localStorage key again) — confirm text is legible and colors use the terracotta palette, not indigo/purple, in both themes.

- [ ] **Step 4: Commit**

```bash
cd "/Users/yalingurcan/Desktop/Claude Code/Community"
git add src/components/Layout.jsx
git commit -m "feat: mount WelcomeModal in the protected app layout"
```

---

## Task 3: Add the "Alamancı Nedir ve Nasıl Kullanılır?" guide section to the Help page

**Files:**
- Modify: `src/pages/Help.jsx:1` (imports), `src/pages/Help.jsx:3` (new constant before `SECTIONS`), `src/pages/Help.jsx:106-128` (render)

**Interfaces:**
- Consumes: nothing from other tasks (fully self-contained within `Help.jsx`).
- Produces: nothing consumed elsewhere — this is a leaf UI change.

- [ ] **Step 1: Add the `Link` import**

At the top of `src/pages/Help.jsx`, change:

```jsx
import { useState } from 'react'
```

to:

```jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
```

- [ ] **Step 2: Add the `GUIDE_FEATURES` constant**

Immediately before the existing `const SECTIONS = [` line (line 3), insert:

```jsx
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
```

- [ ] **Step 3: Insert the guide section into the page render**

Find the existing `export default function Help()` block (currently lines 106-128):

```jsx
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
```

Replace with:

```jsx
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
```

- [ ] **Step 4: Manually verify in the browser**

Using the browser tool (dev server already running at `http://localhost:5173/`):
1. Navigate to `/yardim`.
2. Confirm the new "Alamancı Nedir ve Nasıl Kullanılır?" section renders above the existing FAQ accordion, with the mission/founder paragraphs and an 8-card grid (Ana Sayfa, Şehirler, Konular, Etkinlikler, Tüm Üyeler, Arkadaşlar, Mesajlar, Profil & Gizlilik).
3. Click 2-3 of the cards and confirm each navigates to its correct route (e.g. "Şehirler" card → `/sehirler`).
4. Confirm the existing FAQ accordion below still expands/collapses correctly (regression check — untouched code, but confirm the insertion didn't break the render).
5. Toggle dark mode and confirm the new cards remain legible and use terracotta accents, not indigo/purple.

- [ ] **Step 5: Commit**

```bash
cd "/Users/yalingurcan/Desktop/Claude Code/Community"
git add src/pages/Help.jsx
git commit -m "feat: add Alamancı mission + feature guide section to Help page"
```

---

## Task 4: Final end-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Full manual walkthrough**

With the dev server running at `http://localhost:5173/`:
1. Clear `localStorage` entirely (devtools console: `localStorage.clear()`) and reload as an approved user.
2. Confirm the welcome modal appears once, on whatever page loads first.
3. Click "Rehberi Gör" — confirm landing on `/yardim` with the modal closed and the new guide section visible.
4. Navigate to a different page (e.g. `/etkinlikler`) and reload — confirm the modal does not reappear.
5. Confirm no console errors were introduced (check via `read_console_messages` browser tool if available).

- [ ] **Step 2: Push (only if the user has asked for it in this session)**

Per this project's git workflow, do not push unless explicitly requested — commits from Tasks 1-3 are already local. Confirm with the user before running `git push`.
