"""
rc_model.py — Grey-box RC thermal model: system identification + simulation.

The physics core. Fits the linearised 1R1C ODE to telemetry and forward-
simulates room-temperature trajectories.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from scipy.linalg import lstsq

from .config import DT_HOURS


def fit_rc_ols(df: pd.DataFrame) -> dict:
    """
    Fit the linearised RC ODE via two-stage OLS:

    STAGE 1 — tau from passive-cooling periods only:
      During standby (T_supply ≈ T_out), the supply-air term and the heat-loss
      term are collinear, so we use standby data to fit τ = RC directly:
          dT/dt ≈ −(T_room − T_out) / τ + β₃

    STAGE 2 — β₁ from active-heating periods, with τ fixed from Stage 1:
          dT/dt − β₂·(T_room−T_out) = β₁·(T_supply−T_room) + β₃

    COMBINED — full joint OLS on heating-only rows for cross-check:
          dT/dt = β₁·(T_supply−T_room) + β₂·(T_room−T_out) + β₃
    """
    clean_all = df.dropna(subset=["dT_dt", "delta_Tsup_room", "delta_Troom_out"])
    clean_all = clean_all[clean_all["dT_dt"].abs() <= 5.0]

    # ── Stage 1: tau from standby cooling ─────────────────────────────────────
    standby = clean_all[
        (clean_all["T_supply"] < clean_all["T_out"] + 5.0) &   # supply ≈ outdoor air
        (clean_all["P_total_kw"] < 10.0)                        # no electric boost
    ]
    if len(standby) >= 10:
        Xs = np.column_stack([
            -standby["delta_Troom_out"].values,   # coefficient = 1/τ
            np.ones(len(standby)),
        ])
        ys = standby["dT_dt"].values
        th_s, _, _, _ = lstsq(Xs, ys)
        tau_stage1 = 1.0 / th_s[0] if th_s[0] > 0 else float("nan")
        beta2_stage1 = -th_s[0]         # β₂ = −1/τ
    else:
        tau_stage1 = float("nan")
        beta2_stage1 = float("nan")

    # ── Stage 2 + combined: OLS on active-heating rows ───────────────────────
    heating = clean_all[
        clean_all["T_supply"] > clean_all["T_room"] + 5.0   # supply is warmer
    ]
    if len(heating) < 10:
        heating = clean_all[clean_all["T_supply"] >= 40.0]  # fallback

    Xh = np.column_stack([
        heating["delta_Tsup_room"].values,
        heating["delta_Troom_out"].values,
        np.ones(len(heating)),
    ])
    yh = heating["dT_dt"].values
    th_h, _, _, _ = lstsq(Xh, yh)
    beta1_heat, beta2_heat, beta3_heat = th_h

    yh_pred = Xh @ th_h
    ss_res  = np.sum((yh - yh_pred) ** 2)
    ss_tot  = np.sum((yh - yh.mean()) ** 2)
    r2_heat = 1 - ss_res / ss_tot if ss_tot > 0 else float("nan")
    rmse_h  = np.sqrt(np.mean((yh - yh_pred) ** 2))

    # ── Preferred τ: Stage 1 (from cooling) if valid, else Stage 2 ──────────
    if not np.isnan(tau_stage1):
        tau_final  = tau_stage1
        beta2_final = beta2_stage1
    else:
        tau_final  = -1.0 / beta2_heat if beta2_heat < 0 else float("nan")
        beta2_final = beta2_heat

    # ── Stage 2b: re-estimate β₁ with τ fixed from Stage 1 ──────────────────
    if not np.isnan(tau_stage1) and len(heating) >= 5:
        y_adj   = yh - beta2_stage1 * heating["delta_Troom_out"].values
        Xh2     = np.column_stack([
            heating["delta_Tsup_room"].values,
            np.ones(len(heating)),
        ])
        th_h2, _, _, _ = lstsq(Xh2, y_adj)
        beta1_final  = th_h2[0]
        beta3_final  = th_h2[1]
    else:
        beta1_final  = beta1_heat
        beta3_final  = beta3_heat

    # ── Final combined prediction quality on all-data check ──────────────────
    X_all = np.column_stack([
        clean_all["delta_Tsup_room"].values,
        clean_all["delta_Troom_out"].values,
        np.ones(len(clean_all)),
    ])
    y_all      = clean_all["dT_dt"].values
    theta_best = np.array([beta1_final, beta2_final, beta3_final])
    y_pred_all = X_all @ theta_best
    rmse_all   = float(np.sqrt(np.mean((y_all - y_pred_all) ** 2)))
    ss_res_all = np.sum((y_all - y_pred_all) ** 2)
    ss_tot_all = np.sum((y_all - y_all.mean()) ** 2)
    r2_all     = float(1 - ss_res_all / ss_tot_all) if ss_tot_all > 0 else float("nan")

    return {
        "beta1":           beta1_final,
        "beta2":           beta2_final,
        "beta3":           beta3_final,
        "tau_hours":       tau_final,
        "tau_stage1_h":    tau_stage1,
        "beta2_stage1":    beta2_stage1,
        "beta1_heating":   beta1_heat,
        "beta2_heating":   beta2_heat,
        "r2_heating_ols":  r2_heat,
        "rmse_heating_ols": rmse_h,
        "rmse_all":        rmse_all,
        "r2_all":          r2_all,
        "n_standby":       len(standby),
        "n_heating":       len(heating),
        "n_samples":       len(clean_all),
        "theta":           theta_best,
    }


def simulate_trajectory(
    T0:             float,
    T_supply_arr:   np.ndarray,
    T_out_arr:      np.ndarray,
    beta:           tuple[float, float, float],
    dt_h:           float = DT_HOURS,
) -> np.ndarray:
    """
    Forward Euler integration of the RC ODE.
    Returns T_room at each time step (same length as inputs).
    """
    b1, b2, b3 = beta
    T = np.empty(len(T_supply_arr))
    T[0] = T0
    for i in range(1, len(T_supply_arr)):
        dT = (b1 * (T_supply_arr[i-1] - T[i-1])
              + b2 * (T[i-1] - T_out_arr[i-1])
              + b3) * dt_h
        T[i] = T[i-1] + dT
    return T
