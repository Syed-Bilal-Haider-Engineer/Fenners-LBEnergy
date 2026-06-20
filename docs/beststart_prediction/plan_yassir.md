# Plan: Reinforcement-Learning Control for Heat Pumps (LB Energy IHL)

## Context

**Task (from `callenge_discription.pdf`):** Predict/decide *when* and *how many*
heat pumps need to run so that a lecture hall reaches comfort **on time for the start of the
lecture** — and as energy-efficiently as possible. Plus: make kWh / € / CO₂ savings visible.

**Chosen approach (user requirement): Reinforcement Learning.**
- **Action space = number of running devices (0, 1, 2, 3, 4).** Each of the 4 devices is only
  on/off; intensity is controlled via the *number* of active devices. Directly answers the PDF
  question "would fewer devices be enough?".
- **Dataset split: Training / Validation / Test / Live.** "Live" = a chronologically
  held-out data segment that is replayed step by step "in real time" so that the learned policy
  reacts to incoming sensor data (there is no real live stream;
  "live" = replay of the historical CSVs).

**Architecture = Model-based RL (two models):**
1. **Regression model = simulator/environment.** Learns the thermo-dynamics
   `dT/dt = f(room_temp, outside_temp, n_devices_on, season)` from the data. This is the
   "regression model". Physically structured: heating power ~ linear in the device count
   (4 identical devices) — so the simulator can also represent device counts that rarely
   occurred in the respective regime.
2. **RL agent = controller (the "reinforced training").** Learns through reward in this
   simulator the policy "given state → how many devices to switch on", in order to minimize
   energy and hit comfort on time.

**Why model-based (simulator + agent) instead of RL directly on the logs?** Pure offline RL can
barely evaluate counterfactuals ("what if only 2 devices?") — especially in the cooling regime,
where historically almost only 0 or 4 devices ran. The simulator allows arbitrarily many training
episodes and the scenario analyses from the PDF (fewer devices / setpoint −2 °C).

**Pretrained vs. from scratch:** **From scratch.** For tabular thermo/control data there is
no meaningful pretrained model to fine-tune; every building is thermally different. Both
parts are fitted to *this* data with standard algorithms (scikit-learn / numpy) — no
neural network from zero, no pretrained third-party model. *(Future work for a multi-building rollout:
pretrain a global model + fine-tune per room = transfer learning.)*

**Verified data facts (not assumed):**
- The current system pre-heats blindly: setpoint jumps ~02:00 from 11→21 °C, event only at 04:30 (~2.5 h
  fixed lead time, weather-independent) → **this is the baseline to beat.**
- The room does not reach 21 °C on cold days (plateau ~20 °C) → the reward must define "achievable
  comfort" tolerantly, not rigidly 21 °C.
- Action coverage heating: n_active well distributed over 0–4 (learnable). Cooling: almost only 0/4
  (→ physical linearity carries the intermediate steps).
- Power per device: standby ~1.15 kW (heating) / ~1.9 kW (cooling), much higher in operation
  → derive ON/OFF energy empirically from `power_draw.csv` (conditioned on `heating_required`).

**Stack (installed, no extra install):** Python 3.11, pandas, numpy, scikit-learn, matplotlib.
RL as **tabular Q-learning** (pure numpy, interpretable, beginner-friendly) — primary.
Optional upgrades (own installs): **Fitted-Q-Iteration** with an sklearn regressor as the Q-function
(fits the "regression model" idea, without state discretization) or DQN (torch) — only if desired.

---

## Data & Split

| File | Use |
|---|---|
| `data/*/heat_pump_snapshots.csv` | Room/outside temp, setpoint, `heating_required`/`cooling_required` → simulator training, states |
| `data/*/power_draw.csv` | kW per device / 5 min → ON/OFF energy, cost, CO₂ |
| `data/*/space_events.csv` | Event start/end = comfort deadline (reward) |
| `data/devices.csv` | 4 identical devices (same room) |

**Chronological split per season (7 days heating + 7 days cooling):**
- **Train:** Day 1–4 (fit simulator; start/outside-temp trajectories for RL episodes)
- **Validation:** Day 5 (simulator accuracy; tune reward weights & training duration)
- **Test:** Day 6 (unbiased final policy evaluation)
- **Live:** Day 7 (chronological replay as a "real-time" demo)

Both seasons are mixed so that the simulator & agent see heating + cooling.

**Data pitfalls (in the notebook):** Room temp is identical across all 4 devices → for the room
dynamics aggregate to one time series per timestamp (median). `operation_mode` unreliable (sometimes shows
"HEAT" during cooling) → derive regime from `heating/cooling_required` + sign (setpoint−room). `compressor_active`
consistently 0 → do not use as an activity indicator; derive activity from `power_draw`/`*_required`.
Ignore persistent alarm bits & empty fields.

---

## Components

### A. Simulator (regression model)
Resample to a 5-min grid. Target `y = dT/dt` (°C/h). Features: `room_temp`, `outside_temp`,
`n_active` (0–4), `season`. Two variants, both trained:
- **Physics baseline:** `dT/dt = a·n_active·heating_factor − b·(room − outside)` via `LinearRegression`
  (robust, enforces sensible linearity in n_active).
- **ML:** `HistGradientBoostingRegressor` for non-linearities (plateau/saturation).
Selection by RMSE on validation/test; the more accurate but monotone-plausible variant becomes the environment.

### B. RL environment (Gym-like, self-built)
- **State** `s`: (`temp_gap` = setpoint−room, signed per regime, `outside_temp`, `minutes_to_event`,
  `in_event`, `season`).
- **Action** `a` ∈ {0,1,2,3,4} = devices on.
- **Transition:** `room_{t+1} = room_t + simulator(s,a)·Δt`; outside temp/event from the real day.
- **Reward:** `r = −w_E·energy(a) − w_C·comfort_violation`
  - `energy(a) = a · P_on · Δt` (+ standby of remaining devices); `P_on` empirical per season.
  - `comfort_violation`: only during the event, = distance room↔setpoint (tolerance-based, since 21 °C is not
    always achievable). Plus a terminal penalty if comfort is missed at event start.
- **Episode:** one daily cycle (setback trough → event end), step = 5 min.

### C. RL agent
Tabular **Q-learning** with discretized state (temp_gap, outside, time buckets), ε-greedy.
Training through many simulated episodes over the train days. Output: Q-table/policy.

### D. Live replay
Play back test/live days step by step; per step real sensor state → policy → action
(n devices); advance the room with the simulator; compare energy & comfort against the **actual**
historical behavior of that day.

### E. Savings & scenarios (scope: model + savings)
- Policy vs. baseline (real behavior) on test/live: kWh, € (e.g. 0.30 €/kWh), CO₂
  (e.g. 0.40 kg/kWh), comfort hit rate.
- Scenarios via the simulator: cap max devices at 3/2 ("fewer devices?"), setpoint −2 °C.
- Extrapolation to 29 campus heat pumps (PDF).

---

## Files to create
- `notebooks/heat_pump_rl.ipynb` — complete pipeline (A–E) with plots & explanations (deliverable).
- `src/simulator.py` — load data, features, dT/dt regression, `step()` environment.
- `src/rl_agent.py` — Q-learning (training, policy, save/load).
- `models/` — saved simulator + Q-policy (`joblib`/`.npy`).
- `requirements.txt` — pandas, numpy, scikit-learn, matplotlib, joblib.

## Risks & mitigations
- **Simulator exploitation** (agent exploits model errors): small action space (0–4), physically
  structured simulator, sanity-check policy trajectories against real test days.
- **Weak cooling action coverage:** linearity assumption in n_active + heating data as the main learning source.
- **Reward tuning** (energy vs. comfort): calibrate `w_E`/`w_C` on validation.

## Verification
1. **Simulator:** dT/dt RMSE on test < physics baseline; simulated vs. real room trajectory on
   a heat-up morning lie close together (plot).
2. **Agent learns:** cumulative reward rises over the training episodes (learning-curve plot).
3. **Policy sensible:** on test/live days the policy starts **later** than the fixed ~02:00 lead time
   and still reaches comfort by event start; output the comfort hit rate.
4. **Savings:** kWh/€/CO₂ of the policy < baseline on test/live, plausible order of magnitude.
5. **Robustness (unknown conditions):** on the coldest test day the policy maintains comfort
   (possibly more devices/earlier start) — covers the "cold morning / heatwave" question of the PDF.
6. **Notebook** runs without errors from top to bottom (Restart & Run All).
