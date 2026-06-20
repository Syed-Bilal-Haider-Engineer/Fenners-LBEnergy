# Approach Comparison & Decision: RC Preheat-Timing vs. RL Controller

A comparison of three approaches to the LB Energy IHL "optimal pre-heat" challenge,
**with a recommended decision**. The conclusion has been updated after (a) verifying the
key empirical claims against the raw dataset and (b) incorporating a hard operational
constraint that was confirmed late: **we cannot manipulate individual heat pumps.**

The three approaches:

- **RL plan (`plan_yassir.md`):** model-based reinforcement learning — a learned simulator
  plus a Q-learning agent that controls *how many heat pumps run* (0–4).
- **`MODEL_DESIGN.md`:** physics-based grey-box RC thermal model with a forward-simulation
  + binary-search controller and an ML residual layer.
- **`IHL_optimal_start_guide.md`:** RC model after Kim et al. (2024) with regression
  variants that predict the optimal start time directly.

> **Decision (TL;DR):** Build the **RC preheat-timing controller** (the `MODEL_DESIGN.md`
> architecture) as the spine, fix its one known weakness (add boost-power as a regressor),
> lead the savings story with the **verified two-stage heating discovery**, and use the
> Kim et al. direct regression as a simple baseline/fallback. **RL is demoted to future
> work**, and the "fewer units?" question is answered as an **offline what-if**, not as a
> real-time control action. Rationale in §5–6.

---

## 0. What changed since the first draft

1. **Hard constraint confirmed: no individual-pump control.** The only lever we actually
   have is *when to raise the setpoint* (preheat start timing), and possibly the setpoint
   value. The pumps respond automatically; we do not choose how many run. The dataset
   confirms this — all control is setpoint-driven.
2. **Key claims were verified against the raw CSVs** (see §3.1). The two-stage heating
   discovery is real. The RC fit quality, by contrast, is currently weaker than the first
   draft implied.

Both points move the conclusion away from "combine RL + RC" toward "RC preheat-timing."

---

## 1. The three approaches at a glance

| | **RL plan** | **MODEL_DESIGN.md** | **IHL_optimal_start_guide.md** |
|---|---|---|---|
| Core method | Model-based RL: learned simulator + Q-learning agent | Grey-box RC model (β₁, β₂, β₃ via OLS) + forward-sim + binary-search controller | RC model (Kim et al. 2024), direct regression of `t_opt` |
| Control variable | **Number of devices (0–4)** ❌ *not controllable* | **Pre-heat lead time** (when to send setpoint) ✅ | **Pre-heat lead time** (minutes) ✅ |
| Decision style | Closed-loop (re-decides each step) | Open-loop (compute start once, then run) | Open-loop (compute `t_opt` per event) |
| Learning | Reward (energy vs. comfort) | OLS batch fit + RLS online update | Linear regression + daily EMA |
| Generalization | Building-specific (does not transfer) | Universal RC structure (τ varies by building) | Universal RC structure |
| Maturity | Concept only | Architecture + first fitted numbers (fit still weak — §3.3) | Academically grounded, code snippets |
| Energy model | Devices × power (too simplistic — §3.2) | Two-mode electrical vs. thermal split (verified) | `power_kw × (baseline − t_opt)` |
| **Constraint-compatible?** | **No** — needs per-pump control | **Yes** | **Yes** |

---

## 2. What the RL plan uniquely offered — and why it no longer applies

The RL plan's distinctive value rested on two pillars, both of which are now undercut:

- **Device count as a learned action (0–4).** This was the headline. With **no per-pump
  control**, the action space is infeasible. The brief's *"would fewer units be enough?"*
  is a **sizing/planning question**, best answered by an offline simulator what-if — not a
  real-time policy.
- **True closed-loop control** (reacting to disturbances each step). For a *single comfort
  deadline*, the optimal start time is a 1-D problem that binary search solves **exactly**.
  RL adds simulator-exploitation risk with no accuracy upside here. Its disturbance-rejection
  edge matters more for continuous setpoint tracking — a future extension, not the core task.

What survives from the RL plan and should be **kept**: the energy/comfort trade-off framing,
the train/val/test/"live-replay" evaluation idea, and the honest data pitfalls list.

---

## 3. Evidence: what was verified against the raw data

### 3.1 The two-stage heating discovery — VERIFIED ✅ (the crown-jewel finding)

Checked directly in `heating_2026-03-30.../power_draw.csv` + `heat_pump_snapshots.csv`:

| Time (Mar 30) | Total electrical power | T_supply | T_room | Setpoint |
|---|---|---|---|---|
| 01:30 → 04:00 | **flat ~4.69 kW** | 13 °C → **59 °C** | 16.9 → **18.5 °C** | 11 → 21 (at 02:05) |
| 04:05 onward | **jumps to 53–73 kW** | ~60 °C | 18.5 → 18.8 °C | 21 |

The room warmed ~1.6 °C **while electrical draw never moved** — proving a large
**non-electrical heat source** (hot-water coil / district heat) does the early work, and a
~70 kW **electric boost** kicks in only at the end. Two modes exist:

| Mode | Mechanism | Electrical power | Relative cost |
|---|---|---|---|
| **Mode 1** | Fan + hot-water coil | ~4.7 kW | cheap |
| **Mode 2** | Electric boost | 53–73 kW | ~15× more expensive per electrical kWh |

**And the current system still fails comfort:** at the 04:30 event start the room was only
**18.8 °C, not 21 °C**. So today's "blind 2.5 h preheat + last-minute boost" both *misses
comfort* and *burns the expensive boost*. This is our savings story, and it is
**constraint-compatible** — we shift the Mode-1/Mode-2 balance purely by changing *timing*.

### 3.2 The RL plan's energy model is broken by §3.1

"energy = devices × power" cannot represent the two modes (same device count, ~15× cost
difference). Any RL reward built on it would optimise the wrong objective.

### 3.3 The RC fit is real but currently WEAK — fix before trusting savings ⚠️

`MODEL_DESIGN.md` reports honest but unflattering numbers: **R² = 0.107** on heating rows,
**trajectory RMSE = 4.1 °C** on Mar 30. Cause (correctly diagnosed in that doc): boost mode
adds ~70 kW of heat that does **not** raise T_supply (it stays ~59 °C in both modes), so the
`(T_supply − T_room)` regressor cannot see it. **Fix: add electrical power (or an `is_boost`
flag) as a second regressor.** This is the single highest-value fix and should pull RMSE
down substantially. Until then, "already calibrated" overstates the current state.

### 3.4 Minor data-fact correction

`plan_yassir.md` states "compressor_active consistently 0." False in general — the column
contains both 0 and 1 across the dataset (it is 0 only in this particular window). Derive
activity from `power_draw` / `*_required`, not from a "constant" assumption.

---

## 4. The two RC docs are complementary, not competing

Given the constraint, the real choice is *between the two RC approaches* — and they pair well:

| | `MODEL_DESIGN.md` (dynamics + forward-sim) | `IHL_optimal_start_guide.md` (direct `t_opt` regression) |
|---|---|---|
| What it learns | dT/dt dynamics (every timestep) | `t_opt` directly (one row per event×device) |
| Label availability **in this data** | Uses all steps — robust to the fact the room **rarely reaches 21 °C during preheat** | Needs observed "minutes to reach 21 °C" — often **censored/missing** here (room plateaus ~20 °C / hits 21 only midday) |
| Outputs | Full trajectory, uncertainty, savings, what-ifs, coasting/multi-event | A single start-time number |
| Best role | **Primary controller + explanatory/visual/savings layer** | **Simple baseline + fallback demo** |

The dataset's censored-label reality is decisive: the **dynamics approach is better suited
to this data**, while the direct regression is the perfect robust sanity-check.

---

## 5. Decision — the recommended build

**Primary: RC preheat-timing controller (`MODEL_DESIGN.md` architecture).**

1. **Core:** RC dynamics fit → forward simulation → binary-search for the latest start time
   that still reaches `setpoint − margin` at event start.
2. **Fix first (§3.3):** add electrical power / `is_boost` as a second regressor to repair
   the fit before any savings claim.
3. **Savings story (§3.1):** the verified two-stage model — start cheap Mode-1 earlier to
   avoid the expensive Mode-2 boost. This is the headline number and needs only timing control.
4. **Baseline/fallback:** Kim et al. direct regression where labels exist — fast, robust,
   guarantees *something* demoable if the dynamics fit misbehaves.
5. **Generalization (tents→containers):** unchanged — same RC equation, vary τ, demonstrate
   by parameter sweep. Untouched by the constraint.
6. **RL → future work** (multi-building rollout, continuous setpoint tracking, closed-loop
   disturbance rejection). **"Fewer units?" → offline what-if** via the simulator.

One line: **RC-simulation controller as the spine, fix the boost-power regressor, lead with
the verified two-stage savings, keep Kim et al. as the baseline, demote RL.**

---

## 6. Adopt / Drop / Defer

**Adopt**
- RC model as the controller core (`MODEL_DESIGN.md` §3, §5).
- The two-mode energy model in both the reward/savings calc and the pitch (§3.1).
- `T_supply` (or a mode flag) as the heating driver — more physical than `n_active`.
- The §8.3 baselines (B0 always-on, B1 current, B2 fixed 6 h, B3 our model).
- Sharp metrics: mean time error < 10 min, temperature error < 0.5 °C; quantiles for CIs.
- The "Monday problem" cold-start stress test (`IHL_optimal_start_guide.md` §8).

**Drop (for the 48 h)**
- RL as the controller (action space infeasible without per-pump control).
- "energy = devices × power" (broken by the two-mode finding).
- Any claim that the RC model is "already calibrated" (R² = 0.107 today — fix first).

**Defer (future work / writeup)**
- RL for multi-building transfer & closed-loop tracking.
- Device-count optimisation as a *planning* what-if, not a control action.
- RLS online adaptation + cross-building parameter registry.

---

## 7. Honest assessment

For *this* problem — a single comfort deadline, near-deterministic physics, and the
no-per-pump-control constraint — the **RC preheat-timing controller is simpler, more robust,
better matched to the data, and constraint-compatible.** RL was the more novel idea but is
riskier on two weeks of data and, critically, depends on a control lever we do not have.
The strongest, most defensible submission combines the **RC dynamics controller** (spine) +
the **verified two-stage savings story** (headline) + the **Kim et al. regression** (baseline),
with RL positioned as a clearly-scoped future direction.
