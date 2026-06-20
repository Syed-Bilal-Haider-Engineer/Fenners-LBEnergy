# Intelligent Heat Link — Optimal Pre-Heat Start Time

**A complete project and implementation guide**

This document captures everything needed to build an optimal pre-heat start
time predictor for the LB Energy "Building of the Future" challenge, using the
IHL heat pump research dataset and the methodology from Kim et al. (2024),
*Implementation and validation of optimal start control strategy for air
conditioners and heat pumps* (Applied Thermal Engineering).

---

## 1. The challenge in one paragraph

LB Energy's Intelligent Heat Link (IHL) remotely controls heat pumps in mobile
and temporary structures, already cutting operating costs by 20–30%. The
challenge is to push further using software. The motivating scenario is the TUM
Aerospace and Geodesy Campus in Ottobrunn-Taufkirchen: 11 lecture halls,
29 heat pumps, lectures starting at different times throughout the day. The
brief poses three pillars — predictive control, anomaly detection, and savings
visualization — and explicitly invites diving deep into one or combining
several. This guide focuses on the first pillar: predicting the most
energy-efficient time to switch each heat pump on, so each hall reaches the
right temperature exactly when a lecture starts and holds it until the end.

The core question: *When should each heat pump switch on so the room reaches
21 °C precisely at the lecture start time — never earlier (wasting energy),
never later (cold students)?*

---

## 2. The dataset

The IHL dataset describes one climate-controlled space with 4 heat pump devices.
All timestamps are UTC. Booleans are encoded `1`/`0`, missing values are empty.

### Space configuration

| Setting | Value |
|---|---|
| Space type | `CLIMATE_CONTROLLED_ROOM` |
| Mode | `AUTOMATIC` |
| Temperature strategy | `CLIMATE_CONTROL` |
| Minimum temperature (unoccupied) | 11 °C |
| Event temperature (occupied) | 21 °C |
| Temperature limits | 11 / 30 °C |
| Preheat duration | 0 min (this is what we will optimize) |
| Daily shutdown | none |

The control logic: while a `space_event` is active, the space is heated/cooled
toward 21 °C; otherwise it is held at the 11 °C minimum. Today the preheat
duration is 0, meaning the room only begins warming *when* the event starts —
exactly the inefficiency we are removing.

### Two time windows

| Label | From | To (inclusive) | Role in our project |
|---|---|---|---|
| heating | 2026-03-30 | 2026-04-05 | **train** the model |
| cooling | 2026-05-25 | 2026-05-31 | **test** the model |

Using heating to train and cooling to test mirrors a real deployment: the model
faces a season it has never seen, which is the honest way to evaluate
generalization.

### Files per window

| File | One row per | Primary use |
|---|---|---|
| `heat_pump_snapshots.csv` | device status report (full resolution) | raw signal for slope + anomaly |
| `heat_pump_intervals.csv` | device × time bucket (pre-aggregated) | trends, quick visualization |
| `space_events.csv` | occupancy/booking period | the deadlines to predict against |
| `power_draw.csv` | device × 5-min interval | energy savings calculation |
| `devices.csv` (shared) | device | lookup: type, hardware version |

---

## 3. Column reference (snapshots)

### Process data — operational state

| Column | Meaning | Used for |
|---|---|---|
| `id` | Row UUID | identification |
| `device_id` | Which of the 4 heat pumps | grouping |
| `space_id` | Space UUID (constant) | — |
| `last_seen_at` | UTC time of the report | time axis, day-of-week |
| `status_is_enabled` | Unit switched on | filtering |
| `status_operation_mode` | `AUTO` / `HEAT` / `COOL` | mode context |
| `status_target_temperature_in_celsius` | Current setpoint (11 or 21) | confirm event active |
| `status_temperature_in_celsius` | **Measured room air temp** | **T_zone — primary input** |
| `status_humidity_in_percent` | Relative humidity | optional feature |
| `status_carbon_dioxide_in_ppm` | CO₂ concentration | occupancy proxy |
| `status_voc_in_micrograms_per_cubic_meter` | VOC level | air quality |
| `status_temperature_supply_in_celsius` | Supply air temp | work indicator |
| `status_temperature_return_in_celsius` | Return air temp | work indicator |
| `status_temperature_outside_in_celsius` | **Outdoor air temp at unit** | **T_outdoor — Model 3** |
| `status_air_flow_supply_in_percent` | Supply fan flow | optional |
| `status_air_flow_return_in_percent` | Return fan flow | optional |
| `status_is_heating_required` | Unit demands heating | **start of preheat** |
| `status_is_cooling_required` | Unit demands cooling | start of precool |
| `status_heat_threshold_in_celsius` | Heat below this temp | control context |
| `status_cool_threshold_in_celsius` | Cool above this temp | control context |
| `status_is_compressor_active` | Compressor running | real energy use |
| `status_is_defrost_active` | Defrost cycle running | exclude — not heating room |
| `status_low_pressure_in_bar` | Refrigerant low-side pressure | fault diagnostic |
| `status_high_pressure_in_bar` | Refrigerant high-side pressure | fault diagnostic |
| `status_daily_shutdown_*` | Night-shutdown state | inactive (shutdown off) |

### Diagnostics — filter out unhealthy periods

| Column | Meaning | Used for |
|---|---|---|
| `status_is_status_active` | Active status condition | awareness |
| `status_is_alarm_active` | Active alarm present | **exclude row** |
| `status_error_registers` | Raw Modbus alarm bitfields (`1901,1902,1903,1904`) | **exclude if non-zero** |
| `status_is_network_connected` / `status_has_network_error` / `status_network_error_count` | Connectivity health | exclude if errored |
| `status_system_uptime_in_seconds` | Seconds since controller boot | exclude very low (unstable) |
| `firmware_version` / `payload_version` | Software versions | drift detection |

The `status_error_registers` field is four 16-bit numbers as a comma-separated
string, e.g. `3,0,512,0`. Each bit set means a specific fault is active
(`3` = bits 0 and 1 set in register 1901). `0,0,0,0` or empty means no alarms.
For our purposes we treat *any* non-zero value as "unhealthy, exclude."

### Other files

`heat_pump_intervals.csv` adds `time_range`
(`FIFTEEN_MINUTES`/`ONE_HOUR`/`SIX_HOURS`/`ONE_DAY`), `interval_start_time`,
`interval_end_time`, `median_*` (medians over the bucket), `*_highest_*`
(maxima), and `was_adjusting_temperature` (1 if heating/cooling was demanded at
any point in the bucket).

`space_events.csv` gives the occupancy periods — `start_at`, `end_at`, plus
`type` and `source` describing the kind and origin (e.g. calendar import).
**`start_at` is the deadline we must hit.**

`power_draw.csv` gives `power_kw` per device at 5-minute resolution — the basis
for the energy savings calculation.

---

## 4. The physics: why an RC model

Kim et al. model a room as a **2R1C thermal circuit** — two thermal resistances
and one thermal capacitance — borrowing directly from electrical circuit theory.
The analogy:

| Electrical | Thermal |
|---|---|
| Voltage | Temperature |
| Current | Heat flow |
| Resistor | Insulation (wall) |
| Capacitor | Thermal mass (stores heat) |

A useful mental image: the room is a **battery that stores heat**. It has a
current charge (room temperature now), a target charge (21 °C by lecture start),
a charger (the heat pump, pushing energy in at a roughly fixed rate), and
leakage (heat escaping through walls to the cold outside). The model answers:
*given how discharged the battery is and how fast it leaks, how long does
charging take?*

The two resistances are R_o (exterior-to-wall) and R_w (wall-to-room); the
single capacitance C_r is the room's thermal mass.

---

## 5. The equations, explained

### Equations 1–2: the governing dynamics

```
dT_zone/dt  =  Q_RTU/C_r  +  T_outdoor/(C_r·R_o)  +  T_wall/(C_r·R_w)

τ_r  =  C_r · R_w · R_o / (R_w + R_o)
```

The room temperature changes due to three simultaneous contributions: the heat
pump adding energy (`Q_RTU/C_r`), heat exchange with the outside through the
outer wall, and heat exchange through the inner wall layer. The quantity `τ_r`
(tau) is the **time constant** — how sluggish the room is. A massive concrete
lecture hall has a large τ (slow to heat or cool); a lightweight tent has a tiny
τ (fast). This single number governs the entire response.

### Equations 3–5: the exact solution

Solving the differential equation gives the room temperature as an exponential
approach toward equilibrium. Setting `T_zone = T_setpoint` and solving for time
yields the theoretically exact optimal start time (equation 5). The problem: it
is **nonlinear** and requires knowing R and C explicitly — which means
physically measuring wall construction. Impractical for a data-driven product.

### Equations 6–7: the key simplification

When the preheat time is much shorter than the time constant — which is almost
always true (preheat is tens of minutes; τ is hours) — the exponential is
approximately linear:

```
e^(−t_opt/τ)  ≈  1 − t_opt/τ
```

This collapses equation 5 into a simple fraction (equation 7):

```
t_opt  =  τ·(T_sp − T_zone) / (Q·R − β·(T_zone − T_outdoor))
```

- **Numerator** = how far the room must travel (the temperature gap).
- **Denominator** = the net heating rate after subtracting outdoor leakage.

### Equations 10–11: the data-driven form

All the physics is folded into **learned parameters** that are estimated from
observed data, so no building-construction knowledge is needed:

```
t_opt[k]  =  α_a·(T_sp − T_zone)
          +  α_b·(T_sp − T_zone)·(T_zone − T_outdoor)
          +  α_c
```

- `α_a` — base heating rate (minutes per °C of gap).
- `α_b` — how strongly outdoor temperature modulates the rate.
- `α_c` — a correction offset (captures systematic bias).

Parameters are re-estimated daily from a rolling window of recent days and
smoothed with an exponential moving average (equation 24) so the model tracks
seasonal drift without overreacting to a single odd day.

```
α_smoothed[k]  =  α_smoothed[k−1]  +  λ·(α[k] − α_smoothed[k−1])
```

where `λ` is a forgetting constant (higher λ = faster adaptation).

---

## 6. The four models — and which to use

The four models in the paper are different choices of which terms to keep:

| Model | Inputs | Idea | Verdict for us |
|---|---|---|---|
| **Model 1** | indoor only | `t = α_a·(T_sp−T_zone) + α_c` | **Start here** — simplest, robust on little data |
| Model 2 | outdoor only | replaces indoor with a fixed reference temp | **Skip** — wastes our good indoor sensor |
| **Model 3** | indoor + outdoor | full equation 11 | **Target** — best accuracy in the paper |
| Model 4 | first-order fit | least-squares exponential | **Later** — needs the most data to stabilize |

### Why these choices for the IHL data

- **Model 2 is ruled out.** It substitutes a geographic reference temperature
  (0 °C heating, 37.78 °C cooling) for the indoor reading — a blunt fallback for
  buildings without a reliable indoor sensor. We have excellent indoor sensors,
  so discarding that information makes no sense.
- **Model 4 is deferred.** It is mathematically elegant but the slowest to
  converge. With only ~7 days per window and calendar-driven (not fixed-time)
  events, it will not stabilize reliably yet.
- **Model 1 first, Model 3 as the goal.** Model 1 validates the whole pipeline
  with two parameters and trivial code. Model 3 then adds the outdoor term,
  which matters for lecture halls with large glazed facades where cold outside
  air accelerates heat loss during preheat.

### A caveat from the paper, tested rather than assumed

Kim et al. found outdoor temperature had *minimal* influence in their specific
buildings, concluding the model could be simplified to indoor-only. That was an
empirical result for offices/workshops, not a universal law. For TUM lecture
halls we should let our own data decide — fit Model 3, inspect whether `α_b` is
meaningfully non-zero, and only then simplify.

---

## 7. Mapping data to equation variables

| Equation variable | Source column / derivation | File |
|---|---|---|
| `T_zone` | `status_temperature_in_celsius` at preheat start | snapshots |
| `T_sp` | constant `21.0` (confirmed by `status_target_temperature_in_celsius`) | config |
| `(T_sp − T_zone)` | derived: `21 − T_zone` | computed |
| `T_outdoor` | `status_temperature_outside_in_celsius` at preheat start | snapshots |
| `t_actual` (target) | minutes from `status_is_heating_required → 1` until `T_zone ≥ 21` | snapshots + events |
| `α_a, α_b, α_c` | least-squares fit over rolling 10-day window | derived |
| energy savings | `power_kw × (baseline_min − t_opt) / 60` | power_draw |
| post-weekend flag | `last_seen_at` day-of-week = Monday | derived |

Notes on subtleties:

- **T_zone** should be the *single* reading at the moment preheat would begin,
  not an average — the model predicts from a specific starting condition.
- **T_outdoor** is measured at the unit, so it may differ slightly from a weather
  station (solar load on the sensor, sheltering). For a *relative* signal that
  is fine; we are not doing meteorology.
- **t_actual** is the ground truth in `preheat_records.csv`: each row is one
  event × one device.

---

## 8. The "Monday problem"

Kim et al. report their largest, most consistent errors on **Mondays** — the
first occupancy after a weekend setback. Over an unoccupied weekend the room's
thermal mass drifts far from setpoint and stores/releases significant energy,
which must be recovered during preheat. Models that assume a "normal" starting
state under-predict the time needed, so the room arrives cold.

This is left as future work in the paper. For us it is both a pitfall and an
opportunity:

1. **Detect** it — flag events whose preheat follows a long unoccupied gap
   (weekend, holiday, or simply many idle hours).
2. **Handle** it — either train a separate parameter set for post-gap mornings,
   or apply a correction term that scales with the length of the preceding idle
   period.

Addressing this is a genuine contribution beyond the paper and a strong talking
point for the LB Energy submission.

---

## 9. Implementation plan

### Phase 1 — data preparation

1. Load `heat_pump_snapshots.csv`, `space_events.csv`, `power_draw.csv` for both
   windows; tag each row with its window.
2. Apply health filters: drop rows with `status_is_alarm_active`, non-zero
   `status_error_registers`, network errors, unit off, defrost active, very low
   uptime, or implausible temperatures (outside −30…60 °C).
3. Engineer features: `delta_to_setpoint = 21 − T_zone`, per-device temperature
   rate, `is_conditioning`, `is_monday`, hour-of-day.
4. For each event × device, extract a preheat record:
   `T_zone_initial`, `T_outdoor`, `minutes_to_setpoint` (the target),
   `is_monday`. Save to `preheat_records.csv`.

### Phase 2 — model implementation

**Model 1** (start):

```python
import numpy as np

def fit_model1(df):
    """df has columns: delta (=21−T_zone), t_actual."""
    # t = α_a · delta + α_c   →   linear regression
    X = np.column_stack([df["delta"], np.ones(len(df))])
    alpha_a, alpha_c = np.linalg.lstsq(X, df["t_actual"], rcond=None)[0]
    return {"alpha_a": alpha_a, "alpha_c": alpha_c}

def predict_model1(params, delta):
    return max(0.0, params["alpha_a"] * delta + params["alpha_c"])
```

**Model 3** (target):

```python
def fit_model3(df):
    """df has columns: delta, t_zone, t_outdoor, t_actual."""
    # t = α_a·delta + α_b·delta·(t_zone − t_outdoor) + α_c
    interaction = df["delta"] * (df["t_zone"] - df["t_outdoor"])
    X = np.column_stack([df["delta"], interaction, np.ones(len(df))])
    alpha_a, alpha_b, alpha_c = np.linalg.lstsq(
        X, df["t_actual"], rcond=None
    )[0]
    return {"alpha_a": alpha_a, "alpha_b": alpha_b, "alpha_c": alpha_c}

def predict_model3(params, delta, t_zone, t_outdoor):
    t = (params["alpha_a"] * delta
         + params["alpha_b"] * delta * (t_zone - t_outdoor)
         + params["alpha_c"])
    return max(0.0, t)
```

**Daily parameter update** (exponential moving average):

```python
def ema_update(old, new, lam=0.3):
    """Blend yesterday's smoothed params with today's fresh fit."""
    return {k: old[k] + lam * (new[k] - old[k]) for k in old}
```

Maintain **separate parameter sets per device** and **per mode** (heating vs
cooling), exactly as the paper does. Use a rolling ~10-day window; before enough
data accumulates, fall back to a safe maximum preheat (e.g. 90–120 min).

### Phase 3 — evaluation

Compare predictions to ground truth using the paper's own metrics:

```
e_time  =  t_actual − t_opt        (per event)
e_temp  =  T_zone(at occupancy) − T_sp
```

Targets to match the paper:

- mean |e_time| < 10 minutes
- mean |e_temp| < 0.5 °C

Report the error distribution overall, split by device, and split by
Monday-vs-other. The Monday split is where the interesting story lives.

### Phase 4 — savings visualization

Energy saved per event versus the fixed-schedule baseline (equation 32):

```
ΔkWh  =  Σ  power_kw[device] × (baseline_minutes − t_opt_minutes) / 60
```

Translate into the three quantities the LB Energy brief asks for — **kWh saved,
money saved (× tariff), CO₂ avoided (× grid factor)** — broken down by event, by
device, and by season (heating vs cooling). Add the what-if scenarios the brief
mentions: lowering the setpoint by 2 °C, or using fewer units.

---

## 10. Evaluation targets at a glance

| Metric | Paper benchmark | Meaning |
|---|---|---|
| Mean time error | < 10 min | how close start time is to ideal |
| Mean temperature error | < 0.5 °C | how close room is to 21 °C at start |
| Energy savings | 2–5 kWh/day/unit; ~40% avg | vs fixed 60–120 min schedule |
| Training data needed | ~10 days | before parameters stabilize |
| Sensors needed | indoor + outdoor temp | minimal footprint |

If your implementation lands inside the time and temperature bounds, you have a
paper-grade result; if you additionally handle the Monday case, you have gone
beyond it.

---

## 11. Reference

Kim, W., Yu, M. G., Lutes, R., & Katipamula, S. (2024). *Implementation and
validation of optimal start control strategy for air conditioners and heat
pumps.* Applied Thermal Engineering. Pacific Northwest National Laboratory.

Dataset: IHL Heat Pump Research Dataset (LB Energy), space
`3dbed10b-9e88-4163-916d-3182e2ecc69f`, 4 devices, heating and cooling windows,
all timestamps UTC.
