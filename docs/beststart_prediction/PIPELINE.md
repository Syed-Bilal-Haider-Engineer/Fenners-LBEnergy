# Data Pipeline — How To Use It

A practical guide for the team. For the *why* (design decisions, aggregation
rationale), see [`DATA_CONTRACT.md`](DATA_CONTRACT.md). This doc is the *how*.

---

## TL;DR — get data in 3 lines

```python
import sys; sys.path.insert(0, "src")          # if running from repo root
from lbenergy import run_pipeline, run_anomaly_pipeline

df, events = run_pipeline("heating")           # prediction frame (room-level, 15-min)
adf        = run_anomaly_pipeline("heating")   # anomaly frame (device-level, ~90 s)
```

That's it. `df` is ready for the RC model; `adf` is ready for anomaly detection.
Swap `"heating"` for `"cooling"` to get the other window.

---

## The big picture

There are **two pipelines** because the two jobs need differently-shaped data.
Both are built from the **same raw load + same cleaning step**, then diverge:

```
 CSVs ──> load_snapshots_raw ─┐
                              ├─ clean() ─┬─ build_prediction_frame ─> df   (RC model)
          load_power_raw ─────┘          └─ build_anomaly_frame    ─> adf  (anomaly)
                              + external.py (weather) joined on demand
```

| | Prediction (`df`) | Anomaly (`adf`) |
|---|---|---|
| Shape | one room, **15-min** rows | **per-device**, native **~90 s** rows |
| Aggregation | median (room) · sum (power) · max (heat/boost) | none — devices kept separate |
| Cleaning | drops alarms & defrost | **keeps** alarms & defrost (they're the signal) |
| Entry point | `run_pipeline(window)` | `run_anomaly_pipeline(window)` |
| Builder | `build_prediction_frame(dir)` | `build_anomaly_frame(dir)` |

---

## Everything you can import

```python
from lbenergy import (
    run_pipeline,            # -> (df, events)  prediction pipeline for a window
    run_anomaly_pipeline,    # -> adf           anomaly pipeline for a window
    build_prediction_frame,  # builder, if you have a custom data directory
    build_anomaly_frame,     # builder, if you have a custom data directory
    load_snapshots_raw,      # shared raw device-level loader (native res)
    load_power_raw,          # shared raw power loader (per device, 5-min)
    load_events,             # space_events (the occupancy / deadline table)
    clean,                   # shared cleaning step
    fit_rc_ols,              # fit the RC model on df
    simulate_trajectory,     # forward-simulate room temperature
    predict_preheat_start,   # the controller: optimal start time
    validate_on_cooling,     # cross-window check
    fetch_weather,           # external source: weather (Open-Meteo)
    join_external,           # merge weather onto a frame
)
```

The two `run_*` functions are what you'll use 95% of the time.

---

## Output reference — prediction frame (`df`)

Indexed by UTC timestamp on a **15-minute** grid. One row = the whole room at that time.

| Column | Unit | Meaning |
|---|---|---|
| `T_room` | °C | room air temp (median of 4 devices) |
| `T_out` | °C | outside temp at the units (median) |
| `T_supply` | °C | supply-air temp — the heating **drive** |
| `T_return` | °C | return-air temp |
| `heating_req` | 0/1 | any device demanded heating in the bucket |
| `setpoint` | °C | control setpoint (11 unoccupied / 21 occupied) |
| `compressor` | 0/1 | any compressor active |
| `humidity` | % | room relative humidity (median) |
| `co2` | ppm | room CO₂ (median) — occupancy proxy |
| `P_total_kw` | kW | total electrical power, mean over the bucket |
| `P_total_max_kw` | kW | total power **max** over the bucket (drives boost flag) |
| `delta_Tsup_room` | °C | `T_supply − T_room` (RC β₁ term) |
| `delta_Troom_out` | °C | `T_room − T_out` (RC β₂ term) |
| `dT_dt` | °C/h | room-temp rate of change (RC fit **target**) |
| `is_boost` | 0/1 | Mode-2 electric boost active (`P_total_max_kw ≥ 20 kW`) |
| `mode` | str | `standby` / `fan_coil` / `boost` |

`events` (returned alongside `df`) has `starts_at`, `ends_at`, `type`, `source` —
the occupancy periods. `starts_at` is the deadline the controller must hit.

---

## Output reference — anomaly frame (`adf`)

Indexed by UTC timestamp at **native ~90 s**. One row = one device's report.
Keeps `device_id` plus the diagnostic signals a detector needs:

| Column | Meaning |
|---|---|
| `device_id` | which of the 4 heat pumps |
| `T_room`, `T_out`, `T_supply`, `T_return` | this device's temperatures |
| `T_room_ref` | peer median room temp (same 2-min bucket) |
| **`T_room_dev`** | `T_room − T_room_ref` — **deviation from peers** (key fault signal) |
| `p_low`, `p_high` | refrigerant pressures (fault diagnostics) |
| `flow_supply`, `flow_return` | fan airflow % |
| `compressor`, `defrost`, `alarm` | operating-state flags (kept, not dropped) |
| `net_error`, `uptime_s`, `enabled` | health/connectivity |
| `P_device_kw` | this device's power (nearest 5-min reading) |

> `T_room_dev` is your cheapest, strongest detector: one device reading far from
> the other three = a sensor fault or a local disturbance. Defrost is **kept** so
> you can teach the detector that a defrost dip is normal, not a fault.

---

## External weather (second data source)

```python
from lbenergy import fetch_weather, join_external

weather = fetch_weather("2026-03-30", "2026-04-05")   # real Open-Meteo data
df      = join_external(df, weather)                   # adds the columns below
```

Adds `T_out_fc` (forecast outside temp), `solar_irradiance`, `wind_speed`,
`humidity_out`, interpolated onto `df`'s grid. **Offline-safe:** if the API is
unreachable the columns arrive as `NaN` and the rest of the pipeline still runs
(fall back to the on-unit `T_out` sensor). First call caches to
`data/_external_cache/`.

---

## Common recipes

**Fit the model and get parameters**
```python
from lbenergy import run_pipeline, fit_rc_ols
df, _ = run_pipeline("heating")
p = fit_rc_ols(df)
beta = (p["beta1"], p["beta2"], p["beta3"])       # use these in the controller
```
Or from the shell: `python scripts/train.py --window heating` → writes
`models/rc_params.json`.

**Predict an optimal preheat start**
```python
from lbenergy import predict_preheat_start
lead_h, traj = predict_preheat_start(
    T_room_now=16.9, T_out_const=1.0, hours_to_event=6.0, beta=beta)
print(f"start {lead_h:.2f} h before the event")
```

**Check generalisation across seasons**
```python
from lbenergy import validate_on_cooling
df_cool, _ = run_pipeline("cooling")
print(validate_on_cooling(beta, df_cool))
```

**Look at one device for anomaly work**
```python
adf = run_anomaly_pipeline("heating")
dev1 = adf[adf["device_id"] == adf["device_id"].unique()[0]]
big_dev = adf[adf["T_room_dev"].abs() > 1.0]      # candidate sensor faults
```

---

## Config knobs (`src/lbenergy/config.py`)

| Constant | Default | What it controls |
|---|---|---|
| `PRED_RESAMPLE_MIN` | 15 | prediction grid (minutes) |
| `ANOMALY_REF_BUCKET` | "2min" | window for the peer-median deviation |
| `BOOST_KW_THRESHOLD` | 20 | total kW above which = electric boost |
| `T_SETPOINT` / `T_UNOCCUPIED` | 21 / 11 | comfort / setback targets |
| `RESAMPLE_MIN` / `DT_HOURS` | 5 | controller forward-sim step |

Change `PRED_RESAMPLE_MIN` to re-grid the prediction pipeline (10/15/30 min) —
everything downstream picks it up automatically.

---

## Gotchas

- **Run from the repo root** (or have `src/` on the path). The two `run_*`
  functions read from `data/heating_…` and `data/cooling_…` automatically.
- **Don't drop boost rows.** They look extreme but the model needs them
  (`is_boost` flags them; the fit handles them).
- **Anomaly uses native ~90 s on purpose** — don't resample it to 1 min; the
  sensors don't report that fast, so you'd be inventing data.
- **`dT_dt` is the fit target, not an input** — it's the next-step temperature
  change. Select model parameters by **trajectory RMSE**, not `dT_dt` R²
  (the 15-min rate is still a bit noisy).
- **Parquet isn't installed** in this env — caches use CSV. Don't call
  `persist_parquet` unless you `pip install pyarrow` first.

---

## Where things live

```
src/lbenergy/
  config.py     paths + constants (grids, thresholds, setpoints)
  data.py       raw loaders, clean(), build_prediction_frame, build_anomaly_frame
  external.py   weather (Open-Meteo) fetch + join
  pipeline.py   run_pipeline / run_anomaly_pipeline entry points
  rc_model.py   fit_rc_ols + simulate_trajectory  (the physics core)
  preheat.py    predict_preheat_start             (the controller)
  residual.py   ML residual corrector             (stub)
  evaluate.py   validate_on_cooling, trajectory_rmse
scripts/
  train.py      CLI: fit + save params to models/
```
