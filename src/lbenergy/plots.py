"""
plots.py — Diagnostic plotting.

All figures write into config.OUTPUT_DIR. matplotlib is imported lazily so the
rest of the package works in environments without it.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from .config import (
    DT_HOURS, OUTPUT_DIR, T_SUPPLY_PREHEAT, HEATING_DIR,
)
from .data import build_dataset
from .rc_model import simulate_trajectory
from .preheat import predict_preheat_start

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.dates as mdates
    HAS_MPL = True
except ImportError:
    HAS_MPL = False


def plot_march30_fit(df: pd.DataFrame, beta: tuple, events: pd.DataFrame) -> None:
    """Plot observed vs RC-predicted temperature on 2026-03-30."""
    if not HAS_MPL:
        print("  [SKIP] matplotlib not available")
        return
    day = df.loc["2026-03-30"].dropna(subset=["T_room", "T_supply", "T_out"])
    if len(day) < 5:
        print("[WARN] Insufficient data for March 30 plot")
        return

    traj = simulate_trajectory(
        float(day["T_room"].iloc[0]),
        day["T_supply"].values,
        day["T_out"].values,
        beta,
    )

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(13, 8), sharex=True)
    fig.suptitle("2026-03-30  —  RC Model Fit vs Observed (Heating Window)", fontsize=13)

    ax1.plot(day.index, day["T_room"].values, "b-", lw=2, label="T_room observed")
    ax1.plot(day.index, traj,                 "r--", lw=2, label="T_room RC predicted")
    ax1.plot(day.index, day["T_out"].values,  "grey", lw=1, alpha=0.7, label="T_out")
    ax1.plot(day.index, day["T_supply"].values, "orange", lw=1, alpha=0.7, label="T_supply")

    march30_events = events[events["starts_at"].dt.date.astype(str) == "2026-03-30"]
    for _, ev in march30_events.iterrows():
        ax1.axvline(ev["starts_at"], color="green", ls=":", lw=1.5, alpha=0.8)
        ax1.axvline(ev["ends_at"],   color="red",   ls=":", lw=1.0, alpha=0.5)

    ax1.axvline(pd.Timestamp("2026-03-30 02:05:00"),
                color="purple", ls="--", lw=1.5, label="Setpoint→21°C (02:05)")
    ax1.axvline(pd.Timestamp("2026-03-30 04:05:00"),
                color="darkorange", ls="--", lw=1.5, label="Boost on (04:05)")

    ax1.axhline(21.0, color="green", ls="-", lw=0.8, alpha=0.5, label="Target 21°C")
    ax1.set_ylabel("Temperature (°C)")
    ax1.legend(fontsize=7, loc="lower right")
    ax1.grid(True, alpha=0.3)

    rmse_day = np.sqrt(np.mean((traj - day["T_room"].values) ** 2))
    ax1.text(0.01, 0.97, f"Trajectory RMSE: {rmse_day:.2f} °C",
             transform=ax1.transAxes, va="top", fontsize=9,
             bbox=dict(facecolor="white", alpha=0.7))

    ax2.plot(day.index, day["P_total_kw"].values, "k-", lw=1.5, label="P_total (kW)")
    ax2.axvline(pd.Timestamp("2026-03-30 04:05:00"),
                color="darkorange", ls="--", lw=1.5, label="Boost on")
    ax2.set_ylabel("Power (kW)")
    ax2.set_xlabel("Time (UTC)")
    ax2.legend(fontsize=8)
    ax2.grid(True, alpha=0.3)
    ax2.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M"))

    plt.tight_layout()
    out = OUTPUT_DIR / "diagnostic_rc_fit.png"
    plt.savefig(out, dpi=150)
    plt.close()
    print(f"  Saved: {out}")


def plot_preheat_map(beta: tuple) -> None:
    """Required preheat lead time vs starting room temp, for several T_out scenarios."""
    if not HAS_MPL:
        print("  [SKIP] matplotlib not available")
        return
    T_starts  = np.linspace(11, 20, 50)
    scenarios = {
        "T_out = −10 °C (freak cold)": -10.0,
        "T_out =  −5 °C (cold snap)":   -5.0,
        "T_out =   1 °C (March 30)":     1.0,
        "T_out =   5 °C (mild)":          5.0,
        "T_out =  10 °C (spring)":       10.0,
    }
    colours = ["navy", "blue", "darkorange", "green", "red"]

    fig, ax = plt.subplots(figsize=(11, 6))
    ax.set_title("Required Preheat Lead Time (RC Model, T_supply = 59 °C)", fontsize=12)

    for (label, T_out), colour in zip(scenarios.items(), colours):
        leads = [predict_preheat_start(ts, T_out, 24, beta)[0] for ts in T_starts]
        ax.plot(T_starts, leads, label=label, lw=2, color=colour)

    ax.axhline(0.42, color="red", ls="--", lw=1.5,
               label="Current: 25-min boost only (0.42 h)")
    ax.fill_between(T_starts, 0, 0.42, alpha=0.08, color="red",
                    label="Comfort-failure zone (insufficient preheat)")

    ax.set_xlabel("Starting room temperature (°C)", fontsize=11)
    ax.set_ylabel("Required preheat lead time (h)", fontsize=11)
    ax.legend(fontsize=8, loc="upper right")
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    out = OUTPUT_DIR / "diagnostic_preheat_map.png"
    plt.savefig(out, dpi=150)
    plt.close()
    print(f"  Saved: {out}")


def plot_building_sweep(beta_fitted: tuple) -> None:
    """Forward-simulate the real March-30 weather with β for different building types."""
    if not HAS_MPL:
        print("  [SKIP] matplotlib not available")
        return
    df_h = build_dataset(HEATING_DIR)
    day  = df_h.loc["2026-03-30"].dropna(subset=["T_out"])
    T_out_trace    = day["T_out"].values
    T_supply_trace = np.full(len(T_out_trace), T_SUPPLY_PREHEAT)
    T0             = 17.0  # start preheat at 17°C

    buildings = {
        "Tent (τ ≈ 0.5 h)":           (0.50, -2.00,  0.0),
        "Container (τ ≈ 5 h)":        (0.15, -0.20,  0.0),
        "Prefab hall (τ ≈ 12.5 h)":   (0.08, -0.08,  0.0),
        "THIS BUILDING (τ fitted)":   beta_fitted,
    }

    times_h = np.arange(len(T_out_trace)) * DT_HOURS

    fig, ax = plt.subplots(figsize=(11, 6))
    ax.set_title(
        "Generalisation: Same ODE, Different Building Parameters\n"
        "Real March-30 Weather — Starting T_room = 17°C",
        fontsize=11,
    )

    colours = ["green", "blue", "orange", "red"]
    for (label, beta), colour in zip(buildings.items(), colours):
        traj = simulate_trajectory(T0, T_supply_trace, T_out_trace, beta)
        ax.plot(times_h, traj, label=label, lw=2, color=colour)

    ax.axhline(21.0, color="black", ls="--", lw=1, label="Target 21°C")
    ax.set_xlabel("Time from preheat start (h)", fontsize=11)
    ax.set_ylabel("Room temperature (°C)", fontsize=11)
    ax.legend(fontsize=9)
    ax.grid(True, alpha=0.3)
    ax.set_xlim(0, 12)
    plt.tight_layout()
    out = OUTPUT_DIR / "diagnostic_building_sweep.png"
    plt.savefig(out, dpi=150)
    plt.close()
    print(f"  Saved: {out}")
