# NatureWays — Project Context for Claude Code

## Project Overview

**Client:** NatureWays  
**URL:** natureways.id  
**Tagline:** Journeys That Realign  
**Style:** Kinfolk editorial — minimal, photography-first, generous whitespace  
**Primary font:** Libre Baskerville (Google Fonts)

---

## Brand & Design

### Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Warm Ivory | `#FBF9F4` | Page background (60%) |
| Linen | `#F5F1E8` | Cards / section backgrounds |
| Cream | `#F2EBDD` | Secondary backgrounds |
| Forest Green | `#334A24` | Body text, buttons (25%) |
| Deep Pine | `#223A14` | Headings |
| Moss Green | `#677842` | Button hover, accents (10%) |
| Soft Olive | `#758561` | Secondary text, labels |
| Sage Mist | `#A2AC96` | Dividers, subtle UI |
| Warm Gray Green | `#879375` | Tertiary text |
| Brass | `#B79C63` | Accent, highlights (5%) |
| Sand | `#E8DFC9` | Borders |

**Color ratio rule:** 60% Ivory · 25% Forest Green · 10% Moss Green · 5% Brass

### Photography Style
- Low saturation (`filter: saturate(0.7–0.75)`)
- Soft brightness (`filter: brightness(0.85–0.92)`)
- Subjects: forests, natural light, food, calm landscapes, people in nature
- Mood: soft daylight, warm whites, matte finish, calm & timeless

### Typography
- **Font:** `Libre Baskerville` (regular 400, italic 400, bold 700)
- **Headings:** deep-pine `#223A14`, low letter-spacing, generous line-height
- **Labels/nav:** 9–10px, letter-spacing 0.2–0.35em, uppercase
- **Body:** 0.88–0.95rem, line-height 1.8–1.85, color `#334A24`

---

## Site Structure

```
├── FOOD
│   ├── Articles
│   ├── Seasonal Living
│   ├── Nature-Based Recipes
│   ├── Farm & Producer Stories
│   └── Places to Eat
├── SPACE
│   ├── Architecture
│   ├── Landscape
│   ├── Hospitality
│   ├── Home & Living
│   └── Environmental Psychology
├── NATURE
│   ├── Forest Bathing
│   ├── Nature & Wellbeing
│   ├── Slow Travel
│   ├── Wilderness Psychology
│   └── Field Notes
├── WORKSHOP
│   ├── Nature Reset
│   ├── Road Trip Experiences
│   ├── Forest Immersion
│   ├── Private Sessions
│   └── Upcoming Events
├── ABOUT
│   ├── Our Philosophy
│   ├── Founder
│   ├── What We Do
│   └── Collaborations
└── CONTACT
```

---

## Architecture (updated — CMS integration complete)

The site is now CMS-driven: a self-hosted **Strapi** backend + a small **Express/EJS** frontend, chosen specifically to keep the original hand-coded HTML/CSS/JS intact (no React/JSX rewrite, no static-site build/rebuild pipeline). Content edits made in Strapi appear on refresh with no server restart.

```
Natureways.id/
├── index.html              ← original static file, kept as design/parity reference (no longer served)
├── CLAUDE.md               ← this file
├── design guideline.jpeg
├── reference web oryza.jpeg
│
├── cms/                     ← Strapi project (content backend, admin UI at :1337/admin)
│   ├── seed-assets/          source images for the bootstrap seed (re-download-able)
│   └── src/
│       ├── api/               content-types: homepage, site-setting, article, pillar, subcategory
│       ├── components/        homepage.pillar, shared.{ticker-item,journal-image,nav-link}
│       └── bootstrap/         set-public-permissions.js + seed.js (run automatically on first `develop`/`start`)
│
└── frontend/                ← Express + EJS project (public site, :3000)
    └── src/
        ├── server.js
        ├── routes/homepage.js       fetches from Strapi, renders index.ejs
        ├── services/strapiClient.js populate queries + mediaUrl() helper
        ├── views/index.ejs + partials/{nav,footer}.ejs
        └── public/{css/style.css, js/main.js}   ← extracted verbatim from the original index.html
```

**Why this stack**: Astro/Next.js alternatives were rejected because they'd force decomposing the hand-tuned CSS/markup into components and adopting a build step; WordPress was rejected because reproducing this bespoke design as a theme risks layout drift past "edit content, not layout." EJS templates are close to 1:1 with the original HTML — only literal text/URLs became `<%= %>` — so the design stays pixel-identical while content becomes editable. Express also gives a natural home for future payment-gateway webhook routes in the same app.

### Content-type schema (Strapi)

- **`homepage`** (single type) — one entry, grouped by section: hero fields, `tickerItems` (repeatable), `pillars` (repeatable component: number/title/image/link), feature-story fields, `philosophyQuote`/`philosophyAttribution`, workshop-CTA fields, `journalImages` (repeatable), `recentArticles` (relation → article, curated not auto-latest).
- **`site-setting`** (single type) — `siteName`, `tagline`, `navLinks`, three footer link-list components, `footerBrandDesc`, `footerCopyrightText`, `socialLinks`. Shared across current + future pages.
- **`article`** (collection, draft/publish enabled) — `title`, `slug`, `excerpt`, `body` (rich text, unused on homepage today but ready for article detail pages), `coverImage`, `publishDate`, `pillar`/`subcategory` relations, `featured`, `author`.
- **`pillar`** / **`subcategory`** (collections) — real content types, not enums, modeling the full FOOD/SPACE/NATURE/WORKSHOP taxonomy below (seeded with all ~19 subcategories already) so future landing pages don't need a schema migration.

Editing scope is deliberately **section content only** — layout, spacing, and the CSS custom-property palette are not CMS-editable, matching the "edit text/images in existing sections, not a page builder" requirement.

### Local development

```
cd cms && npm run develop      # Strapi admin: http://localhost:1337/admin
cd frontend && npm run dev     # site: http://localhost:3000
```

First run auto-seeds all content (matching the original static copy) and grants public read permissions — see `cms/src/bootstrap/`. An admin account already exists for `juppyjp@gmail.com` (password set at creation time — reset it via the admin UI or `npx strapi admin:reset-user-password` before this ever goes further than local dev).

### Not built yet (documented direction only)

- **VPS deployment**: both processes under pm2/systemd, Nginx reverse-proxying the site and admin, Let's Encrypt TLS, SQLite persisted in backups (Postgres only if multi-editor concurrency is needed), local `/uploads` media (S3/R2/Spaces later if the photo library grows large).
- **Payment gateway (Midtrans/Xendit)**, for paid workshops: future `workshop` + `booking`/`order` Strapi collection types, plus Express routes `POST /workshop/:id/checkout` and `POST /webhooks/midtrans`. This is exactly why Express (not static hosting) was chosen — no architecture change needed when this gets built, only additive routes/content types.

---

## Homepage Sections (original design reference)

The section-by-section design below is unchanged from the original static build — it now just pulls its content from Strapi instead of being hardcoded. No build tools, no framework on the frontend — plain HTML/CSS/JS rendered via EJS.

Sections in order:
1. **Nav** — fixed, transparent → frosted on scroll. Logo left, links center, domain right.
2. **Hero** — 50/50 split: photo left, text + CTA right.
3. **Ticker** — dark green marquee with pillar keywords + brass `✦` dividers.
4. **4-Pillar Grid** — 4-column image grid (Food, Space, Nature, Workshop) with overlay titles.
5. **Feature Story** — 55/45 split, photo left, editorial text right. Currently: Forest Bathing.
6. **Article Cards** — 3-column grid with category, date, title, excerpt.
7. **Philosophy Quote** — full-width dark section with centered italic quote.
8. **Workshop CTA** — 50/50 split: photo left, forest-green panel + CTA right.
9. **Photo Grid** — 5-column square grid (Instagram / field notes style).
10. **Footer** — 4-column: brand desc, Explore links, About links, Connect links.

---

## Design Conventions

- **No frameworks** (no Tailwind, no Bootstrap). Pure CSS with CSS variables.
- **CSS variables** defined in `:root` — always use them, never hardcode hex values.
- **Scroll reveal** — elements use `.reveal` class + IntersectionObserver → `.visible`.
- **Image treatment** — always apply `filter: saturate(0.7x) brightness(0.8x)` to images.
- **Hover transitions** — `0.2s–0.7s ease`, subtle scale on images (`scale(1.04)`).
- **Spacing rhythm** — sections use `padding: 100px 0`. Container max-width `1280px`, padding `0 40px`.
- **Labels** — 9–10px, `letter-spacing: 0.25–0.35em`, uppercase, color `var(--olive)`.
- **Buttons** — no border-radius (square corners). Dark: bg `var(--forest)`, hover `var(--moss)`. Light: bg `var(--ivory)`.
- **Dividers** — `width: 40px; height: 1px; background: var(--sage)`.

---

## Reference

- **Style reference:** [Lean Timms](https://leantimms.com) — minimal, editorial, large photography, sparse typography, left-aligned nav.
- **Brand style:** Kinfolk magazine aesthetic.
- **Logo:** NatureWays wordmark with leaf/hands icon (see `design guideline.jpeg`).

---

## What's Next (suggested)

- [x] CMS integration — Strapi + Express/EJS, local dev verified (parity + live-edit loop)
- [ ] Real photography + copy swap-in (client replaces the seeded Unsplash placeholders via Strapi's Media Library)
- [ ] Inner page template (article/category layout) — `article`, `pillar`, `subcategory` content types are already schema-ready for this
- [ ] Mobile hamburger menu
- [ ] About page
- [ ] Workshop / Events page
- [ ] Contact page
- [ ] VPS deployment (pm2 + Nginx + TLS — see Architecture section above)
- [ ] Payment gateway integration for paid workshops (Midtrans/Xendit — see Architecture section above)
