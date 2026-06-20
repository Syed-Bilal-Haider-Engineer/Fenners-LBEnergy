# Approach Comparison: RL Controller vs. Grey-Box RC Models

A comparison of three approaches to the LB Energy IHL "optimal pre-heat" challenge:

- **My plan (RL):** model-based reinforcement learning — a learned simulator plus a
  Q-learning agent that controls *how many heat pumps run* (`../../.claude/plans/ok-meine-aufgabe-ist-gleaming-aho.md`).
- **`MODEL_DESIGN.md`:** physics-based grey-box RC thermal model with an OLS-fitted
  controller and an ML residual layer.
- **`IHL_optimal_start_guide.md`:** RC model after Kim et al. (2024) with four
  regression variants for predicting the optimal start time.

The key insight: **both existing docs are NOT reinforcement learning.** They use a
physics-based grey-box RC model with supervised regression. That difference is exactly
why my RL plan can borrow so much from them.

---

## 1. The three approaches at a glance

| | **My plan (RL)** | **MODEL_DESIGN.md** | **IHL_optimal_start_guide.md** |
|---|---|---|---|
| Core method | Model-based RL: learned simulator + Q-learning agent | Grey-box RC model (β₁, β₂, β₃ via OLS) + binary-search controller | RC model (Kim et al. 2024), 4 regression models |
| Decision style | **Closed-loop**: agent re-decides every timestep | **Open-loop**: compute start time once, then run | Open-loop: compute `t_opt` once per event |
| Control variable | **Number of devices (0–4)** | Pre-heat lead time (when to send setpoint) | Pre-heat lead time (minutes) |
| Learning | Reward (energy vs. comfort) | OLS batch fit + RLS online update | Linear regression + daily EMA |
| Generalization | Building-specific (does not transfer) | Universal RC structure (τ varies by building) | Universal RC structure |
| Maturity | Concept only | **Has real fitted numbers** (τ, β, RMSE) | Academically grounded, code snippets |
| Energy model | Devices × power (too simplistic — see §3.1) | Two-mode electrical vs. thermal split | `power_kw × (baseline − t_opt)` |

---

## 2. What my RL plan uniquely offers

- **True closed-loop control.** RL re-decides at every step from the live state, so it
  naturally reacts to disturbances (a door opening, changing occupancy, a wrong weather
  forecast) that the open-loop controllers in both docs cannot correct for.
- **Device count as a learned action (0–4).** Directly answers the brief's question
  "would fewer units be enough?" as a *learned policy*, not just a what-if table.
- **Multi-event days.** The cooling season's back-to-back 90-minute lectures form a
  sequential control problem that RL models naturally.
- **Tunable energy/comfort trade-off** via the reward weights.

---

## 3. What the docs have that my plan is missing (most valuable additions)

### 3.1 The "two-stage heating" discovery — the single most important finding
`MODEL_DESIGN.md` §1–2 shows that **`power_draw.csv` measures electrical power only.**
From 02:05–04:05 on Mar 30 the electrical draw was just 4.69 kW (fans only) while
`T_supply` rose to 59 °C and the room warmed — implying a **large non-electrical heat
source** (hot-water coil / district heating). Two distinct modes exist:

| Mode | Mechanism | Electrical power | Cost |
|---|---|---|---|
| **Mode 1** | Fan + hot-water coil | ~4.7 kW | cheap |
| **Mode 2** | Electric boost | 53–73 kW | ~15× more expensive per kWh |

→ This **breaks my plan's energy assumption** ("energy = devices × power"). My reward
function and savings calculation must distinguish cheap Mode 1 from expensive Mode 2.
The optimal strategy is to use *more* cheap Mode 1 time (earlier start) instead of
relying on the expensive Mode 2 boost as a last-resort catch-up. **Must adopt.**

### 3.2 `T_supply` as the heating signal
Both docs use `(T_supply − T_room)` as the physical heating driver. My simulator
dropped supply temperature; the RC form is more physically grounded than `n_active` alone.

### 3.3 A ready-made, validated simulator
`MODEL_DESIGN.md` §3.4 provides real fitted values (τ ≈ 8 h passive / 37 h heating,
β₁ = 0.057, β₂ = −0.125, β₃ = 0.877, trajectory RMSE reported). **This is essentially my
RL environment, already calibrated** — I do not need to build the dynamics model from
scratch.

### 3.4 Cross-building generalization
`MODEL_DESIGN.md` §4: the same RC equations hold for tent / container / hall; only τ
changes. **My RL policy is building-specific and does NOT transfer** — a real weakness I
should state honestly.

### 3.5 The "Monday problem"
`IHL_optimal_start_guide.md` §8: after a long weekend setback the start is cold, producing
the largest errors. A good stress test for my policy.

### 3.6 Concrete metrics and uncertainty
Sharp targets: mean time error < 10 min, temperature error < 0.5 °C; quantile regression
for confidence intervals. My plan lacks crisp target numbers.

### 3.7 Defined baselines
`MODEL_DESIGN.md` §8.3 defines B0 (always-on), B1 (current observed), B2 (fixed 6 h),
B3 (model) — a clean savings-comparison framework I should reuse.

---

## 4. Concrete additions to my plan

1. **Use the RC model as the RL simulator** (instead of a generic dT/dt regression) — reuse
   `MODEL_DESIGN.md` §3 and the pre-fitted β values for an immediately validated environment.
2. **Add the two-mode energy model** to both the reward and the savings calc — Mode 1 (cheap)
   vs. Mode 2 (expensive). This makes the policy smarter: "heat early in cheap Mode 1 rather
   than late with an expensive boost."
3. **Add `T_supply` (or a mode flag) as a state feature.**
4. **Address the generalization weakness honestly** — e.g. feed the RC parameter τ as a state
   input so the policy still works under a different τ.
5. **Adopt the Monday / cold-start test and the sharp metrics** (< 10 min, < 0.5 °C) in verification.
6. **Reuse the §8.3 baselines** (B0 always-on, B1 current, B2 fixed 6 h, B3 my policy).

---

## 5. Honest assessment

For *this* problem (a single comfort deadline, fairly deterministic physics), the docs'
**RC + binary-search controller is simpler, more robust, and already produces results.**
RL is **more novel and impressive** but riskier with only two weeks of data (simulator
exploitation, no generalization).

**Strongest move: combine them.** Take the docs' **RC model as the RL simulator** and let
the agent learn the **device-count policy** on top. That reuses their validated physics
*and* adds the RL value (live closed-loop control, device-count optimization, multi-event
scheduling).
