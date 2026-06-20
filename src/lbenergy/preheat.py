"""
preheat.py — The decision output: optimal preheat start-time prediction.

Binary-searches the minimum lead time such that the RC simulation reaches
the target temperature exactly at event start.
"""

from __future__ import annotations

import numpy as np

from .config import DT_HOURS, T_SETPOINT, T_SUPPLY_PREHEAT, SAFETY_MARGIN
from .rc_model import simulate_trajectory


def predict_preheat_start(
    T_room_now:     float,
    T_out_const:    float,
    hours_to_event: float,
    beta:           tuple[float, float, float],
    T_supply_nom:   float = T_SUPPLY_PREHEAT,
    T_target:       float = T_SETPOINT - SAFETY_MARGIN,
    dt_h:           float = DT_HOURS,
    max_lead_h:     float = 24.0,
) -> tuple[float, np.ndarray]:
    """
    Binary-search for the minimum preheat lead time (hours) such that
    the RC simulation reaches T_target exactly at event start.

    Returns: (lead_time_hours, T_trajectory_at_optimal_lead)
    """
    def simulate_from_lead(lead_h: float) -> float:
        n = max(2, int(lead_h / dt_h) + 1)
        T_sup = np.full(n, T_supply_nom)
        T_out = np.full(n, T_out_const)
        traj  = simulate_trajectory(T_room_now, T_sup, T_out, beta, dt_h)
        return traj[-1]

    lo, hi = 0.0, max_lead_h
    for _ in range(24):              # 2^24 steps → sub-second precision
        mid = (lo + hi) / 2.0
        T_at_event = simulate_from_lead(mid)
        if T_at_event >= T_target:
            hi = mid
        else:
            lo = mid

    optimal = hi
    n_steps = max(2, int(optimal / dt_h) + 1)
    T_sup   = np.full(n_steps, T_supply_nom)
    T_out_a = np.full(n_steps, T_out_const)
    traj    = simulate_trajectory(T_room_now, T_sup, T_out_a, beta, dt_h)
    return optimal, traj
