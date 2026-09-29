# Design Document — TerraGuard App
## Look, Colour, Visibility & Feel

**Purpose of this doc:** define exactly how the app should *look and feel* — separate from what it *does* (see PRD) or what it *conceptually is* (see Idea File). This is the reference to check against during Checkpoint 1 (UI/UX shell) of the roadmap.

**Design goal in one sentence:** simple enough that a first-time farmer isn't confused, distinctive enough that it doesn't feel like a generic template, and rich enough to feel trustworthy and premium — without ever feeling cluttered or "too much."

---

## 1. Design Philosophy

Three words guide every decision: **Simple. Distinct. Trustworthy.**

- **Simple** — one clear focal point per screen. If in doubt, remove an element rather than add one.
- **Distinct** — the app should not look like a bootstrap-default or generic admin dashboard. It should feel unmistakably "TerraGuard" — earthy, natural, quietly technical.
- **Trustworthy** — this app tells people whether their soil (and by extension, their food and health) is safe. The visual language should feel calm and credible, not playful/cartoonish, and not alarming/clinical either.

**The "rich but not too much" rule:** richness comes from *quality of detail* (good spacing, one well-chosen accent color, a nice photo/icon treatment, subtle depth via soft shadows) — not from *quantity of elements*. A screen with 4 well-placed things beats a screen with 10 average things.

---

## 2. Colour System

### 2.1 Brand anchor
Derived from the existing TerraGuard logo (green leaves + gold/brown "TG" monogram):

| Token | Light mode value (approx.) | Usage |
|---|---|---|
| `brand-green` | Medium natural green (`#4C8C5C`-ish) | Primary buttons, active nav item, headers, brand accents |
| `brand-green-dark` | Deep forest green (`#2F5C3A`-ish) | Hover/pressed states, headings on light backgrounds |
| `brand-gold` | Warm gold/soil brown (`#B8863B`-ish) | Secondary accents, icons, dividers, highlights — used sparingly |
| `bg-base` | Warm off-white / soft cream (`#FAF7F0`-ish) | Page background — never pure white, keeps warmth |
| `surface` | Slightly lighter/whiter card background (`#FFFFFF` or near-white) | Cards, panels |
| `text-primary` | Near-black warm grey (`#22221E`-ish) | Body text |
| `text-secondary` | Mid warm grey (`#6B6A63`-ish) | Captions, secondary info, timestamps |

### 2.2 Risk/status colours (fixed meaning — never reused elsewhere)
| Status | Colour | Meaning |
|---|---|---|
| Low / Safe | Green (`#3E9142`-ish, distinguishable from brand-green) | Soil is safe |
| Moderate / Warning | Amber (`#E0A526`-ish) | Caution advised |
| High / Unsafe | Red (`#C24C3D`-ish, warm red not harsh alarm-red) | Immediate attention |

These three colours are **reserved exclusively** for risk badges, the remediation status pill, and heatmap intensity — so a user learns "this colour always means this" and it's never diluted by using red/green for unrelated UI (e.g., don't use plain red for a generic "delete" button — use a neutral outline/icon instead, to keep red meaningful).

### 2.3 Dark mode
Dark mode should feel like "the same app at night in a field," not a different app — same accent hues, inverted base:

| Token | Dark mode value (approx.) | Notes |
|---|---|---|
| `bg-base` (dark) | Deep warm charcoal-green (`#141813`-ish), not pure black | Keeps the earthy identity even at night |
| `surface` (dark) | Slightly lighter charcoal (`#1E241C`-ish) | Cards stand out subtly from background |
| `brand-green` (dark) | Slightly brighter/lighter green than light mode's, for contrast against dark bg | Keep it recognizably "the same green" |
| `text-primary` (dark) | Warm off-white (`#F2EFE9`-ish) | Avoid pure white — reduces eye strain |
| Risk colours (dark) | Slightly desaturated/brightened versions of the light-mode Low/Moderate/High colours | Must retain clear differentiation from each other and stay legible on dark surfaces |

**Toggle placement:** a simple sun/moon icon toggle in the profile/settings area (and optionally in the top bar) — should feel like a normal system-level preference, not a hidden setting.

---

## 3. Typography

- **Headings/branding:** a serif or semi-serif display typeface, echoing the logo's serif "TerraGuard" wordmark — used only for the app name, screen titles, and the big risk-status headline. Not for body text (serif in long-form small text hurts readability on mobile).
- **Body/UI text:** a clean, highly legible sans-serif (system font stack is perfectly fine — no need to load a custom body font) — used for everything else: labels, buttons, data, notifications.
- **Sizing principle:** the single most important piece of information on any screen (e.g., "Low Risk," "Day 12 of remediation") should be the largest text on that screen. Never let a secondary label (like a date) be as visually loud as the primary status.
- **Avoid:** more than two typefaces total, all-caps for long text (fine for short labels/badges only), tiny (<14px) body text anywhere a farmer might need to read it in bright daylight on a phone.

---

## 4. Layout & Visibility Principles

- **Mobile-first, one clear focal point per screen.** The home screen's single job is to answer "is my soil okay?" — that answer (a big colour-coded status card) must be visible without scrolling.
- **Card-based structure** for test records: photo, risk badge, plot label, date, remediation status pill — consistent card shape reused everywhere (dashboard, list, detail) so the eye doesn't have to re-learn a new layout per screen.
- **Bottom navigation bar** (not a hamburger menu) with 4 icons max: Home, Map, Alerts, Profile — icon + short label, large enough tap targets (44px minimum) for outdoor/gloved use.
- **Contrast & visibility:** text and status colours must meet strong contrast against their background in *both* light and dark mode — this isn't just an accessibility nicety, it directly matters here because the app may be used in bright outdoor sunlight where low-contrast UI becomes unreadable. Favor higher contrast over subtlety when the two conflict.
- **Whitespace over density:** generous padding inside cards and between sections. Resist the urge to fit more on one screen — prefer a second screen/scroll over a cramped one.
- **Depth, used sparingly:** soft, low-opacity shadows on cards (not harsh drop-shadows) to create a gentle sense of layering — this is where "rich" comes from without adding visual noise.
- **Corners:** consistently rounded (moderate radius, not pill-everything and not sharp-everything) — reinforces the "friendly, organic" brand feeling from the leaf-based logo.

---

## 5. Iconography & Imagery

- **Icon style:** simple line icons (not filled/glyph-heavy), consistent stroke width — reuse the visual language already established in the pitch deck's "Healthy Soil / Early Detection / Safe Food / Empower Farmers / Sustainable Future" icon row for continuity between the pitch materials and the actual app.
- **Photography:** the soil-test reaction photos are real data, not decoration — display them cleanly in a rounded-corner frame, no filters or overlays that could obscure the actual colour result (since colour is literally the data being communicated).
- **Illustration use:** minimal — a small amount of organic/leaf-motif decoration (e.g., a subtle background texture or a leaf accent near empty states) is welcome for warmth, but should never compete with real data for attention.

---

## 6. Component Notes (style guide, not code)

- **Buttons:** primary action = solid `brand-green` fill, rounded, clear label (no icon-only primary buttons). Secondary/tertiary actions = outline or text-only, using `brand-gold` or neutral grey — never a second solid green competing with the primary button.
- **Risk badge:** a pill-shaped tag using the fixed Low/Moderate/High colours (Section 2.2), always paired with the word itself (not colour alone) — for clarity and accessibility.
- **Remediation toggle:** a standard on/off switch component; when ON, its track uses `brand-green`; when OFF, a neutral grey — paired with the elapsed-day text directly beside it so the two pieces of information are visually grouped.
- **Notification badge:** a small dot/count on the bell icon in the nav — unread notifications listed with a subtle highlighted background, read ones plain.
- **Map/heatmap:** base map kept muted/desaturated so the colour-coded data points (Low/Moderate/High) are what visually pops — the map itself should recede, the data should lead.
- **Empty states** (e.g., no tests yet): friendly, brief text + a small leaf/soil illustration + a clear call-to-action — never just a blank screen.

---

## 7. What to Deliberately Avoid

- Overly saturated/neon colours — keeps the earthy, credible feel.
- More than one accent colour competing for attention on a single screen.
- Dense data tables as a primary view (raw ppm tables can exist in an optional "advanced/detail" view, not the main flow).
- Generic default component styling (unstyled default HTML buttons/inputs, default Tailwind blue) — everything should be re-themed to the palette above, even simple form inputs.
- Dark mode that's just "light mode with inverted colours" — it should feel intentionally designed for low light, with true dark (not grey) backgrounds and slightly adjusted accent brightness.

---

## 8. Quick Reference Checklist (use at Checkpoint 1)

- [ ] Home screen shows one big, unmistakable status card with no scrolling needed.
- [ ] Risk colours (green/amber/red) are used *only* for risk/status — nowhere else.
- [ ] Light and dark mode both tested for text contrast, especially on the status card.
- [ ] Bottom nav has ≤4 items, large tap targets.
- [ ] Only one serif heading font + one sans body font in use.
- [ ] Cards are visually consistent across dashboard, list, and detail views.
- [ ] No default/unstyled browser form elements remain.
