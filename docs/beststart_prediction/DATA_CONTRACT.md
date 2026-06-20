# Data Contract — Physics (RC) Model

This is the **interface** between the people doing data cleaning and the people
building the physics model. If both sides honour this contract, the cleaning work
and the modelling work can proceed in parallel and just snap together.

> **Boundary of responsibility**
> - **Cleaning team** delivers two clean source tables (§1, §2) on the agreed grid.
> - **Model pipeline** (`src/lbenergy/`) builds derived features (§3) and consumes
>   the merged frame (§4). Feature derivation is *not* cleaning — it lives in code.

The single thing both sides share: **a UTC timestamp index.** That is the join key;
each pipeline aligns external data onto its own grid (15-min prediction, ~90 s anomaly).

---

## 0. Two data sources (recap)

| | Source 1 — INTERNAL | Source 2 — EXTERNAL |
|---|---|---|
| Origin | IHL telemetry CSVs (`heat_pump_snapshots`, `power_draw`, `space_events`) | Weather API (Open-Meteo) + optional grid price/carbon |
| Owns | what the building *is doing* (room temp, supply temp, power, occupancy) | what the building *can't measure*: weather **forecast**, solar, wind |
| Resolution | native ~90 s → **prediction**: aggregate to 15 min · **anomaly**: keep native ~90 s | hourly → interpolate to the consuming grid |
| Code | `data.py` | `external.py` |
| Why both | the controller decides *hours ahead*, so it needs the forecast, not just the latest sensor reading |

### Two pipelines, one shared core

`data.py` exposes a shared `load_snapshots_raw` + `clean`, then two builders that
differ only at aggregation:

| Builder | Shape | Grid | Aggregation | Feeds |
|---|---|---|---|---|
| `build_prediction_frame` | room-level | **15 min** | median (room) · sum (power) · max (heating/boost) | RC model |
| `build_anomaly_frame` | **device-level** | **native ~90 s** | none — keeps devices separate + `T_room_dev` | anomaly detector |

The prediction grid is 15 min because coarser dT/dt is less noisy → better fit
(verified: R² 0.09→0.16, trajectory 1.44→0.92 °C vs 5 min). The anomaly grid is
native because sensors report every ~90 s and a finer grid would only interpolate.
`clean()` drops alarm/defrost rows for prediction but **keeps them for anomaly**
(they are the signal), via `drop_alarms=False, drop_defrost=False`.

---

## 1. Source 1 — Internal telemetry (cleaned, room-level)

One row per **15-minute** UTC timestamp (prediction pipeline). The 4 devices are
aggregated to a single room view using these rules (this is the resolution of the
"should we average?" question):

| Column | Unit | dtype | Aggregation across 4 devices | Meaning |
|---|---|---|---|---|
| `ts` (index) | UTC | datetime | — | 15-min grid, the join key |
| `T_room` | °C | float | **median** | room air temp (median ignores one faulty sensor) |
| `T_supply` | °C | float | **median** | supply-air temp — the heating **drive** signal |
| `T_out` | °C | float | **median** | on-unit outside sensor (fallback for forecast) |
| `T_return` | °C | float | median | return-air temp (diagnostics) |
| `P_total_kw` | kW | float | **sum** | total electrical power — needed to flag boost mode |
| `heating_req` | 0/1 | int | **max** (any device) | a device demands heating |
| `setpoint` | °C | float | first | shared control setpoint (11 or 21) |
| `humidity` | % | float | median | room relative humidity |
| `co2` | ppm | float | median | occupancy proxy |

> **Implemented:** `build_prediction_frame` aggregates room signals with `median`,
> power with `sum`, heating/boost with `max`. Boost is flagged from the **max**
> power in each 15-min bucket (`P_total_max_kw`) so a brief boost isn't averaged
> below the threshold.

### Cleaning rules (drop / flag these rows before delivery)

Drop rows where any of the following hold (they corrupt system identification):

- `status_is_alarm_active == 1` **or** `status_error_registers` non-zero
- a network error is set (`status_has_network_error`, or `network_error_count > 0`)
- `status_is_defrost_active == 1` (normal, but distorts the heating signal)
- unit disabled (`status_is_enabled == 0`)
- implausible values: `T_room`/`T_out` outside −30…60 °C, `humidity` outside 0–100
- very low `status_system_uptime_in_seconds` (controller just rebooted — unstable)

Do **not** drop boost-mode rows — the model needs them (it flags them, see §3).

---

## 2. Source 2 — External weather (cleaned, forecast)

Interpolated from hourly onto the consuming pipeline's grid (15-min for prediction).
Delivered by `external.py::fetch_weather` + `join_external`; the cleaning team only
needs to confirm the location and date range.

| Column | Unit | dtype | Meaning |
|---|---|---|---|
| `T_out_fc` | °C | float | forecast/archive outside temperature over the preheat window |
| `solar_irradiance` | W/m² | float | global horizontal irradiance (free daytime heat) |
| `wind_speed` | m/s | float | 10 m wind (heat loss driver for thin structures) |
| `humidity_out` | % | float | outside relative humidity |

**Missing-data rule:** if the API is unavailable, these columns arrive as `NaN`.
Downstream code must fall back to the on-unit `T_out` sensor for the controller and
simply skip the solar/wind features in the residual model. (Already handled in
`join_external`.)

---

## 3. Derived features (built in code, NOT by the cleaning team)

Computed by `data.py::build_dataset` on the merged frame. Listed here so everyone
knows these are *outputs of the pipeline*, not inputs to clean:

| Feature | Formula | Used by |
|---|---|---|
| `delta_Tsup_room` | `T_supply − T_room` | RC fit (β₁ term) |
| `delta_Troom_out` | `T_room − T_out` | RC fit (β₂ term) |
| `dT_dt` | `T_room.diff().shift(-1) / dt_h` (°C/h) | RC fit **target** |
| `mode` | `standby` / `fan_coil` (T_supply≥40) / `boost` (P_total≥20) | analysis |
| `is_boost` | `P_total_kw ≥ BOOST_KW_THRESHOLD` | RC fit (β₄ nuisance term) |
| `occupied` | timestamp inside a `space_events` interval | controller deadline |

---

## 4. The merged model-input frame

What the model actually trains on = **Source 1 ⟕ Source 2 on `ts`**, plus §3
features. One row per 15-min timestamp:

```
ts(index) | T_room T_supply T_out T_return P_total_kw heating_req setpoint humidity co2   # Source 1
          | T_out_fc solar_irradiance wind_speed humidity_out                            # Source 2
          | delta_Tsup_room delta_Troom_out dT_dt mode is_boost occupied                 # Derived §3
```

Build it with:

```python
from lbenergy import run_pipeline
from lbenergy.external import fetch_weather, join_external

df, events = run_pipeline("heating")              # Source 1 + derived features
weather    = fetch_weather("2026-03-30", "2026-04-05")   # Source 2
df         = join_external(df, weather)           # merged frame on the 5-min grid
```

---

## 5. Validation gate (run before trusting the frame)

The cleaning team should ship a one-line "data health" summary asserting:

- [ ] grid is regular 5-min, monotonic, no duplicate timestamps
- [ ] `space_events` intervals fall inside the telemetry window
- [ ] no negative `P_total_kw`; `T_room`/`T_out` within plausible range
- [ ] row count after cleaning is logged (how many dropped, and why)
- [ ] both windows (`heating`, `cooling`) produced with identical schema

---

## 6. Train / validation split (fixed, so results are comparable)

| Split | Data | Purpose |
|---|---|---|
| **Train** | heating window (Mar 30 – Apr 5) | fit RC parameters |
| **Validation** | cooling window (May 25 – May 31) | cross-season generalization |
| **Per-event CV** | leave-one-event-out within heating | trajectory robustness |

Selection metric is **trajectory RMSE** on held-out events (see MODEL_DESIGN §8 and
the parameter-selection note), *not* dT/dt R² — the 5-min rate is too noisy to rank
parameter sets reliably.
