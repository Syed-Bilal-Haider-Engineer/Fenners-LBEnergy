---
version: alpha
name: LBenergy-brand-guideline
description: A confident clean-tech identity for LBenergy GmbH (lbenergy.tech). The system is built on one signature diagonal gradient — Ocean blue sweeping into Coral (#19567b → #ff6148) — set against bright, airy white surfaces. Barlow's geometric grotesque carries every headline in Bold 700, with emphasized words rendered uppercase and filled with a Sky→Ember text gradient. Energy is suggested by soft radial coral/blue glows and 45° rotated-square "spark" motifs rather than by clutter; calls-to-action are sharp-cornered solid-coral blocks. The mood is technical, optimistic, and trustworthy — German-engineering precision applied to mobile heating.

# SOURCE NOTE: Colors, gradients, the Barlow typeface, and the core button/heading
# grammar below are extracted from the live production CSS at https://lbenergy.tech.
# The numeric type scale, spacing scale, radius steps beyond the few observed values,
# breakpoints, and component padding are standardized/inferred to form a usable system
# (flagged in "Known Gaps"). Replace inferred values with the official brand book if one exists.

colors:
  primary: "#ff6148"          # Coral — THE brand action color (CTAs, accents, glows)
  primary-press: "#f24227"    # Ember — pressed coral + gradient partner
  ocean: "#19567b"            # mid teal-blue — primary gradient partner
  navy: "#1e4268"             # deep brand blue — text on light chips, dark sections
  sky: "#0b75b7"              # bright blue — headline text-gradient partner
  ink: "#191919"              # near-black — headings & body on light
  body: "#191919"
  body-muted: "#8f8f9d"       # secondary / supporting copy (cool gray)
  body-muted-warm: "#8f8f8f"  # neutral gray for captions
  on-primary: "#ffffff"       # text on coral
  on-dark: "#ffffff"          # text on ink / photographic surfaces
  canvas: "#ffffff"           # dominant page surface
  canvas-mist: "#f1f1f1"      # alternating light section / card fill
  surface-ink: "#191919"      # dark panel / footer surface
  surface-black: "#000000"    # true void — video, edge overlays
  hairline: "#cacaca"         # default 1px border
  hairline-soft: "#d8d8d8"    # softer divider
  hairline-soft-2: "#d5d5d5"  # softest divider

gradients:
  brand: "linear-gradient(45deg, #19567b, #ff6148)"          # Ocean → Coral — hero panels, feature highlights, the signature
  headline-text: "linear-gradient(45deg, #0b75b7, #f24227)"  # Sky → Ember — clipped to emphasized headline words (transparent fill)
  glow-coral: "radial-gradient(#ff6148 0%, transparent 60%)" # atmospheric coral halo behind hero subject
  glow-ocean: "radial-gradient(#19567b 0%, transparent 60%)" # atmospheric blue halo, balances the coral

typography:
  hero-display:        # inferred size; weight/line-height/transform are real
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: 0
    textTransform: "uppercase (emphasized words)"
  display-lg:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  section-head:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  subhead:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  eyebrow:             # the gradient-filled label/kicker above headlines
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 1px
    textTransform: uppercase
  lead:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 300
    lineHeight: 1.5
    letterSpacing: 0
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-strong:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.6
    letterSpacing: 0
  button:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: 0.5px
    textTransform: uppercase
  nav-link:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: 0
  caption:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  fine-print:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  none: 0px       # primary CTA buttons (real — border-radius:0)
  sm: 5px         # decorative inset frames (real — 0.3125rem)
  md: 6px         # decorative inset frames (real — 0.375rem)
  lg: 12px        # cards / media (inferred)
  pill: 9999px    # optional pill chips (inferred — not dominant in the brand)

spacing:          # 8px base — inferred/standardized
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-cta:
    backgroundColor: "{colors.primary}"
    borderColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 14px 32px
  button-cta-press:
    backgroundColor: "{colors.primary-press}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.none}"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    borderColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 14px 32px
  button-on-image:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.navy}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 14px 32px
  text-link:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.body}"
  eyebrow-gradient:
    backgroundColor: transparent
    textColor: "{gradients.headline-text}"   # applied via background-clip:text + transparent fill
    typography: "{typography.eyebrow}"
  global-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 72px
  hero-panel:
    backgroundColor: "{colors.canvas}"
    backdrop: "{gradients.glow-coral} + {gradients.glow-ocean}"
    textColor: "{colors.ink}"
    typography: "{typography.hero-display}"
    padding: "{spacing.section}"
  hero-panel-gradient:
    backgroundColor: "{gradients.brand}"
    textColor: "{colors.on-dark}"
    typography: "{typography.hero-display}"
    padding: "{spacing.section}"
  spark-diamond:                              # decorative 45° rotated square
    backgroundColor: "{colors.primary}"
    transform: "rotate(-45deg)"
    rounded: "{rounded.none}"
  feature-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.subhead}"
    rounded: "{rounded.lg}"
    padding: 24px
  feature-card-mist:
    backgroundColor: "{colors.canvas-mist}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
  trust-seal-row:                             # BSFZ / AVPQ certification logos
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body-muted}"
    typography: "{typography.caption}"
  footer:
    backgroundColor: "{colors.surface-ink}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body}"
    padding: 64px
---

## Overview

LBenergy GmbH sells the **Intelligent Heat Link (IHL)** — an AI-driven controller that cuts the operating cost of mobile/temporary heating by 20–30 % while holding the room at an optimal climate. The brand has to feel **two things at once: technically credible and effortlessly simple.** The visual system delivers this by keeping surfaces bright and uncluttered, then injecting energy through one disciplined device: the **Ocean → Coral diagonal gradient** (`{gradients.brand}`).

The page is a stack of airy, mostly-white sections. Heat and motion are implied — not with busy decoration but with **soft radial glows** (`{gradients.glow-coral}`, `{gradients.glow-ocean}`) bleeding behind the hero subject, and small **45° rotated-square "spark" accents** (`{component.spark-diamond}`) in coral. Headlines are set in **Barlow Bold 700**, and the one or two words that carry the value proposition are rendered **uppercase and filled with the Sky → Ember text gradient** (`{gradients.headline-text}`) — the single most recognizable type move in the brand. Action is always **solid coral with sharp (0px) corners** (`{component.button-cta}`): the hard edge reads as engineered and decisive, the opposite of a soft consumer pill.

Coral (`{colors.primary}` #ff6148) is the protagonist; the blues (`{colors.ocean}`, `{colors.navy}`, `{colors.sky}`) are the supporting cast that keep the warmth from tipping into alarm. White space does the rest of the work. The result is a clean-tech identity that looks like precision instrumentation — confident, optimistic, and quietly German-engineered.

**Key Characteristics:**
- One signature gradient: **Ocean → Coral, 45°** (`{gradients.brand}`) — used for hero panels and key highlights.
- **Coral is the only action color.** Every CTA is solid coral with **0px corners** (`{rounded.none}`) — the sharp edge is a brand signal.
- **Barlow** everywhere (Light 300 / Regular 400 / Bold 700). Headlines are Bold 700; emphasized words go **uppercase + Sky→Ember gradient text** (`{gradients.headline-text}`).
- **Glow, not clutter.** Energy is implied through radial coral/blue halos and 45° "spark" diamonds, never through heavy illustration or borders.
- Bright, airy, **predominantly white** canvas; `{colors.canvas-mist}` (#f1f1f1) provides gentle section rhythm; `{colors.surface-ink}` (#191919) anchors the footer.
- **Trust is visible**: certification seals (BSFZ, AVPQ) and safety/quality language are part of the identity, not an afterthought.
- Blues prevent the coral from reading as "warning" — coral = energy/heat, blue = control/efficiency.

## Brand Voice & Messaging

> Audience: German-speaking B2B decision-makers (facility, events, construction, energy). Primary language: **German**. Tone: confident, benefit-led, plain-spoken, safety-and-quality conscious — never hypey.

- **Company:** LBenergy GmbH · **Product:** Intelligent Heat Link (IHL) · sub-components "Sensor-Box und Software".
- **Tagline (hero H1):** *"Die erste smarte Steuerung für mobile Heizgeräte."*
- **Value proposition (hero subhead):** *"Mit dem Intelligent Heat Link von LB Energy können die Betriebskosten mobiler Heizgeräte um 20–30 % gesenkt werden – bei jederzeit optimalem Raumklima und reduzierter Umweltbelastung."*
- **Section promise:** *"Energiesparend Heizen – einfach, flexibel, sicher."* and *"Alle Vorteile im Überblick."*
- **Signature phrases / lexicon:** "KI-gestützte Verarbeitung", "höchsten Qualitäts- und Sicherheitsansprüchen", "Im Handumdrehen angeschlossen".
- **Navigation labels:** Funktionen · Vorteile · Das Produkt · Kontakt · Login.
- **Voice rules:**
  - Lead with the **number** (20–30 %), then the **comfort** (optimal climate), then the **planet** (reduced impact) — in that order.
  - Pair every efficiency claim with a **safety/quality reassurance** ("höchsten Sicherheitsansprüchen").
  - Keep sentences short and declarative. Prefer concrete verbs ("anschließen", "senken", "steuern") over abstractions.
  - Emphasis = **one word**, not a phrase. The uppercase gradient treatment loses power if overused.

## Colors

> **Source:** extracted from the production stylesheet at lbenergy.tech. Coral and the Ocean/Sky/Ember blues are the live brand palette; grays are the supporting neutrals found in the same CSS. WordPress/Gutenberg default-palette swatches in the page markup were discarded as non-brand.

### Brand & Accent
- **Coral** (`{colors.primary}` — #ff6148): The brand. Every CTA fill and border, accent underlines, the warm pole of the brand gradient, and the radial hero glow. If a user can click it or it signals "energy," it is this coral.
- **Ember** (`{colors.primary-press}` — #f24227): A deeper red-orange sibling. The pressed state of coral, and the warm end of the **headline text gradient** (`{gradients.headline-text}`).
- **Ocean** (`{colors.ocean}` — #19567b): Mid teal-blue. The cool pole of the **brand gradient** (`{gradients.brand}`) and of the balancing radial glow. Conveys "control / efficiency."
- **Navy** (`{colors.navy}` — #1e4268): Deepest brand blue. Text color for buttons/labels that sit on white chips over imagery, and a fill for occasional dark accent blocks.
- **Sky** (`{colors.sky}` — #0b75b7): Brightest blue. The cool end of the **headline text gradient** — pairs with Ember to fill emphasized words.

### Surface
- **White** (`{colors.canvas}` — #ffffff): The dominant canvas. Hero, feature sections, cards.
- **Mist** (`{colors.canvas-mist}` — #f1f1f1): The signature off-white for alternating sections and card fills — just enough contrast to create rhythm against pure white.
- **Ink Panel** (`{colors.surface-ink}` — #191919): Footer and occasional dark editorial bands; lets coral pop at maximum contrast.
- **Black** (`{colors.surface-black}` — #000000): Reserved for true void — embedded video frames and full-bleed photographic overlays.

### Text
- **Ink** (`{colors.ink}` — #191919): Headlines and body on light surfaces. Near-black, not pure black, to keep the page feeling bright rather than printed.
- **Muted Cool** (`{colors.body-muted}` — #8f8f9d): Secondary/supporting copy and captions with a faint cool cast.
- **Muted Neutral** (`{colors.body-muted-warm}` — #8f8f8f): Neutral-gray captions, metadata, disabled labels.
- **On Coral / On Dark** (`{colors.on-primary}` / `{colors.on-dark}` — #ffffff): Text on coral buttons, dark panels, and the footer.

### Hairlines & Borders
- **Hairline** (`{colors.hairline}` — #cacaca): Default 1px divider/border.
- **Hairline Soft** (`{colors.hairline-soft}` — #d8d8d8) and **Soft-2** (`{colors.hairline-soft-2}` — #d5d5d5): Progressively quieter dividers for low-emphasis separation.

### Brand Gradients
Unlike a flat-color brand, **gradients are core to LB Energy's identity** — they are where the "energy" lives.
- **Brand Gradient** (`{gradients.brand}` — `linear-gradient(45deg, #19567b, #ff6148)`): Ocean at the lower-left flowing to Coral at the upper-right. Hero panels, key feature highlights, and any surface that should feel "alive." This single sweep — cool control warming into heat — *is* the product story in one visual.
- **Headline Text Gradient** (`{gradients.headline-text}` — `linear-gradient(45deg, #0b75b7, #f24227)`): Applied to emphasized headline words via `background-clip: text` + transparent fill (Sky → Ember). The signature typographic emphasis.
- **Coral Glow** (`{gradients.glow-coral}` — `radial-gradient(#ff6148 0%, transparent 60%)`) and **Ocean Glow** (`{gradients.glow-ocean}`): Soft atmospheric halos placed behind the hero subject for warmth and depth without hard chrome.

## Typography

### Font Family
- **Primary (everything):** **Barlow** — a low-contrast geometric grotesque, self-hosted by LB Energy as `Barlow-Light.woff2/woff` (300), `Barlow-Regular.woff2/woff` (400), and `Barlow-Bold.woff2/woff` (700). Barlow's slightly condensed, engineered feel matches the "precision instrument" positioning.
- **Icons:** Font Awesome (Solid / Regular / Thin) for UI and feature glyphs.
- **Weights in play:** 300 (airy leads), 400 (body), 700 (all headings, buttons, emphasis). **No 500/600** — the ladder is 300 / 400 / 700.

### Hierarchy

> Real (from CSS): all headings are **Barlow 700, line-height 1.2**; emphasized `span` words are **uppercase with the Sky→Ember gradient text fill**; emphasized `strong` words are **uppercase**; body is **Barlow 400**. Pixel sizes below are a standardized scale (inferred) — adjust to the official spec if available.

| Token | Size | Weight | Line Height | Transform | Use |
|---|---|---|---|---|---|
| `{typography.hero-display}` | 56px | 700 | 1.1 | emphasized word → UPPERCASE + gradient | Hero H1 |
| `{typography.display-lg}` | 40px | 700 | 1.2 | — | Major section headlines |
| `{typography.section-head}` | 32px | 700 | 1.2 | — | Section heads |
| `{typography.subhead}` | 24px | 700 | 1.2 | — | Card titles, sub-sections |
| `{typography.eyebrow}` | 14px | 700 | 1.2 | UPPERCASE + gradient text | Kicker/label above a headline |
| `{typography.lead}` | 20px | 300 | 1.5 | — | Hero subhead / intro paragraphs (the airy 300) |
| `{typography.body}` | 16px | 400 | 1.6 | — | Default paragraph |
| `{typography.body-strong}` | 16px | 700 | 1.6 | — | Inline emphasis |
| `{typography.button}` | 16px | 700 | 1.0 | UPPERCASE, +0.5px | CTA & ghost button labels |
| `{typography.nav-link}` | 16px | 400 | 1.0 | — | Global nav items |
| `{typography.caption}` | 14px | 400 | 1.4 | — | Captions, seal labels |
| `{typography.fine-print}` | 12px | 400 | 1.4 | — | Legal / footer fine print |

### Principles
- **Headlines are Bold 700, never lighter.** Barlow at 700 is the brand's "voice." Hierarchy is built by *size*, not by dropping weight.
- **Emphasis is the gradient word.** Within a 700 headline, set the single value-carrying word(s) `uppercase` and fill with `{gradients.headline-text}` (`background-clip:text`). Use it once per headline.
- **Weight 300 is the "air" cue.** Reserve Barlow Light (300) for large lead paragraphs where the copy should feel calm and spacious — never for anything below ~18px (it gets fragile).
- **Buttons shout in caps.** CTA labels are uppercase Barlow 700 with slight tracking — decisive and engineered, matching the 0px corners.
- **No weight 500/600.** The ladder is 300 / 400 / 700.

### Note on Font Substitutes
Barlow is a free Google Font, so substitution is rarely needed.
- Web/native: load **Barlow** (Google Fonts or the self-hosted woff2) with weights 300/400/700.
- If Barlow is unavailable, the closest fallbacks are **Saira** or **Oswald-adjacent** grotesques; failing those, `system-ui` at 700. Expect headlines to widen slightly — Barlow is marginally condensed, so tighten `letter-spacing` by ~`-0.01em` on substitutes to preserve the engineered cadence.

## Layout

### Spacing System
- **Base unit:** 8px (inferred/standardized). Tokens: `{spacing.xxs}` 4 · `{spacing.xs}` 8 · `{spacing.sm}` 12 · `{spacing.md}` 16 · `{spacing.lg}` 24 · `{spacing.xl}` 32 · `{spacing.xxl}` 48 · `{spacing.section}` 96.
- **Section vertical padding:** generous (`{spacing.section}` ≈ 96px) — the airy rhythm is part of the brand.
- **Card padding:** `{spacing.lg}` (24px).
- **Button padding:** ~14px × 32px (the wide horizontal padding makes the sharp-cornered coral block feel substantial).

### Grid & Container
- **Max content width:** ~1200–1280px centered (inferred), with full-bleed gradient/glow backgrounds breaking past the container.
- **Feature/benefit grid:** "Alle Vorteile im Überblick" implies a multi-card grid (3–4 columns on desktop) of `{component.feature-card}` items, each pairing an icon/illustration with a Barlow 700 title and body copy.
- **Hero:** single-column centered stack — eyebrow → headline (with gradient word) → lead → CTA cluster — over a glow/gradient backdrop with a product render.

### Whitespace Philosophy
Whitespace is the brand's calm. Bright white dominates; sections breathe with ~96px of vertical air. Energy is concentrated into small high-saturation moments (the coral CTA, the gradient word, a spark diamond) so they read as *deliberate sparks* against the quiet. Crowding the coral kills the effect.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Default sections, hero copy, nav |
| Radial glow | `{gradients.glow-coral}` / `{gradients.glow-ocean}` behind subject | Hero atmosphere — the brand's primary "depth" |
| Soft hairline | 1px `{colors.hairline}` | Cards, dividers, input borders |
| Card lift | Soft neutral drop shadow (e.g. `rgba(25,25,25,0.10) 0 8px 24px`) | `{component.feature-card}` on white (inferred) |

**Depth philosophy.** LB Energy creates depth with **light, not heavy shadow.** The radial coral/ocean glows behind the hero subject are the signature depth cue — they make the product feel warm and "switched on." Cards may carry a soft neutral lift, but chrome stays minimal so the gradient and glows remain the focal energy.

## Shapes

### Border Radius Scale
| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | **Primary & ghost CTA buttons** — the sharp corner is a brand signal (real) |
| `{rounded.sm}` | 5px | Decorative inset frames / on-image chips (real — 0.3125rem) |
| `{rounded.md}` | 6px | Decorative inset frames (real — 0.375rem) |
| `{rounded.lg}` | 12px | Cards, media thumbnails (inferred) |
| `{rounded.pill}` | 9999px | Optional small chips only (inferred — pills are *not* the brand's default) |

### Signature Motifs
- **Spark diamond** (`{component.spark-diamond}`): a small solid-coral square rotated `-45°`. Used as a decorative accent / bullet / section marker — the brand's "energy spark." Sharp-cornered, never outlined.
- **Sharp coral block:** the 0px-corner coral CTA is itself a recurring shape motif — decisiveness as geometry.
- **Glow field:** large soft radial coral/ocean circles bleeding behind hero content.

### Photography & Imagery
- **Product renders** (the Sensor-Box / IHL hardware) and clean **building/installation diagrams**, typically on white or over a soft glow.
- **Benefit icons** ("KI", "Kalender", "Tanküberwachung", "Plug & Play", "Einsparung") — simple, single-concept pictographs in the feature grid.
- **Trust seals**: BSFZ and AVPQ certification logos (SVG) shown near the value proposition or footer to reinforce "höchsten Qualitäts- und Sicherheitsansprüchen."
- Keep imagery bright, literal, and uncluttered; let the glow supply warmth rather than heavy color grading.

## Components

### Top Navigation
**`global-nav`** — White bar (`{colors.canvas}`), ~72px tall, wordmark/logo left, links (Funktionen · Vorteile · Das Produkt · Kontakt) center/right in `{typography.nav-link}`, and a **Login** action far right. Over a gradient hero it may go transparent with `{colors.on-dark}` links. Keep it light and unobtrusive.

### Buttons
**`button-cta`** — The signature action. Solid `{colors.primary}` (Coral #ff6148) fill **and** border, `{colors.on-primary}` label in `{typography.button}` (Barlow 700 UPPERCASE), `{rounded.none}` (0px — sharp corners), padding ~14px × 32px. Press → `{component.button-cta-press}` (fill shifts to Ember `{colors.primary-press}`).

**`button-ghost`** — Secondary action. Transparent fill, `{colors.primary}` text, 1px `{colors.primary}` border, `{rounded.none}`. Same uppercase Barlow 700 label. Pairs with the solid CTA when two actions sit together.

**`button-on-image`** — When a button sits on photography or a gradient: white fill (`{colors.canvas}`), `{colors.navy}` (#1e4268) label, `{rounded.sm}`. Keeps contrast where coral-on-image would vibrate.

**`text-link`** — Inline links in `{colors.primary}`.

### Headlines & Labels
**`eyebrow-gradient`** — Small uppercase kicker above a headline, filled with `{gradients.headline-text}` (Sky→Ember) via `background-clip:text`. Also the technique for the emphasized word inside a hero H1.

### Surfaces
**`hero-panel`** — White hero with `{gradients.glow-coral}` + `{gradients.glow-ocean}` halos behind a centered copy stack and product render. Headline in `{typography.hero-display}` with one gradient word.

**`hero-panel-gradient`** — Alternative hero using the full `{gradients.brand}` (Ocean→Coral) as the background, `{colors.on-dark}` text, `{component.button-on-image}` CTA. Maximum-energy variant.

**`feature-card`** / **`feature-card-mist`** — Benefit-grid cell. White (or `{colors.canvas-mist}`) fill, `{rounded.lg}`, 24px padding; pictograph + `{typography.subhead}` title + `{typography.body}` copy. Used in "Alle Vorteile im Überblick."

**`spark-diamond`** — Decorative `-45°` coral square; section markers, list bullets, or accent confetti behind a number/stat.

**`trust-seal-row`** — A quiet row of certification logos (BSFZ, AVPQ) with `{typography.caption}` labels in `{colors.body-muted}`.

### Footer
**`footer`** — Dark `{colors.surface-ink}` (#191919) surface, `{colors.on-dark}` text in `{typography.body}`. Holds contact details, address columns, legal links in `{typography.fine-print}`, and (optionally) repeated trust seals. Coral is used sparingly here for links/accents at maximum contrast.

> **Contact / identity facts (footer & legal):** LBenergy GmbH · Tel **+49 8932 706320** · **info@lbenergy.tech** · HQ **Schäfersiedlung 5, 83059 Kolbermoor** · Office **Nordendstr. 3, 80799 München** · Warehouse **Bayerwaldstraße 31, 81737 München** · Hours **Mo–Fr 09:00–16:00**.

## Do's and Don'ts

### Do
- Use **Coral `{colors.primary}` as the only action color** — every CTA, key accent, and "energy" cue. Keep CTAs solid coral with **0px corners** (`{component.button-cta}`).
- Deploy the **Brand Gradient `{gradients.brand}` (Ocean→Coral, 45°)** for hero/highlight surfaces — it's the identity in one stroke.
- Emphasize **one word** per headline with **uppercase + `{gradients.headline-text}`** gradient text.
- Set everything in **Barlow**: 700 for headlines/buttons, 400 for body, 300 only for large airy leads.
- Imply energy with **radial glows** (`{gradients.glow-coral}`/`{gradients.glow-ocean}`) and **spark diamonds** (`{component.spark-diamond}`) rather than heavy graphics.
- Pair efficiency claims with **safety/quality** language and visible **certification seals**.
- Keep surfaces **bright and airy** — let white space isolate the coral sparks.

### Don't
- Don't round the primary CTA — the **sharp 0px corner is the brand**; pills dilute it.
- Don't introduce a second action color; blues are **structural/supporting**, not "click me."
- Don't fill whole headlines with the gradient — emphasis is **one word**, or it stops being emphasis.
- Don't set headlines below 700 or use weights **500/600** (not in the system).
- Don't let coral sprawl — over-saturating the page kills the "spark against calm" effect that makes the brand feel premium.
- Don't put coral text/buttons directly on the Ocean→Coral gradient or busy photos — switch to **`{component.button-on-image}`** (white fill, navy label).
- Don't replace the implied-energy glows with literal flames/heat clichés — the brand is **precision tech**, not "hot."

## Responsive Behavior

> Breakpoints are standardized/inferred (the site is a responsive WordPress theme; exact values weren't extracted).

| Name | Width | Key Changes |
|---|---|---|
| Phone | ≤ 640px | Single-column; nav → hamburger; hero H1 ~32px; feature grid 1-col; CTAs full-width |
| Tablet | 641–1024px | Nav may stay/condense; feature grid 2-col; hero H1 ~40px |
| Desktop | 1025–1440px | Full nav row; feature grid 3–4 col; hero H1 up to 56px; content max ~1280px |
| Wide | ≥ 1441px | Content locks center; gradient/glow backgrounds extend full-bleed past the container |

- **Touch targets:** ≥ 44×44px; coral CTAs go full-width on phone for thumb reach.
- **Hero:** glow fields scale down and may simplify to a single coral halo on small screens; the gradient word stays.
- **Gradient backgrounds** remain full-bleed at every size; the centered content column is what narrows.

## Iteration Guide

1. Work one component at a time and reference its YAML key (`{component.button-cta}`, `{component.feature-card}`).
2. Use `{token.refs}` everywhere — never inline hex. Gradients are tokens too (`{gradients.brand}`).
3. The two unbreakable signatures: **solid-coral 0px-corner CTA** and **uppercase Sky→Ember gradient emphasis word**. Don't redesign these.
4. Document Default and Pressed states only (e.g. `{component.button-cta}` → `{component.button-cta-press}`). Skip hover.
5. When something needs more energy, reach for the **gradient or a glow** before adding chrome, borders, or a second color.
6. Keep Barlow 700 for headlines; build hierarchy with size, not weight.

## Known Gaps

- **Inferred values:** the numeric type scale (px sizes), spacing scale, radius steps beyond `none`/`sm`/`md`, breakpoints, and component padding are standardized estimates — only colors, gradients, the Barlow weights, heading weight/line-height (700 / 1.2), the uppercase-gradient emphasis, and the 0px coral button were read directly from production CSS.
- **No official logo lockup captured:** a favicon mark exists; an AVPQ certification SVG is referenced. Clear-space, minimum size, and monochrome/reversed logo rules are unknown — request the official logo kit.
- **Hover/focus and form states** were not surfaced; only Default and an Ember press state are documented.
- **Photography art direction** (grading, crop ratios) is described from the marketing homepage only; a fuller asset library may define more.
- **Dark-mode** beyond the ink footer was not observed.
- **Exact glow geometry** (size, blur, opacity, placement) is approximate — tune to taste while keeping the coral+ocean pairing.
- Replace the **price/identity facts** and any inferred token with the official LB Energy brand book if one exists; the Apple-format reference this file was modeled on is preserved at `docs/apple-design-reference.md`.
