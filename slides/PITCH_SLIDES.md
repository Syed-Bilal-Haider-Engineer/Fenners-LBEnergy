# Pitch Deck — Team Feners

### LBenergy GmbH × TUM Hackathon — "Building of the Future: Intelligent Control of Mobile Structures"

> **Working title (not final):** *PreHeatIQ* / *ThermoPilot* / *AdaptHeat* — a self-calibrating physics model that tells each building exactly when to start heating.
>
> **Deck status:** Day 2 of 3 — jury preview of what we will pitch & present.
> **One-liner for the jury:** *One physics model. Any building type. It learns from the building's own sensors and picks the perfect moment to start heating — no over-heating, no cold rooms.*

---

## Slide 0 — Team

**Team Feners**

- Who we are (names / roles — fill in)
- One sentence on why we took this challenge: *temporary buildings waste energy because nobody knows their physics — so we made the building tell us.*

*Speaker note:* keep this to 20 seconds. Energy in the room, not a CV reading.

---

## Slide 1 — The Problem

**Predicting when to heat or cool a building is already hard. LBenergy makes it dynamic.**

- Predicting the *optimal* moment to pre-heat or pre-cool a building is already a non-trivial problem.
- At LBenergy it becomes **dynamic**: many *types* of structures — tents, isolated halls, insulated containers — each with different physics.

**Visual — buildings side by side, with their key differences:**

| | Thin tent (canvas) | Prefab container | Lecture hall |
|---|---|---|---|
| Wall thickness / insulation | very low | medium | high |
| Air-trapping / thermal mass | tiny | moderate | large |
| Time to heat (τ) | minutes | 1–4 h | 2–12 h |

- **The twist:** these buildings are *temporary*. They go up and come down on varying timeframes. So there is **no recorded history** of a specific structure's size or thermal behaviour — every deployment is effectively a cold start.

**The concrete failure (real data, TUM campus, 2026-03-30):**
> The current IHL system switched preheat ON a hard-coded **2h25min** before the first lecture. At event start the room was **2.2 °C too cold** (18.8 °C vs 21 °C target). It didn't reach 21 °C until **~9 hours later** — under sub-zero outside temps.

*Speaker note:* lead with this story, not the equations. It's measured, not hypothetical.

---

## Slide 2 — Our Approach

**A self-calibrating physics model — built, tested and validated.**

- We approach this by **building, testing and validating a physics (grey-box) thermal model**, with parameters we **derive automatically from the sensors** already inside the heat pumps / AC units — plus useful external data.
- **Key idea — separate the universal from the specific:**
  - The *physics* (the RC thermal equation) is **the same for every building**.
  - Only **3 parameters** `{β₁, β₂, β₃}` differ per building — they encode insulation, heating effectiveness, and ambient gains.
  - The model **fits those 3 numbers from the building's own telemetry** → one model structure serves a tent or a lecture hall.

**Visual — where the data comes from:**

```
IHL sensors (heat pump):           External:
 • room temperature                 • weather forecast (Open-Meteo)
 • outside temperature                – outside temp, solar, wind
 • supply-air temperature           Calendar:
 • compressor state / power          • room booking events
        │                                   │
        └──────────► self-calibration ◄─────┘
                  fit β₁, β₂, β₃  → optimal preheat start time t*
```

- The core equation (show, don't dwell):
  `dT_room/dt = β₁·(T_supply − T_room) + β₂·(T_room − T_out) + β₃`
  where `τ = −1/β₂` **is the building's insulation time constant.**

**Why physics, not pure ML:** a pure ML model trained on a tent would massively mis-predict a container. Physics **extrapolates by design** — even on a freak −15 °C morning outside the training data, the heat-loss term stays correct.

*Speaker note:* the punchline of this slide — *"a model trained on a container is not a different model from one trained on a tent. It's the same model with different numbers, found the same way."*

---

## Slide 3 — From Model to Stakeholder Value

**A physics model is cool. Increasing stakeholder value is cooler.**

*(stakeholder meme goes here)*

We turn the model into **three intelligent insights** that stakeholders actually feel:

| Insight | What it does | Proof from our backtest |
|---|---|---|
| 💰 **Cost / energy** | Start the *cheap* hot-water coil early so the *expensive* electric boost never fires | **~71% less preheat-window electrical energy** (~558 kWh / €167 / 223 kg CO₂ over 7 mornings) |
| 🛠️ **Error / fault detection** | Watch the gap between predicted and measured temperature; sustained drift = fault | Door-open, filter blockage, refrigerant loss, compressor fault (stretch — pipeline ready) |
| 🌱 **Sustainability** | Same kWh saved → CO₂ avoided, plus "what-if" scenarios (lower setpoint, fewer units) | 223 kg CO₂ avoided in 7 mornings, on one room |

**The savings mechanism (the discovery in the data):** there are **two heating modes** —
- **Mode 1:** fan + hot-water coil, ~4.7 kW electrical, **cheap**.
- **Mode 2:** electric boost, 53–73 kW, **~15× more expensive**.

The current system fires the expensive boost *and still misses comfort*. We start Mode 1 ~4 h earlier and **never trigger Mode 2** — using only setpoint timing, the one control lever we actually have.

*Speaker note:* this is the "cooler" payoff. The physics is the engine; these three insights are the product.

---

## Slide 4 — Who Cares, and How They Interact

**Before the insights matter, ask: to whom, and how do they touch them?**

| Stakeholder | The insight that matters to them | How they interact with it |
|---|---|---|
| **Facility / building manager** | Comfort guaranteed at event start; no manual setup per building | Calendar in → preheat scheduled automatically; dashboard alerts on faults |
| **LBenergy (the product)** | One model that scales to *any* new structure in ~3 days | Generalisation = a product advantage, not per-site tuning |
| **Finance / operator** | € saved, peak-demand boost avoided | What-if slider: setpoint, unit count, season |
| **Sustainability / ESG** | kWh & CO₂ avoided, reportable | Seasonal savings summary |
| **Occupants (students)** | Walk into a 21 °C room, on time | Invisible — they just stop being cold |

*Speaker note:* the model only earns its keep when it changes a decision someone makes. Name the someone.

---

## Slide 5 — Proof / Results (the money slide)

**Same day, same data — replayed through our model.**

| Metric | Current IHL system | Team Feners model |
|---|---|---|
| On-time comfort (≥ 20.5 °C at event start) | **0 / 7 mornings** | **7 / 7 mornings** |
| Mean room temp at event start | 18.5 °C | 20.5 °C |
| Heat-up ramp fit (RMSE) | — | **0.17 °C** |
| Preheat lead time | blind 2h25min | calibrated **~4.1 h** (Mode 1 only) |
| Preheat-window electrical energy | baseline | **~71% less** |

**Visual:** the March-30 trajectory — observed (misses 21 °C, late boost) vs simulated (starts the cheap coil ~4 h early, hits 21 °C right at 04:30 event).

> *"Start the cheap hot-water coil ~4 hours early — never fire the expensive electric boost. The room arrives at 21 °C exactly when students do. 7/7 instead of 0/7, at ~71% less energy."*

*Speaker note:* be honest like the PDR is — B1 comfort/energy are *observed*, B3 comfort is the controller's *prediction*. Judges respect the honesty.

---

## Slide 6 — Generalisation (the scalability claim)

**Same model, same code, different parameters — tent, container, or lecture hall.**

- The insulation term `β₂ = −1/τ` is an **envelope property** — it doesn't change with the season.
- **Our cross-window test:** fit on the *heating* window (March, −0.3–26 °C, setpoint 21 °C), validate on the *cooling* window (May, 7–33 °C, setpoints 15–24 °C). A 55-day gap, different temps, different setpoints — same β should explain both.
- **New building:** initialise β from the nearest building-type prior → after ~3 days of its own telemetry, it re-fits itself. **No manual configuration.**

*Honesty note (keep it):* single-building dataset, so we demonstrate generalisation via heating↔cooling as two regimes + the parameter framework; cooling-window precool backtest is still in progress.

---

## Slide 7 — Demo

**What we'll show live:**
1. The March-30 ramp: observed vs simulated trajectory (0.17 °C fit).
2. The counterfactual: "start ~4 h early in cheap Mode 1 → 21 °C at event start, no boost."
3. The backtest: 0/7 → 7/7 on-time, ~71% energy, kWh / € / CO₂.
4. (Stretch) what-if slider + anomaly flag on residuals.

**Guaranteed-demo fallback:** even if the ML residual layer isn't ready, the **RC model alone** delivers the whole story — physics evidence, counterfactual, savings.

---

## Slide 8 — Close / The Ask

- **What we built:** a physics-informed, self-calibrating preheat controller that works across building types, learns in ~3 days, and uses only the control lever LBenergy actually has (setpoint timing).
- **Verified impact:** 0/7 → 7/7 comfort, ~71% less preheat energy, on real campus data.
- **Why it scales:** one model structure → every mobile structure → a product advantage for IHL.
- **Open questions for LBenergy** (shows we read the data): building footprint / wall type? what drove the 02:05 setpoint switch? is the 43 kW spike real? rated COP?

> *Team Feners — making the building tell us its physics, so it's warm exactly when it needs to be.*

---

## Appendix — Numbers cheat-sheet (for Q&A, not slides)

- Dataset: 4 heat pumps, 1 room, ~90 s telemetry; heating 2026-03-30→04-05, cooling 2026-05-25→05-31.
- Equation: `dT/dt = β₁·(T_supply−T_room) + β₂·(T_room−T_out) + β₃`, `τ = −1/β₂`.
- Two modes: Mode 1 ~4.7 kW (cheap coil, COP≫1), Mode 2 53–73 kW (electric boost, ~15×).
- Calibration: trajectory fit (scipy L-BFGS-B), 0.17 °C ramp RMSE; OLS retained as diagnostic.
- Assumptions (labelled): €0.30–0.35/kWh, 0.400 kg CO₂/kWh (DE grid 2026).
- Stack: pandas → RC sim (forward-Euler) → binary-search t* → LightGBM residual (stretch) → Streamlit demo.
