"""
explore_and_fit.py — RC Thermal Model: System Identification & Preheat Prediction
LBenergy × TUM Hackathon

Loads the IHL dataset, fits a first-order RC thermal model to the heating window,
prints identified parameters (τ, β₁, β₂), reports fit RMSE, and saves diagnostic plots.
Also demonstrates building-type generalisation via a parameter sweep.

Usage:
    python explore_and_fit.py

Requirements:
    pip install pandas numpy scipy matplotlib
    (lightgbm optional, for residual model section)

Dataset path is hardcoded to the known location; edit DATA_ROOT if needed.
"""

from __future__ import annotations

import sys
import io
import warnings
from pathlib import Path
from datetime import timedelta

# Force UTF-8 output on Windows consoles that default to cp1252
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import numpy as np
import pandas as pd
from scipy.linalg import lstsq

warnings.filterwarnings("ignore")

# ─── Configuration ────────────────────────────────────────────────────────────

# Repo-relative paths so the script runs on any machine after `git clone`.
# This file lives in <repo>/src/, so the repo root is its parent's parent.
REPO_ROOT   = Path(__file__).resolve().parent.parent
DATA_ROOT   = REPO_ROOT / "data"
HEATING_DIR = DATA_ROOT / "heating_2026-03-30_to_2026-04-05"
COOLING_DIR = DATA_ROOT / "cooling_2026-05-25_to_2026-05-31"
OUTPUT_DIR  = REPO_ROOT / "outputs"

RESAMPLE_MIN   = 5          # resample to 5-minute grid
DT_HOURS       = RESAMPLE_MIN / 60.0
T_SUPPLY_PREHEAT = 59.0    # °C: hot-water coil steady-state supply temperature
T_SETPOINT       = 21.0    # °C: occupied setpoint
T_UNOCCUPIED     = 11.0    # °C: night setback
SAFETY_MARGIN    = 0.5     # °C: preheat to T_setpoint - margin

# ─── Plotting: optional ───────────────────────────────────────────────────────

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.dates as mdates
    HAS_MPL = True
except ImportError:
    HAS_MPL = False
    print("[WARN] matplotlib not installed — plots will be skipped")

# ─── 1. Data Loading ──────────────────────────────────────────────────────────

def load_snapshots(directory: Path) -> pd.DataFrame:
    """
    Load heat_pump_snapshots.csv, average across all 4 devices at each
    timestamp (T_room and T_out are shared; T_supply varies slightly).
    Returns a DataFrame indexed by timestamp, resampled to RESAMPLE_MIN.
    """
    snap = pd.read_csv(
        directory / "heat_pump_snapshots.csv",
        parse_dates=["last_seen_at"],
        usecols=[
            "last_seen_at",
            "status_temperature_in_celsius",
            "status_temperature_outside_in_celsius",
            "status_temperature_supply_in_celsius",
            "status_temperature_return_in_celsius",
            "status_is_heating_required",
            "status_target_temperature_in_celsius",
            "status_is_compressor_active",
            "status_humidity_in_percent",
            "status_carbon_dioxide_in_ppm",
        ],
    )
    snap = snap.rename(columns={
        "last_seen_at":                           "ts",
        "status_temperature_in_celsius":          "T_room",
        "status_temperature_outside_in_celsius":  "T_out",
        "status_temperature_supply_in_celsius":   "T_supply",
        "status_temperature_return_in_celsius":   "T_return",
        "status_is_heating_required":             "heating_req",
        "status_target_temperature_in_celsius":   "setpoint",
        "status_is_compressor_active":            "compressor",
        "status_humidity_in_percent":             "humidity",
        "status_carbon_dioxide_in_ppm":           "co2",
    })

    # Average across devices at each timestamp
    snap = snap.groupby("ts").agg(
        T_room      =("T_room",      "mean"),
        T_out       =("T_out",       "mean"),
        T_supply    =("T_supply",    "mean"),
        T_return    =("T_return",    "mean"),
        heating_req =("heating_req", "max"),
        setpoint    =("setpoint",    "first"),
        compressor  =("compressor",  "max"),
        humidity    =("humidity",    "mean"),
        co2         =("co2",         "mean"),
    )

    # Resample to regular 5-minute grid
    snap = snap.resample(f"{RESAMPLE_MIN}min").mean()
    return snap.dropna(subset=["T_room", "T_out", "T_supply"])


def load_power(directory: Path) -> pd.Series:
    """
    Load power_draw.csv, sum kW across all 4 devices per 5-minute timestamp.
    Returns a Series named 'P_total_kw'.
    """
    power = pd.read_csv(
        directory / "power_draw.csv",
        parse_dates=["timestamp"],
        usecols=["timestamp", "power_draw_kw"],
    )
    total = power.groupby("timestamp")["power_draw_kw"].sum()
    total.name = "P_total_kw"
    return total


def load_events(directory: Path) -> pd.DataFrame:
    """Load space_events.csv with UTC-parsed start/end times."""
    ev = pd.read_csv(
        directory / "space_events.csv",
        parse_dates=["starts_at", "ends_at"],
    )
    return ev.sort_values("starts_at").reset_index(drop=True)


def build_dataset(directory: Path) -> pd.DataFrame:
    """Merge snapshots + power into a single analysis DataFrame."""
    snaps = load_snapshots(directory)
    power = load_power(directory)
    df = snaps.join(power, how="inner")

    # Derived features
    df["delta_Tsup_room"] = df["T_supply"] - df["T_room"]   # supply heating drive
    df["delta_Troom_out"] = df["T_room"]   - df["T_out"]    # heat loss drive

    # Forward difference dT/dt in °C/h (using next 5-min step)
    dt_h = RESAMPLE_MIN / 60.0
    df["dT_dt"] = df["T_room"].diff().shift(-1) / dt_h

    # Heating mode classification
    df["mode"] = "standby"
    df.loc[df["T_supply"] >= 40, "mode"] = "fan_coil"          # hot-water coil active
    df.loc[df["P_total_kw"] >= 20, "mode"] = "boost"           # electric boost

    return df


# ─── 2. RC Model OLS Fit ─────────────────────────────────────────────────────

def fit_rc_ols(df: pd.DataFrame) -> dict:
    """
    Fit the linearised RC ODE via two-stage OLS:

    STAGE 1 — tau from passive-cooling periods only:
      During standby (T_supply ≈ T_out), the supply-air term and the heat-loss
      term are collinear (T_supply - T_room ≈ -(T_room - T_out)), so we use
      standby data to fit τ = RC directly:
          dT/dt ≈ −(T_room − T_out) / τ + β₃

    STAGE 2 — β₁ from active-heating periods, with τ fixed from Stage 1:
      In active heating, T_supply >> T_room (supply-air term dominates):
          dT/dt − β₂·(T_room−T_out) = β₁·(T_supply−T_room) + β₃
      Solve for β₁ with β₂ = −1/τ substituted in.

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


# ─── 3. Forward Simulation ────────────────────────────────────────────────────

def simulate_trajectory(
    T0:             float,
    T_supply_arr:   np.ndarray,
    T_out_arr:      np.ndarray,
    beta:           tuple[float, float, float],
    dt_h:           float = DT_HOURS,
) -> np.ndarray:
    """
    Forward Euler integration of RC ODE.
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


# ─── 4. Preheat Start Time Prediction ────────────────────────────────────────

def predict_preheat_start(
    T_room_now:    float,
    T_out_const:   float,
    hours_to_event: float,
    beta:          tuple[float, float, float],
    T_supply_nom:  float = T_SUPPLY_PREHEAT,
    T_target:      float = T_SETPOINT - SAFETY_MARGIN,
    dt_h:          float = DT_HOURS,
    max_lead_h:    float = 24.0,
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


# ─── 5. Building-Type Generalisation Sweep ───────────────────────────────────

BUILDING_TYPES = {
    "Thin tent (4×8m, canvas)":         {"beta1": 0.50,  "beta2": -2.00,  "tau_est": 0.50},
    "Insulated container (6×3m)":       {"beta1": 0.15,  "beta2": -0.20,  "tau_est": 5.00},
    "Prefab hall (medium)":             {"beta1": 0.08,  "beta2": -0.08,  "tau_est": 12.5},
    "THIS BUILDING (fitted from data)": {"beta1": None,  "beta2": None,   "tau_est": None},
    "Well-insulated permanent hall":    {"beta1": 0.05,  "beta2": -0.015, "tau_est": 66.7},
}


# ─── 6. Cross-Window Validation ───────────────────────────────────────────────

def validate_on_cooling(beta: tuple, df_cooling: pd.DataFrame) -> dict:
    """
    Apply heating-window parameters to cooling window.
    Evaluate trajectory RMSE and dT/dt RMSE.
    """
    clean = df_cooling.dropna(subset=["dT_dt", "delta_Tsup_room", "delta_Troom_out"])
    clean = clean[clean["dT_dt"].abs() <= 5.0]

    b1, b2, b3 = beta
    dT_pred = b1 * clean["delta_Tsup_room"] + b2 * clean["delta_Troom_out"] + b3
    rmse_dT = float(np.sqrt(np.mean((dT_pred - clean["dT_dt"]) ** 2)))

    # Forward simulation on a contiguous slice (first 3 days of cooling window)
    sub = df_cooling.loc["2026-05-27":"2026-05-28"].dropna(
        subset=["T_room", "T_supply", "T_out"]
    )
    if len(sub) > 10:
        traj = simulate_trajectory(
            float(sub["T_room"].iloc[0]),
            sub["T_supply"].values,
            sub["T_out"].values,
            beta,
        )
        rmse_traj = float(np.sqrt(np.mean((traj - sub["T_room"].values) ** 2)))
    else:
        rmse_traj = float("nan")

    return {"rmse_dT_per_h": rmse_dT, "rmse_trajectory_degC": rmse_traj}


# ─── 7. Plotting ──────────────────────────────────────────────────────────────

def plot_march30_fit(df: pd.DataFrame, beta: tuple, events: pd.DataFrame) -> None:
    """Plot observed vs RC-predicted temperature on 2026-03-30."""
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

    # Mark events on March 30
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
    """
    Plot required preheat lead time (hours) as a function of starting room
    temperature for several outside temperature scenarios.
    """
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
    """
    Forward-simulate the same real March-30 weather trace with β values
    corresponding to different building types, showing divergent trajectories.
    """
    # Load March 30 weather trace for T_out and T_supply
    df_h = build_dataset(HEATING_DIR)
    day  = df_h.loc["2026-03-30"].dropna(subset=["T_out"])
    T_out_trace   = day["T_out"].values
    T_supply_trace = np.full(len(T_out_trace), T_SUPPLY_PREHEAT)
    T0            = 17.0  # start preheat at 17°C

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


# ─── 8. Main ──────────────────────────────────────────────────────────────────

def main():
    SEP = "=" * 60

    print(SEP)
    print("STEP 1 — Loading heating window data")
    print(SEP)
    df_h  = build_dataset(HEATING_DIR)
    evs_h = load_events(HEATING_DIR)
    print(f"  Snapshots (5-min resampled): {len(df_h)} rows")
    print(f"  Date range : {df_h.index.min()}  →  {df_h.index.max()}")
    print(f"  T_room     : {df_h['T_room'].min():.2f} – {df_h['T_room'].max():.2f} °C")
    print(f"  T_out      : {df_h['T_out'].min():.2f} – {df_h['T_out'].max():.2f} °C")
    print(f"  T_supply   : {df_h['T_supply'].min():.1f} – {df_h['T_supply'].max():.1f} °C")
    print(f"  P_total    : {df_h['P_total_kw'].min():.2f} – {df_h['P_total_kw'].max():.2f} kW")
    print(f"  Events     : {len(evs_h)}")

    mode_counts = df_h["mode"].value_counts()
    print(f"  Mode distribution:")
    for mode, count in mode_counts.items():
        print(f"    {mode:<20}: {count:>4} rows  ({100*count/len(df_h):.1f}%)")

    print()
    print(SEP)
    print("STEP 2 — Fitting RC thermal model (OLS on linearised ODE)")
    print(SEP)
    params = fit_rc_ols(df_h)

    b1, b2, b3 = params["beta1"], params["beta2"], params["beta3"]
    tau = params["tau_hours"]

    print(f"  Stage 1 (passive cooling, n={params['n_standby']}):")
    print(f"    tau     = {params['tau_stage1_h']:.2f} h   (τ = RC from cooling rate)")
    print(f"    β₂      = {params['beta2_stage1']:+.5f}  /h/°C")
    print(f"  Stage 2 (active heating, n={params['n_heating']}):")
    print(f"    β₁      = {b1:+.5f}  /h/°C  (supply-air gain)")
    print(f"    β₂      = {params['beta2_heating']:+.5f}  /h/°C  (heating-only OLS)")
    print(f"    R²      = {params['r2_heating_ols']:.4f}")
    print(f"    RMSE    = {params['rmse_heating_ols']:.4f}  °C/h")
    print(f"  -----------------------------------------------")
    print(f"  FINAL (2-stage preferred):")
    print(f"    β₁ = {b1:+.5f}  β₂ = {b2:+.5f}  β₃ = {b3:+.5f}")
    print(f"    τ  = {tau:.2f} h   RMSE(all) = {params['rmse_all']:.4f} °C/h")
    print(f"    R²(all) = {params['r2_all']:.4f}")

    if abs(b1) < 1e-6 or b2 >= 0:
        print("\n[WARN] Unexpected sign on beta1 or beta2 -- check data quality / filtering")

    beta = (b1, b2, b3)

    print()
    print(SEP)
    print("STEP 3 — Forward simulation: March 30 ramp reproduction")
    print(SEP)
    # Reproduce the observed temperature ramp on March 30 starting at midnight
    day0 = df_h.loc["2026-03-30"].dropna(subset=["T_room", "T_supply", "T_out"])
    if len(day0) > 5:
        traj0 = simulate_trajectory(
            float(day0["T_room"].iloc[0]),
            day0["T_supply"].values,
            day0["T_out"].values,
            beta,
        )
        rmse_traj = float(np.sqrt(np.mean((traj0 - day0["T_room"].values) ** 2)))
        print(f"  March 30 trajectory RMSE  = {rmse_traj:.3f}  °C")
        print(f"  T_room at 04:30 (event start):")
        t_event_idx = (day0.index <= pd.Timestamp("2026-03-30 04:30:00")).sum() - 1
        if 0 <= t_event_idx < len(traj0):
            print(f"    Observed   = {day0['T_room'].iloc[t_event_idx]:.2f} °C")
            print(f"    RC model   = {traj0[t_event_idx]:.2f} °C")
    else:
        print("  [WARN] March 30 data slice too short for forward simulation")

    print()
    print(SEP)
    print("STEP 4 — Preheat prediction: March 30 counterfactual")
    print(SEP)
    T_room_at_setpoint_switch = 16.87   # observed at 02:05 UTC on March 30
    T_out_march30             = 1.0     # stable overnight outside temp

    lead_h, traj_opt = predict_preheat_start(
        T_room_now   = T_room_at_setpoint_switch,
        T_out_const  = T_out_march30,
        hours_to_event = 24,           # search over full 24h horizon
        beta         = beta,
    )
    print(f"  Scenario: T_room_now = {T_room_at_setpoint_switch} °C,  "
          f"T_out = {T_out_march30} °C,  Target = {T_SETPOINT} °C")
    print(f"  Optimal preheat lead time : {lead_h:.2f} h  ({lead_h*60:.0f} min)")
    print(f"  → Send setpoint command   : {lead_h:.2f} h before 04:30  = "
          f"~{int((4.5 - lead_h) % 24):02d}:{int(((4.5 - lead_h) % 1)*60):02d} UTC "
          f"(prev. day if negative)")
    print(f"  Predicted T_room at event start: {traj_opt[-1]:.2f} °C")
    print(f"")
    print(f"  Current system lead time  : 0.42 h (25 min electric boost only)")
    print(f"  Current T_room at event   : 18.80 °C  (2.20 °C below target)")
    print(f"  Improvement               : +{(lead_h - 0.42)*60:.0f} min earlier start required")

    print()
    print(SEP)
    print("STEP 5 — Building-type generalisation: parameter sweep")
    print(SEP)
    fmt = f"  {{:<35}} {{:>8}} {{:>8}} {{:>8}} {{:>12}}"
    print(fmt.format("Building type", "β₂", "τ (h)", "β₁", "Lead (h)*"))
    print("  " + "─" * 73)
    for label, specs in BUILDING_TYPES.items():
        if specs["beta1"] is None:
            b1_use, b2_use, b3_use = b1, b2, b3
            tau_use = tau
        else:
            b1_use = specs["beta1"]
            b2_use = specs["beta2"]
            b3_use = 0.0
            tau_use = -1.0 / b2_use

        lead, _ = predict_preheat_start(17.0, 1.0, 24, (b1_use, b2_use, b3_use))
        print(fmt.format(label, f"{b2_use:.3f}", f"{tau_use:.1f}",
                         f"{b1_use:.3f}", f"{lead:.2f}"))

    print("  * Lead time from 17°C to 20.5°C, T_out=1°C, T_supply=59°C")
    print()
    print("  Key insight: same ODE code, 1-minute to 20+ hour range across building types.")
    print("  A fixed '2.5 h preheat rule' works for containers but fails for this building.")

    print()
    print(SEP)
    print("STEP 6 — Cross-window validation (cooling window)")
    print(SEP)
    try:
        df_c = build_dataset(COOLING_DIR)
        val  = validate_on_cooling(beta, df_c)
        print(f"  Cooling window dT/dt RMSE  : {val['rmse_dT_per_h']:.4f}  °C/h")
        print(f"  Cooling window traj RMSE   : {val['rmse_trajectory_degC']:.3f}  °C")
        print(f"  (Heating-window β parameters applied without re-fitting)")
    except Exception as e:
        print(f"  [ERROR] Cooling validation failed: {e}")

    print()
    print(SEP)
    print("STEP 7 — Generating diagnostic plots")
    print(SEP)
    if HAS_MPL:
        print("  Generating March 30 fit plot ...")
        plot_march30_fit(df_h, beta, evs_h)

        print("  Generating preheat map ...")
        plot_preheat_map(beta)

        print("  Generating building-type sweep ...")
        plot_building_sweep(beta)
    else:
        print("  [SKIP] matplotlib not available")

    print()
    print(SEP)
    print("SUMMARY")
    print(SEP)
    print(f"  RC model parameters (heating window OLS fit):")
    print(f"    β₁ = {b1:.4f}  (supply-air gain, 1/h per °C supply-room ΔT)")
    print(f"    β₂ = {b2:.4f}  (heat loss coeff, 1/h per °C room-outside ΔT)")
    print(f"    τ  = {tau:.1f} h   (thermal time constant R·C)")
    print(f"  Fit quality:  dT/dt RMSE(heating) = {params['rmse_heating_ols']:.4f} °C/h,  "
          f"R²(heating) = {params['r2_heating_ols']:.3f}")
    print(f"  Required preheat (17→21°C, T_out=1°C): {lead_h:.1f} h  vs  0.42 h used")
    print(f"  Output files: {OUTPUT_DIR}")
    print(SEP)


if __name__ == "__main__":
    main()
