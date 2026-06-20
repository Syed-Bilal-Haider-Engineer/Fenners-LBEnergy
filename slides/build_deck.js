const pptxgen = require("pptxgenjs");
const path = require("path");

const A = "C:/Projects/Fenners-LBEnergy/assets";
const S = "C:/Projects/Fenners-LBEnergy/slides";

// ---- Brand tokens ----
const CORAL = "FF6148", EMBER = "F24227", OCEAN = "19567B", NAVY = "1E4268",
      SKY = "0B75B7", INK = "191919", MUTED = "8F8F9D", MIST = "F1F1F1",
      HAIR = "D8D8D8", WHITE = "FFFFFF";
const FONT = "Barlow";

const p = new pptxgen();
p.layout = "LAYOUT_WIDE";          // 13.33 x 7.5
const PW = 13.33, PH = 7.5, M = 0.62;
p.author = "Team Fenners";
p.title = "OnQ — LB Energy x TUM Hackathon";

const shadow = () => ({ type: "outer", color: "191919", blur: 9, offset: 3, angle: 135, opacity: 0.16 });

// spark-diamond motif (3 small diamonds)
function diamonds(slide, x, y, s = 0.13, gap = 0.07, cols = [CORAL, SKY, OCEAN]) {
  cols.forEach((c, i) => slide.addShape(p.shapes.RECTANGLE, {
    x: x + i * (s + gap), y, w: s, h: s, rotate: 45, fill: { color: c }, line: { type: "none" }
  }));
}

// content-slide chrome: eyebrow + title + footer
function chrome(slide, kicker, title, n) {
  slide.background = { color: WHITE };
  diamonds(slide, M, 0.52, 0.12, 0.06);
  slide.addText(kicker, { x: M + 0.52, y: 0.46, w: 8, h: 0.3, margin: 0,
    fontFace: FONT, fontSize: 12, bold: true, color: CORAL, charSpacing: 3 });
  slide.addText(title, { x: M, y: 0.82, w: PW - 2 * M, h: 0.8, margin: 0,
    fontFace: FONT, fontSize: 33, bold: true, color: INK });
  // footer
  slide.addText([
    { text: "OnQ", options: { bold: true, color: INK } },
    { text: "   Never Early · Never Late", options: { color: MUTED } }
  ], { x: M, y: PH - 0.5, w: 7, h: 0.3, margin: 0, fontFace: FONT, fontSize: 10 });
  slide.addText("Team Fenners × LB Energy GmbH", { x: PW - 4.6, y: PH - 0.5, w: 4, h: 0.3,
    margin: 0, fontFace: FONT, fontSize: 10, color: MUTED, align: "right" });
  slide.addText(String(n), { x: PW - M - 0.4, y: 0.46, w: 0.4, h: 0.3, margin: 0,
    fontFace: FONT, fontSize: 11, bold: true, color: MUTED, align: "right" });
}

function card(slide, x, y, w, h, fill = WHITE, accent = null) {
  slide.addShape(p.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill },
    line: { color: HAIR, width: 1 }, shadow: shadow() });
  if (accent) slide.addShape(p.shapes.RECTANGLE, { x, y, w, h: 0.07, fill: { color: accent }, line: { type: "none" } });
}

// =====================================================================
// SLIDE 0 — Title (fully native + editable text; gradient backdrop only)
// =====================================================================
{
  const s = p.addSlide();
  s.background = { path: path.join(A, "ppt-assets/title-gradient.png") };

  // top accent bar (4 native segments = brand gradient feel)
  const segCols = [OCEAN, SKY, CORAL, EMBER], segW = PW / 4;
  segCols.forEach((c, i) => s.addShape(p.shapes.RECTANGLE, {
    x: i * segW, y: 0, w: segW, h: 0.07, fill: { color: c }, line: { type: "none" } }));

  // eyebrow (editable)
  s.addText("ADAPTIVE PREDICTIVE PREHEAT CONTROL  ·  MOBILE & TEMPORARY STRUCTURES", {
    x: 1, y: 0.5, w: PW - 2, h: 0.35, margin: 0, align: "center",
    fontFace: FONT, fontSize: 12.5, bold: true, color: "DFE6EC", charSpacing: 3 });

  // ---- partner lockup (Fenners white chip × LB coral chip) ----
  const chipH = 1.16, fW = 1.62, lbW = 1.4, crossW = 0.5, gap = 0.34;
  const total = fW + gap + crossW + gap + lbW, sx = (PW - total) / 2, ly = 1.24;
  // Fenners chip
  s.addShape(p.shapes.RECTANGLE, { x: sx, y: ly, w: fW, h: chipH, fill: { color: WHITE }, line: { type: "none" }, shadow: shadow() });
  { const ih = 0.86, iw = ih * (499 / 500);
    s.addImage({ path: path.join(A, "team-brand-assets/Fenners_Logo.png"), x: sx + (fW - iw) / 2, y: ly + (chipH - ih) / 2, w: iw, h: ih }); }
  // cross
  s.addText("✕", { x: sx + fW + gap, y: ly, w: crossW, h: chipH, margin: 0, align: "center", valign: "middle", fontFace: FONT, fontSize: 26, color: "CBD5DD" });
  // LB coral chip
  const lbx = sx + fW + gap + crossW + gap;
  s.addShape(p.shapes.RECTANGLE, { x: lbx, y: ly, w: lbW, h: chipH, fill: { color: CORAL }, line: { type: "none" }, shadow: shadow() });
  { const ih = 0.82, iw = ih * (190 / 320);
    s.addImage({ path: path.join(S, "lb-white.png"), x: lbx + (lbW - iw) / 2, y: ly + (chipH - ih) / 2, w: iw, h: ih }); }
  // partner label (editable)
  s.addText("TEAM FENNERS   ×   LB ENERGY GMBH", { x: 1, y: ly + chipH + 0.14, w: PW - 2, h: 0.3, margin: 0, align: "center", fontFace: FONT, fontSize: 11.5, color: MUTED, charSpacing: 2 });

  // ---- OnQ project plate ----
  const onqIH = 1.66, onqIW = onqIH * (612 / 408);
  const plW = onqIW + 1.9, plH = onqIH + 0.6, plx = (PW - plW) / 2, ply = 3.06;
  s.addShape(p.shapes.RECTANGLE, { x: plx, y: ply, w: plW, h: plH, fill: { color: WHITE }, line: { type: "none" }, shadow: shadow() });
  // plate top accent (ocean -> coral, two segments)
  s.addShape(p.shapes.RECTANGLE, { x: plx, y: ply, w: plW / 2, h: 0.06, fill: { color: OCEAN }, line: { type: "none" } });
  s.addShape(p.shapes.RECTANGLE, { x: plx + plW / 2, y: ply, w: plW / 2, h: 0.06, fill: { color: CORAL }, line: { type: "none" } });
  s.addImage({ path: path.join(A, "OnQ-brand-assets/OnQ_logo.png"), x: (PW - onqIW) / 2, y: ply + (plH - onqIH) / 2 + 0.04, w: onqIW, h: onqIH });
  // diamonds motif under plate
  diamonds(s, (PW - (3 * 0.15 + 2 * 0.08)) / 2, ply + plH + 0.16, 0.15, 0.08);

  // ---- names + event text box (editable) ----
  const tbW = 8.4, tbx = (PW - tbW) / 2, tby = 6.0, tbH = 1.06;
  s.addShape(p.shapes.RECTANGLE, { x: tbx, y: tby, w: tbW, h: tbH, fill: { color: WHITE, transparency: 92 }, line: { color: "FFFFFF", width: 1, transparency: 55 } });
  s.addText("⟨  Add team member names here  ⟩", { x: tbx, y: tby + 0.1, w: tbW, h: 0.34, margin: 0, align: "center", fontFace: FONT, fontSize: 16, italic: true, color: "AFC0CD" });
  s.addText("Building of the Future — Intelligent Control of Mobile Structures", { x: tbx, y: tby + 0.46, w: tbW, h: 0.3, margin: 0, align: "center", fontFace: FONT, fontSize: 13.5, bold: true, color: CORAL });
  s.addText("LB Energy GmbH × TUM Hackathon  ·  June 2026", { x: tbx, y: tby + 0.75, w: tbW, h: 0.26, margin: 0, align: "center", fontFace: FONT, fontSize: 11.5, color: "CDD6DD", charSpacing: 1 });
}

// =====================================================================
// SLIDE 1 — Problem
// =====================================================================
{
  const s = p.addSlide();
  chrome(s, "THE CHALLENGE", "Knowing the optimal moment to heat — made dynamic", 1);
  // left text
  s.addText([
    { text: "For each booking, find the latest moment preheat must start so the room hits 21 °C exactly when people arrive — no earlier (waste), no later (cold).", options: { breakLine: true, paraSpaceAfter: 10 } },
    { text: "At LB Energy it's harder: many building types — tents, halls, insulated containers — each with different walls, air-trapping and thermal mass.", options: { breakLine: true, paraSpaceAfter: 10 } },
    { text: "And they're temporary — up and down on varying timeframes — so there is no recorded history for any specific structure. Every deployment is a cold start.", options: {} },
  ], { x: M, y: 1.95, w: 5.7, h: 3.2, margin: 0, fontFace: FONT, fontSize: 15.5, color: INK, lineSpacingMultiple: 1.15 });

  // right: 3 building cards
  const bx = 6.7, bw = 6.0;
  const blds = [
    ["Thin tent", "very low insulation · tiny mass", "τ ≈ minutes", CORAL],
    ["Prefab container", "medium insulation & mass", "τ ≈ 1–4 h", SKY],
    ["Lecture hall", "high insulation · large mass", "τ ≈ 2–12 h", OCEAN],
  ];
  blds.forEach((b, i) => {
    const y = 1.95 + i * 0.92;
    card(s, bx, y, bw, 0.78, WHITE, b[3]);
    s.addText(b[0], { x: bx + 0.25, y: y + 0.13, w: 3.2, h: 0.3, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: INK });
    s.addText(b[1], { x: bx + 0.25, y: y + 0.44, w: 3.6, h: 0.3, margin: 0, fontFace: FONT, fontSize: 11.5, color: MUTED });
    s.addText(b[2], { x: bx + bw - 1.85, y: y + 0.18, w: 1.6, h: 0.42, margin: 0, fontFace: FONT, fontSize: 16, bold: true, color: b[3], align: "right" });
  });

  // bottom failure callout
  card(s, M, 5.35, PW - 2 * M, 1.35, "FBEEEC", CORAL);
  s.addText("REAL DATA · TUM campus, 30 Mar 2026", { x: M + 0.3, y: 5.52, w: 6, h: 0.3, margin: 0, fontFace: FONT, fontSize: 11, bold: true, color: EMBER, charSpacing: 2 });
  s.addText([
    { text: "The current system preheated a fixed ", options: {} },
    { text: "2 h 25 min", options: { bold: true } },
    { text: " ahead — the room was still ", options: {} },
    { text: "2.2 °C too cold", options: { bold: true, color: EMBER } },
    { text: " at event start, and did not reach 21 °C until ", options: {} },
    { text: "~9 hours later", options: { bold: true, color: EMBER } },
    { text: ".", options: {} },
  ], { x: M + 0.3, y: 5.86, w: PW - 2 * M - 0.6, h: 0.7, margin: 0, fontFace: FONT, fontSize: 16, color: INK, valign: "top" });
}

// =====================================================================
// SLIDE 2 — The model
// =====================================================================
{
  const s = p.addSlide();
  chrome(s, "WHAT WE'RE BUILDING · 1", "A self-calibrating grey-box physics model", 2);

  // left bullets
  s.addText([
    { text: "Separate the universal physics from the building-specific numbers.", options: { bold: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "The thermal equation is the same for every building.", options: { bullet: true, breakLine: true } },
    { text: "Only 3 parameters {β₁, β₂, β₃} differ — insulation, heating effectiveness, ambient gains.", options: { bullet: true, breakLine: true } },
    { text: "They are fitted automatically from each building's own sensor telemetry.", options: { bullet: true, breakLine: true } },
    { text: "Physics extrapolates by design — a tent-trained model would mis-predict a container; the same equation with different β works for both.", options: { bullet: true } },
  ], { x: M, y: 1.95, w: 5.7, h: 2.7, margin: 0, fontFace: FONT, fontSize: 14.5, color: INK, lineSpacingMultiple: 1.08 });

  // equation box
  card(s, M, 4.78, 5.7, 0.7, INK);
  s.addText("dT/dt = β₁·(T_supply−T_room) + β₂·(T_room−T_out) + β₃", { x: M + 0.2, y: 4.86, w: 5.3, h: 0.34, margin: 0, fontFace: "Consolas", fontSize: 12.5, color: WHITE });
  s.addText("τ = −1/β₂  is the building's insulation time constant", { x: M + 0.2, y: 5.18, w: 5.3, h: 0.26, margin: 0, fontFace: FONT, fontSize: 11, italic: true, color: "CADCFC" });

  // right: data flow
  const rx = 6.7, rw = 6.0;
  card(s, rx, 1.95, rw, 2.55, MIST);
  s.addText("DATA IN → SELF-CALIBRATE → DECISION", { x: rx + 0.25, y: 2.08, w: rw - 0.5, h: 0.3, margin: 0, fontFace: FONT, fontSize: 11, bold: true, color: OCEAN, charSpacing: 2 });
  s.addText([
    { text: "IHL heat-pump sensors", options: { bold: true, breakLine: true } },
    { text: "room temp · outside temp · supply-air temp · compressor / power", options: { breakLine: true, color: MUTED, fontSize: 12, paraSpaceAfter: 7 } },
    { text: "External", options: { bold: true, breakLine: true } },
    { text: "weather forecast (Open-Meteo) · power-grid stress / carbon intensity · calendar bookings", options: { color: MUTED, fontSize: 12 } },
  ], { x: rx + 0.25, y: 2.42, w: rw - 0.5, h: 1.6, margin: 0, fontFace: FONT, fontSize: 13.5, color: INK, lineSpacingMultiple: 1.05 });
  s.addText("⟶  fit β₁, β₂, β₃  ⟶  optimal preheat start time  t*", { x: rx + 0.25, y: 4.05, w: rw - 0.5, h: 0.35, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: CORAL });

  // grid-aware sustainability
  card(s, rx, 4.65, rw, 0.83, "EAF3F0", OCEAN);
  s.addText([
    { text: "Grid-aware: ", options: { bold: true, color: OCEAN } },
    { text: "within the preheat window we shift heating toward cleaner, lower-stress grid hours — same comfort, lower CO₂ and peak load.", options: {} },
  ], { x: rx + 0.25, y: 4.74, w: rw - 0.5, h: 0.66, margin: 0, fontFace: FONT, fontSize: 12.5, color: INK, valign: "middle" });

  // status strip
  card(s, M, 5.78, PW - 2 * M, 0.92, "EAF1E9", "2C5F2D");
  s.addText("STATUS · DONE", { x: M + 0.3, y: 5.95, w: 2.2, h: 0.3, margin: 0, fontFace: FONT, fontSize: 11, bold: true, color: "2C5F2D", charSpacing: 1.5 });
  s.addText([
    { text: "Calibration + trajectory simulator built — ", options: {} },
    { text: "0.17 °C", options: { bold: true, color: "2C5F2D" } },
    { text: " ramp fit; preheat lead time derived at ", options: {} },
    { text: "~4.1 h", options: { bold: true, color: "2C5F2D" } },
    { text: " (cheap Mode-1 only).", options: {} },
  ], { x: M + 0.3, y: 6.26, w: PW - 2 * M - 0.6, h: 0.4, margin: 0, fontFace: FONT, fontSize: 15, color: INK });
}

// =====================================================================
// SLIDE 3 — Insights
// =====================================================================
{
  const s = p.addSlide();
  chrome(s, "WHAT WE'RE BUILDING · 2", "Three intelligent insights on top of the model", 3);
  const cards = [
    ["💰", "Cost / energy", "Start the cheap hot-water coil early so the expensive electric boost never fires.", "~71% less", "preheat-window energy", "DONE", CORAL],
    ["🛠️", "Fault detection", "Watch the gap between predicted and measured temperature; sustained drift = a fault.", "tomorrow", "pipeline ready", "BUILDING", SKY],
    ["🌱", "Sustainability", "Convert saved kWh to CO₂ avoided, plus grid-aware scheduling & what-if scenarios.", "223 kg", "CO₂ avoided / 7 mornings", "DONE", OCEAN],
  ];
  const cw = 3.86, gap = 0.36, y0 = 1.95, ch = 2.95;
  cards.forEach((c, i) => {
    const x = M + i * (cw + gap);
    card(s, x, y0, cw, ch, WHITE, c[6]);
    s.addText(c[0], { x: x + 0.25, y: y0 + 0.22, w: 1, h: 0.6, margin: 0, fontSize: 30 });
    s.addText(c[1], { x: x + 0.25, y: y0 + 0.92, w: cw - 0.5, h: 0.4, margin: 0, fontFace: FONT, fontSize: 18, bold: true, color: INK });
    s.addText(c[2], { x: x + 0.25, y: y0 + 1.35, w: cw - 0.5, h: 1.0, margin: 0, fontFace: FONT, fontSize: 13, color: "44464a", lineSpacingMultiple: 1.05 });
    s.addText(c[3], { x: x + 0.25, y: y0 + 2.28, w: cw - 0.5, h: 0.4, margin: 0, fontFace: FONT, fontSize: 22, bold: true, color: c[6] });
    s.addText(c[4], { x: x + 0.25, y: y0 + 2.66, w: cw - 0.5, h: 0.25, margin: 0, fontFace: FONT, fontSize: 10.5, color: MUTED });
    s.addText(c[5], { x: x + cw - 1.55, y: y0 + 0.2, w: 1.3, h: 0.28, margin: 0, fontFace: FONT, fontSize: 9.5, bold: true, color: c[6], align: "right", charSpacing: 1 });
  });

  // two-mode callout
  card(s, M, 5.2, PW - 2 * M, 1.5, INK);
  s.addText("THE SAVINGS MECHANISM WE FOUND IN THE DATA — TWO HEATING MODES", { x: M + 0.35, y: 5.38, w: 11, h: 0.3, margin: 0, fontFace: FONT, fontSize: 11.5, bold: true, color: "CADCFC", charSpacing: 1.5 });
  s.addText([
    { text: "Mode 1  ", options: { bold: true, color: "8FE3C8" } },
    { text: "fan + hot-water coil · ~4.7 kW · cheap", options: { color: WHITE } },
  ], { x: M + 0.35, y: 5.78, w: 5.6, h: 0.4, margin: 0, fontFace: FONT, fontSize: 14.5 });
  s.addText([
    { text: "Mode 2  ", options: { bold: true, color: CORAL } },
    { text: "electric boost · 53–73 kW · ~15× more expensive", options: { color: WHITE } },
  ], { x: M + 0.35, y: 6.2, w: 6.2, h: 0.4, margin: 0, fontFace: FONT, fontSize: 14.5 });
  s.addText("We start Mode 1 ~4 h earlier and never trigger Mode 2 — using only setpoint timing, the one lever we actually have.", { x: 7.4, y: 5.78, w: 5.3, h: 0.82, margin: 0, fontFace: FONT, fontSize: 12.5, italic: true, color: "E7ECEF", valign: "middle" });
}

// =====================================================================
// SLIDE 4 — Who the insights are for
// =====================================================================
{
  const s = p.addSlide();
  chrome(s, "STAKEHOLDERS", "Who the insights are for — and how they touch them", 4);
  const head = (t) => ({ text: t, options: { fill: { color: INK }, color: WHITE, bold: true, fontSize: 13, valign: "middle" } });
  const rows = [
    ["Facility manager", "Comfort guaranteed, no per-building setup", "Calendar in → preheat auto-scheduled; fault alerts"],
    ["LB Energy", "One model scales to any new structure in ~3 days", "Generalisation instead of per-site tuning"],
    ["Operator / finance", "€ saved, peak-demand boost avoided", "What-if slider: setpoint · unit count · season"],
    ["Sustainability / ESG", "kWh & CO₂ avoided, reportable", "Seasonal savings summary + grid-aware timing"],
    ["Occupants", "A 21 °C room, on time", "Invisible — they just aren't cold"],
  ];
  const body = rows.map((r, i) => r.map((c, j) => ({
    text: c, options: {
      fill: { color: i % 2 ? "F6F7F8" : WHITE }, color: j === 0 ? OCEAN : INK,
      bold: j === 0, fontSize: 13.5, valign: "middle", align: "left",
      margin: [4, 8, 4, 8]
    }
  })));
  s.addTable([[head("Stakeholder"), head("Insight that matters"), head("How they interact")], ...body], {
    x: M, y: 2.0, w: PW - 2 * M, colW: [3.0, 4.55, 4.54], rowH: 0.78,
    border: { pt: 1, color: HAIR }, fontFace: FONT, valign: "middle"
  });
}

// =====================================================================
// SLIDE 5 — Results + chart
// =====================================================================
{
  const s = p.addSlide();
  chrome(s, "RESULTS SO FAR", "Same day, same data — replayed through OnQ", 5);

  // 4 stat callouts (left column)
  const stats = [
    ["0 → 7", "of 7 mornings on-time", "(was 0/7)", CORAL],
    ["~71%", "less preheat-window energy", "Mode-1 only, no boost", OCEAN],
    ["0.17 °C", "heat-up ramp fit (RMSE)", "physics matches reality", SKY],
    ["~4.1 h", "calibrated preheat lead", "vs blind 2 h 25 min", NAVY],
  ];
  const sw = 2.78, sh = 1.04, sx = M, sy0 = 2.0;
  stats.forEach((st, i) => {
    const y = sy0 + i * (sh + 0.18);
    card(s, sx, y, sw, sh, WHITE, st[3]);
    s.addText(st[0], { x: sx + 0.22, y: y + 0.12, w: sw - 0.4, h: 0.5, margin: 0, fontFace: FONT, fontSize: 27, bold: true, color: st[3] });
    s.addText(st[1], { x: sx + 0.22, y: y + 0.6, w: sw - 0.4, h: 0.26, margin: 0, fontFace: FONT, fontSize: 11.5, bold: true, color: INK });
    s.addText(st[2], { x: sx + 0.22, y: y + 0.82, w: sw - 0.4, h: 0.22, margin: 0, fontFace: FONT, fontSize: 9.5, color: MUTED });
  });

  // trajectory chart (right)
  const labels = ["00:00", "00:30", "01:30", "02:05", "02:30", "03:00", "03:30", "04:00", "04:30"];
  const current = [16.8, 16.8, 16.8, 16.87, 17.2, 17.6, 18.1, 18.5, 18.8];
  const onq = [16.8, 17.0, 18.2, 18.9, 19.4, 19.9, 20.2, 20.45, 20.6];
  const target = labels.map(() => 20.5);
  card(s, 3.9, 2.0, 8.8, 3.55, WHITE);
  s.addText("Room temperature on the 04:30 event morning", { x: 4.15, y: 2.12, w: 8.3, h: 0.3, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: INK });
  s.addChart(p.charts.LINE, [
    { name: "OnQ (our controller)", labels, values: onq },
    { name: "Current system", labels, values: current },
    { name: "Comfort target 20.5 °C", labels, values: target },
  ], {
    x: 4.0, y: 2.45, w: 8.6, h: 3.0,
    chartColors: [CORAL, MUTED, "2C5F2D"],
    lineSize: [3, 3, 1], lineDash: ["solid", "solid", "dash"], lineSmooth: true,
    showLegend: true, legendPos: "b", legendFontSize: 10, legendColor: INK,
    catAxisLabelColor: MUTED, valAxisLabelColor: MUTED, catAxisLabelFontSize: 9, valAxisLabelFontSize: 9,
    valAxisMinVal: 16, valAxisMaxVal: 21, valGridLine: { color: "EAEAEA", size: 0.5 }, catGridLine: { style: "none" },
    chartArea: { fill: { color: WHITE } }, plotArea: { fill: { color: WHITE } },
  });

  // honesty note
  card(s, M, 5.78, PW - 2 * M, 0.92, MIST);
  s.addText([
    { text: "Honesty note:  ", options: { bold: true, color: EMBER } },
    { text: "current-system figures are observed; our comfort figure is the controller's prediction; savings are electrical, preheat-window only. Cooling-window backtest is still in progress.", options: { color: "44464a" } },
  ], { x: M + 0.3, y: 5.88, w: PW - 2 * M - 0.6, h: 0.72, margin: 0, fontFace: FONT, fontSize: 12.5, valign: "middle" });
}

// =====================================================================
// SLIDE 6 — Tomorrow
// =====================================================================
{
  const s = p.addSlide();
  chrome(s, "DAY 3 · PLANNED", "What we'll build tomorrow", 6);
  const items = [
    ["1", "Cross-window generalisation test", "Fit β on the heating window, validate on the cooling window — insulation β₂ shouldn't change seasonally."],
    ["2", "Cooling-window precool controller", "Symmetric to the heating one, to complete the currently-pending cooling backtest."],
    ["3", "Anomaly / fault early-warning", "CUSUM on the prediction residual; test on a synthetic fault."],
    ["4", "ML residual corrector (LightGBM)", "Learn what physics misses (solar, occupancy); disabled-safe so the RC model always stands alone."],
    ["5", "Demo dashboard (Streamlit)", "Trajectory plot, savings, and a what-if slider."],
    ["6", "Uncertainty + safe-margin scheduling", "Confidence interval on t*; fall back to a fixed offset if calibration fails."],
  ];
  const cw = 5.95, gap = 0.4, ch = 1.18, x0 = M, y0 = 1.98;
  items.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = x0 + col * (cw + gap), y = y0 + row * (ch + 0.2);
    card(s, x, y, cw, ch, WHITE, i < 2 ? CORAL : HAIR);
    s.addShape(p.shapes.OVAL, { x: x + 0.22, y: y + 0.3, w: 0.56, h: 0.56, fill: { color: i < 2 ? CORAL : OCEAN }, line: { type: "none" } });
    s.addText(it[0], { x: x + 0.22, y: y + 0.3, w: 0.56, h: 0.56, margin: 0, fontFace: FONT, fontSize: 20, bold: true, color: WHITE, align: "center", valign: "middle" });
    s.addText(it[1], { x: x + 0.95, y: y + 0.18, w: cw - 1.15, h: 0.4, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: INK });
    s.addText(it[2], { x: x + 0.95, y: y + 0.55, w: cw - 1.15, h: 0.55, margin: 0, fontFace: FONT, fontSize: 11.5, color: "44464a", lineSpacingMultiple: 1.0 });
  });
  // fallback note
  s.addText([
    { text: "Guaranteed demo:  ", options: { bold: true, color: CORAL } },
    { text: "even if items 2–5 slip, the RC model alone tells the full story — 0.17 °C fit, ~4 h-early counterfactual, 0/7→7/7, ~71% energy.", options: { color: INK } },
  ], { x: M, y: 6.55, w: PW - 2 * M, h: 0.4, margin: 0, fontFace: FONT, fontSize: 13, italic: true });
}

// =====================================================================
// SLIDE 7 — Open questions
// =====================================================================
{
  const s = p.addSlide();
  chrome(s, "FOR LB ENERGY", "Open questions to sharpen the next steps", 7);
  const qs = [
    "Building footprint (m²), wall construction and glazing ratio — to validate calibrated β / τ.",
    "What drove the setpoint switch to 21 °C at 02:05 UTC when the exported config says 0 min preheat?",
    "Is the 43 kW power spike a real peak event or a measurement artefact?",
    "Rated COP / refrigerant type — to sharpen the energy-savings numbers.",
    "In production, is each heat pump a separate zone, or one space_id per hall?",
  ];
  qs.forEach((q, i) => {
    const y = 2.05 + i * 0.92;
    card(s, M, y, PW - 2 * M, 0.78, i % 2 ? "F6F7F8" : WHITE, null);
    s.addText(String(i + 1), { x: M + 0.22, y: y + 0.16, w: 0.6, h: 0.46, margin: 0, fontFace: FONT, fontSize: 24, bold: true, color: CORAL });
    s.addText(q, { x: M + 0.95, y: y + 0.1, w: PW - 2 * M - 1.2, h: 0.58, margin: 0, fontFace: FONT, fontSize: 14.5, color: INK, valign: "middle" });
  });
}

p.writeFile({ fileName: path.join(S, "OnQ_Pitch_Fenners.pptx") }).then(f => console.log("WROTE", f));
