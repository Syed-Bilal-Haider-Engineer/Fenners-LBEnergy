# LB Energy — Brand Assets

Real brand assets scraped from [lbenergy.tech](https://lbenergy.tech) plus ready-to-use
design-token files. Use these to build a frontend or a slide deck quickly.
Full rationale and rules live in [`../DESIGN.md`](../DESIGN.md).

> **Ownership:** these logos, product renders, seals and pictographs are property of
> **LBenergy GmbH**, downloaded from their public site for this hackathon. Don't ship them
> in unrelated/commercial work. The token files (colors/CSS/JSON) are factual and reusable.

## Folder structure

```
assets/
├─ tokens.css            # CSS custom properties (--lb-*) + helper classes — link this in HTML
├─ tokens.json           # machine-readable tokens (Tailwind / Style Dictionary / Figma)
├─ brand-sheet.html      # open in a browser: full visual reference + screenshot source for slides
├─ brand/
│  ├─ lb-energy-logo.svg        # the real LB monogram (vector, gray as-shipped)
│  ├─ lb-energy-logo-ink.svg    # #191919 fill — for light backgrounds
│  ├─ lb-energy-logo-white.svg  # #ffffff fill — for dark backgrounds
│  ├─ favicon-mark.png          # the diamond mark, full res
│  └─ favicon-32/180/192/270.png# app-icon sizes
├─ seals/
│  ├─ bsfz-siegel.svg    # BSFZ research-funding seal
│  ├─ avpq-logo.svg      # AVPQ certification
│  └─ mitglied-siegel.svg# "Wir sind Mitglied" membership seal
├─ product/
│  ├─ ihl-render.png     # Intelligent Heat Link hardware, transparent bg (hero/product shots)
│  └─ video-thumbnail.jpg# 1920px product-film still
└─ features/             # single-concept pictographs — perfect for slide bullets / feature grids
   ├─ ki.png  kalender.png  tankueberwachung.png  plug-play.png
   ├─ einsparung.png  einsparung-personal.png  online-zugang.png
   ├─ verwaltung.png  mobile.png  sicherheitsstandards.png  zertifizierte-quali.png
```

## The logo

The LB Energy mark is a **monogram built from 45°-rotated squares (diamonds)** — five
diamonds stacking into an "L/B". This is why the **spark-diamond** is the brand's core
decorative motif (see `.lb-diamond` in `tokens.css`). The logo renders in a single color
via `currentColor`; use the **ink** variant on light surfaces and **white** on dark.

## Using the tokens

**Plain HTML/CSS**
```html
<link rel="stylesheet" href="assets/tokens.css">
<h1 class="lb-h1">Heizen, <span class="lb-gradient-text">smart</span></h1>
<a class="lb-btn" href="#">Jetzt starten</a>          <!-- solid coral, sharp corners -->
<div class="lb-panel-gradient">…</div>                <!-- Ocean→Coral hero -->
```
Every value is a `var(--lb-*)` custom property (`--lb-coral`, `--lb-gradient-brand`, …).

**Tailwind** — copy `tokens.json → tailwind_hint` into `tailwind.config.js` (`theme.extend`).

## Quick palette (paste into PowerPoint / Figma)

| Role | Hex |
|---|---|
| Coral (primary / accent) | `#FF6148` |
| Ember (pressed / warm pole) | `#F24227` |
| Ocean (cool pole) | `#19567B` |
| Navy (deep) | `#1E4268` |
| Sky (bright) | `#0B75B7` |
| Ink (text) | `#191919` |
| Mist (light fill) | `#F1F1F1` |
| White | `#FFFFFF` |

- **Signature gradient:** `linear-gradient(45deg, #19567B, #FF6148)` (Ocean→Coral)
- **Font:** **Barlow** (Google Fonts) — Bold 700 headlines, Regular 400 body, Light 300 leads.
  In PowerPoint, install Barlow or use a system fallback; headlines = Barlow Bold.

## Making slides

1. Open `brand-sheet.html` in a browser — it lays out the logo, palette, gradients, type,
   buttons, product render, feature icons and seals on one page.
2. Screenshot any block for an instant on-brand slide, **or** drag the PNG/SVG assets
   straight into PowerPoint/Keynote/Canva.
3. Title slides: Ocean→Coral gradient background, white Barlow Bold headline, one word in
   the Sky→Ember gradient. Content slides: white background, ink text, coral accents,
   feature pictographs as bullets.
