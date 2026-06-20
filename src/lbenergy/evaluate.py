"""
evaluate.py — Cross-window validation and metrics.

Applies parameters fitted on one window (heating) to another (cooling) to
test generalisation without re-fitting.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from .config import PRED_DT_HOURS
from .rc_model import simulate_trajectory


def validate_on_cooling(beta: tuple, df_cooling: pd.DataFrame) -> dict:
    """
    Apply heating-window parameters to the cooling window.
    Evaluate trajectory RMSE and dT/dt RMSE.
    """
    clean = df_cooling.dropna(subset=["dT_dt", "delta_Tsup_room", "delta_Troom_out"])
    clean = clean[clean["dT_dt"].abs() <= 5.0]

    b1, b2, b3 = beta
    dT_pred = b1 * clean["delta_Tsup_room"] + b2 * clean["delta_Troom_out"] + b3
    rmse_dT = float(np.sqrt(np.mean((dT_pred - clean["dT_dt"]) ** 2)))

    # Forward simulation on a contiguous slice (first days of cooling window)
    sub = df_cooling.loc["2026-05-27":"2026-05-28"].dropna(
        subset=["T_room", "T_supply", "T_out"]
    )
    if len(sub) > 10:
        traj = simulate_trajectory(
            float(sub["T_room"].iloc[0]),
            sub["T_supply"].values,
            sub["T_out"].values,
            beta,
            dt_h=PRED_DT_HOURS,        # match the prediction-frame grid (15-min)
        )
        rmse_traj = float(np.sqrt(np.mean((traj - sub["T_room"].values) ** 2)))
    else:
        rmse_traj = float("nan")

    return {"rmse_dT_per_h": rmse_dT, "rmse_trajectory_degC": rmse_traj}


def trajectory_rmse(predicted: np.ndarray, observed: np.ndarray) -> float:
    """RMS error between a predicted and observed temperature trajectory (°C)."""
    return float(np.sqrt(np.mean((predicted - observed) ** 2)))
