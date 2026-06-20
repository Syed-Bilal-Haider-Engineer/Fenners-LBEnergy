# Team Feners — Project Slides

### LBenergy GmbH × TUM Hackathon — "Building of the Future: Intelligent Control of Mobile Structures"

> **Purpose of this deck:** show the jury *what we are building* and *what we plan to build by tomorrow* — not a sales pitch, a status of the work.
> **Project name:** **OnQ** — *Never Early · Never Late.*

---

## Slide 0 — Opening (designed)

> **Rendered title slide:** [title-slide.html](title-slide.html) · preview [title-slide.png](title-slide.png) — built on the LB Energy brand sheet (Barlow, Ocean→Coral gradient, sharp corners, spark-diamond motif).

Layout:
- **Top:** Team Fenners logo **×** LB Energy logo (co-branding lockup).
- **Centre:** **OnQ** project logo on a white plate.
- **Below:** text box — *⟨ team member names ⟩* + event name (*Building of the Future — Intelligent Control of Mobile Structures · LB Energy × TUM Hackathon · June 2026*).

*Just drop your names into the text box.*

---

## Slide 1 — The Problem We're Tackling

**Knowing the optimal moment to heat or cool a building is hard. LBenergy makes it dynamic.**

- The core task: for each upcoming room booking, find the **latest moment preheat must start** so the room hits its setpoint (21 °C) exactly when occupants arrive — no earlier (wasted energy), no later (cold room).
- At LBenergy it's harder because the structures are **different types** — tents, isolated halls, insulated containers — each with different walls, air-trapping, and thermal mass.

| | Thin tent | Prefab container | Lecture hall |
|---|---|---|---|
| Insulation | very low | medium | high |
| Thermal mass | tiny | moderate | large |
| Time to heat (τ) | minutes | 1–4 h | 2–12 h |

- These buildings are **temporary** — up and down on varying timeframes — so there's **no recorded history** of any specific structure. Every deployment is a cold start.

**What the data shows (TUM campus, 2026-03-30):** the current system preheated a hard-coded **2h25min** ahead — the room was still **2.2 °C too cold** at event start and didn't reach 21 °C until **~9 hours later**.

---

## Slide 2 — What We're Building: The Model

**A self-calibrating grey-box (physics) thermal model.**

- We build, test and validate a physics model whose parameters are **derived from the sensors already in the heat pumps**, plus external weather data.
- **The design choice:** separate the *universal physics* from the *building-specific parameters*.
  - The thermal equation is **the same for every building**.
  - Only **3 parameters** `{β₁, β₂, β₃}` differ — they encode insulation, heating effectiveness, and ambient gains, and are **fitted from each building's own telemetry**.

```
IHL heat-pump sensors            External
 • room temperature               • weather forecast (Open-Meteo)
 • outside temperature            • power-grid stress / carbon intensity
 • supply-air temperature         Calendar
 • compressor / power             • room booking events
        └────► self-calibrate β₁,β₂,β₃ ────► optimal preheat start time t*
```

- **Grid-aware sustainability:** we also bring in **power-grid stress levels / carbon intensity** as external data. Within the available preheat window we can **shift heating toward cleaner, less-stressed grid hours** — so the same comfort is delivered with lower CO₂ and less load on the grid at peak times, not just lower kWh.

- Core equation: `dT_room/dt = β₁·(T_supply−T_room) + β₂·(T_room−T_out) + β₃`, where `τ = −1/β₂` is the building's insulation time constant.
- **Why physics over pure ML:** physics extrapolates by design — a model trained on a tent would mis-predict a container, but the same equation with different β values works for both.

**Status:** ✅ calibration + trajectory simulator built — **0.17 °C** ramp fit; **~4.1 h** preheat lead time derived.

---

## Slide 3 — What We're Building: The Insights

**On top of the model, three insights for stakeholders.**

| Insight | What it does | Status |
|---|---|---|
| 💰 **Cost / energy** | Start the cheap hot-water coil early so the expensive electric boost never fires | ✅ backtested — **~71%** less preheat-window energy |
| 🛠️ **Fault detection** | Watch the gap between predicted and measured temperature; sustained drift = fault | ⏳ building tomorrow — pipeline ready |
| 🌱 **Sustainability** | Convert kWh saved to CO₂ avoided + what-if scenarios | ✅ ~558 kWh / €167 / 223 kg CO₂ over 7 mornings |

**The mechanism we found in the data — two heating modes:**
- **Mode 1:** fan + hot-water coil, ~4.7 kW electrical — **cheap**.
- **Mode 2:** electric boost, 53–73 kW — **~15× more expensive**.

The current system fires Mode 2 *and still misses comfort*. We start Mode 1 ~4 h earlier and never trigger Mode 2 — using only setpoint timing, the one control lever available.

---

## Slide 4 — Who the Insights Are For

**Each insight changes a decision for a specific stakeholder.**

| Stakeholder | Insight that matters | How they interact with it |
|---|---|---|
| **Facility manager** | Comfort guaranteed, no per-building setup | Calendar in → preheat scheduled automatically; fault alerts |
| **LBenergy** | One model scales to any new structure in ~3 days | Generalisation instead of per-site tuning |
| **Operator / finance** | € saved, peak-demand boost avoided | What-if slider (setpoint, unit count, season) |
| **Sustainability / ESG** | kWh & CO₂ avoided, reportable | Seasonal savings summary |
| **Occupants** | A 21 °C room, on time | Invisible — they just aren't cold |

---

## Slide 5 — Results So Far

**Same day, same data, replayed through our model.**

| Metric | Current IHL system | Our model |
|---|---|---|
| On-time comfort (≥20.5 °C at event start) | **0 / 7 mornings** | **7 / 7 mornings** |
| Mean room temp at event start | 18.5 °C | 20.5 °C |
| Heat-up ramp fit (RMSE) | — | **0.17 °C** |
| Preheat lead time | blind 2h25min | calibrated **~4.1 h**, Mode 1 only |
| Preheat-window electrical energy | baseline | **~71% less** |

**Visual:** March-30 trajectory — observed (misses 21 °C, late boost) vs simulated (cheap coil starts ~4 h early, hits 21 °C at the 04:30 event).

*Honesty note (keep it):* current-system numbers are *observed*; our comfort figure is the controller's *prediction*; savings are electrical, preheat-window only.

---

## Slide 6 — What We Plan to Build Tomorrow

**Day 3 work, in priority order:**

1. **Cross-window generalisation test** — fit β on the heating window, validate on the cooling window (55-day gap, different temps & setpoints). The insulation term β₂ shouldn't change seasonally.
2. **Cooling-window precool controller** — symmetric to the heating one, to complete the cooling backtest (currently pending).
3. **Anomaly / fault early-warning** — CUSUM on the prediction residual; test on a synthetic fault.
4. **ML residual corrector (LightGBM)** — learn what the physics misses (solar, occupancy); disabled-safe so the RC model always stands alone.
5. **Demo dashboard (Streamlit)** — trajectory plot, savings, what-if slider.
6. **Uncertainty + safe-margin scheduling** — confidence interval on t*; fall back to fixed offset if calibration fails.

**Guaranteed demo:** even if items 2–5 slip, the RC model alone tells the full story (0.17 °C fit, ~4 h-early counterfactual, 0/7→7/7, ~71% energy).

---

## Slide 7 — Open Questions for LBenergy

Shows we read the data, and sharpens the next steps:
1. Building footprint (m²), wall construction, glazing ratio — to validate calibrated β / τ.
2. What drove the setpoint switch to 21 °C at 02:05 UTC when the exported config says 0 min preheat?
3. Is the 43 kW power spike a real peak event or a measurement artefact?
4. Rated COP / refrigerant type — to sharpen energy-savings numbers.
5. In production, is each heat pump a separate zone or one space_id per hall?

---

## Appendix — Numbers cheat-sheet (Q&A, not a slide)

- Dataset: 4 heat pumps, 1 room, ~90 s telemetry; heating 2026-03-30→04-05, cooling 2026-05-25→05-31.
- Equation: `dT/dt = β₁·(T_supply−T_room) + β₂·(T_room−T_out) + β₃`, `τ = −1/β₂`.
- Two modes: Mode 1 ~4.7 kW (cheap coil, COP≫1); Mode 2 53–73 kW (electric boost, ~15×).
- Calibration: trajectory fit (scipy L-BFGS-B), 0.17 °C ramp RMSE; OLS retained as diagnostic.
- Assumptions (labelled): €0.30–0.35/kWh, 0.400 kg CO₂/kWh (DE grid 2026).
- Stack: pandas → RC sim (forward-Euler) → binary-search t* → LightGBM residual (stretch) → Streamlit demo.
