"""
backtest.py — Event-level counterfactual evaluation of the preheat controller.

The dataset is historical and already contains the CURRENT (blind) control, so we
cannot literally re-run the building. Instead we replay each event as a
counterfactual:

  • B1 (current / observed)  — read straight from the data: the electrical energy
    actually drawn in the preheat window, and the room temperature actually
    reached at the deadline.
  • B3 (our model)           — the controller picks a start time; we simulate the
    room forward with the RC model and read the comfort it would have achieved,
    plus the electrical energy our Mode-1-only strategy would have drawn.

Energy accounting (ELECTRICAL only — power_draw.csv measures electrical power):
  Verified from data: standby and Mode-1 (fan + hot-water coil) draw the SAME
  ~4.7 kW electrically; only the Mode-2 electric boost spikes to ~70 kW. Our
  controller starts the cheap coil early enough to reach comfort WITHOUT the
  boost, so B3's electrical draw ≈ flat 4.7 kW. The saving vs B1 is essentially
  the boost energy B1 burned. (The coil's thermal/gas cost is similar for both
  strategies and is not in this dataset, so we report the electrical delta only.)

All € / CO₂ factors are assumptions (see config) — label them in any slide.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from .config import (
    T_SETPOINT, SAFETY_MARGIN, P_STANDBY_KW, BOOST_KW_THRESHOLD,
    TARIFF_EUR_PER_KWH, CO2_KG_PER_KWH, BACKTEST_LOOKBACK_H,
)
from .data import load_power_raw
from .pipeline import WINDOWS
from .preheat import predict_preheat_start


def dedupe_events(events: pd.DataFrame) -> pd.DataFrame:
    """Drop exact-duplicate (starts_at, ends_at) rows (the heating window has them)."""
    return (events.drop_duplicates(subset=["starts_at", "ends_at"])
                  .sort_values("starts_at").reset_index(drop=True))


def _window_energy_kwh(power_total: pd.Series, t0, t1) -> float:
    """Integrate actual total electrical power (kW, 5-min) over [t0, t1] → kWh."""
    seg = power_total.loc[t0:t1]
    if len(seg) < 2:
        return float("nan")
    return float(seg.sum() * (5.0 / 60.0))     # 5-min samples → kWh


def evaluate_event(
    df: pd.DataFrame,
    power_total: pd.Series,
    beta: tuple[float, float, float],
    t_event,
    lookback_h: float = BACKTEST_LOOKBACK_H,
    T_supply_nom: float | None = None,
) -> dict | None:
    """Evaluate one event: B1 (observed) vs B3 (our controller)."""
    from .config import T_SUPPLY_PREHEAT
    if T_supply_nom is None:
        T_supply_nom = T_SUPPLY_PREHEAT
    t0 = t_event - pd.Timedelta(hours=lookback_h)
    win = df.loc[t0:t_event]
    if len(win) < 4:
        return None

    # Cold-start realism: the heater must recover from the OVERNIGHT TROUGH, not
    # the (still-warm) temperature at the start of the setback. Using the trough
    # is the conservative, honest choice for "how hard is this preheat?".
    T_start   = float(win["T_room"].min())         # overnight setback trough
    T_out_win = float(win["T_out"].mean())         # representative outside temp
    T_target  = T_SETPOINT - SAFETY_MARGIN

    # ── B3: our controller ────────────────────────────────────────────────
    lead_h, traj = predict_preheat_start(
        T_room_now=T_start, T_out_const=T_out_win,
        hours_to_event=lookback_h, beta=beta, T_supply_nom=T_supply_nom,
    )
    T_pred_deadline = float(traj[-1])
    feasible = lead_h < lookback_h - 1e-3          # reached target within the window
    on_time_B3 = T_pred_deadline >= T_target
    # Mode-1 only (no boost) ⇒ flat standby-level electrical draw across the window.
    E_B3 = P_STANDBY_KW * lookback_h
    if not feasible:                               # too cold/lossy → would still need boost
        on_time_B3 = T_pred_deadline >= T_target

    # ── B1: current system, straight from the data ────────────────────────
    T_obs_deadline = float(df["T_room"].asof(t_event))   # nearest prior reading
    on_time_B1 = T_obs_deadline >= T_target
    E_B1 = _window_energy_kwh(power_total, t0, t_event)

    return {
        "event_start":      t_event,
        "T_start":          round(T_start, 2),
        "T_out_window":     round(T_out_win, 2),
        "B3_lead_h":        round(lead_h, 2),
        "B3_feasible":      feasible,
        "B3_T_deadline":    round(T_pred_deadline, 2),
        "B3_on_time":       on_time_B3,
        "B1_T_deadline":    round(T_obs_deadline, 2),
        "B1_on_time":       on_time_B1,
        "E_B1_kwh":         round(E_B1, 1),
        "E_B3_kwh":         round(E_B3, 1),
        "kwh_saved":        round(E_B1 - E_B3, 1),
    }


def run_backtest(
    window: str = "heating",
    beta: tuple[float, float, float] | None = None,
    lookback_h: float = BACKTEST_LOOKBACK_H,
) -> tuple[pd.DataFrame, dict]:
    """
    Backtest the controller over all (deduped) events in a window.
    Returns (per_event_df, summary_dict). `beta` defaults to a fresh heating fit.
    """
    from .pipeline import run_pipeline
    from .rc_model import fit_heatup_trajectory

    df, events = run_pipeline(window)
    events = dedupe_events(events)

    # Trajectory-calibrated heat-up model (+ consistent supply temp), fit on the
    # heating window. This is what makes lead times realistic — see fit docstring.
    hp = fit_heatup_trajectory(run_pipeline("heating")[0])
    if beta is None:
        beta = (hp["beta1"], hp["beta2"], hp["beta3"])
    T_supply_nom = hp["T_supply_eff"]

    power_total = load_power_raw(WINDOWS[window]).groupby("ts")["kw"].sum()

    rows = [r for e in events["starts_at"]
            if (r := evaluate_event(df, power_total, beta, e, lookback_h,
                                    T_supply_nom=T_supply_nom)) is not None]
    per_event = pd.DataFrame(rows)

    kwh_saved = per_event["kwh_saved"].sum()
    summary = {
        "window":             window,
        "n_events":           len(per_event),
        "model_T_supply_eff": round(T_supply_nom, 1),
        "model_ramp_rmse":    round(hp["ramp_rmse_degC"], 3),
        "mean_lead_h_B3":     round(per_event["B3_lead_h"].mean(), 2),
        "on_time_rate_B1":    round(per_event["B1_on_time"].mean(), 3),
        "on_time_rate_B3":    round(per_event["B3_on_time"].mean(), 3),
        "mean_comfort_B1":    round(per_event["B1_T_deadline"].mean(), 2),
        "mean_comfort_B3":    round(per_event["B3_T_deadline"].mean(), 2),
        "total_kwh_B1":       round(per_event["E_B1_kwh"].sum(), 1),
        "total_kwh_B3":       round(per_event["E_B3_kwh"].sum(), 1),
        "kwh_saved":          round(kwh_saved, 1),
        "pct_saved":          round(100 * kwh_saved / per_event["E_B1_kwh"].sum(), 1),
        "eur_saved":          round(kwh_saved * TARIFF_EUR_PER_KWH, 1),
        "co2_saved_kg":       round(kwh_saved * CO2_KG_PER_KWH, 1),
    }
    return per_event, summary
