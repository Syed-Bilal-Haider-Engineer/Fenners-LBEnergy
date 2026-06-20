"""
run_diagnostics.py — End-to-end diagnostics: fit, simulate, predict, plot.

Usage:
    python scripts/run_diagnostics.py

Reproduces the full analysis (RC fit, March-30 reproduction, preheat
counterfactual, building-type sweep, cross-window validation) and writes
diagnostic plots into outputs/.
"""

from __future__ import annotations

import sys
import io
import warnings
from pathlib import Path

# Make the src/ package importable when run as a plain script.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

# Force UTF-8 output on Windows consoles that default to cp1252
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import numpy as np   # noqa: E402
import pandas as pd  # noqa: E402

from lbenergy import config, run_pipeline, fit_rc_ols, simulate_trajectory  # noqa: E402
from lbenergy import predict_preheat_start, validate_on_cooling            # noqa: E402
from lbenergy.config import (                                              # noqa: E402
    T_SETPOINT, BUILDING_TYPES,
)
from lbenergy.plots import (                                               # noqa: E402
    plot_march30_fit, plot_preheat_map, plot_building_sweep,
)

warnings.filterwarnings("ignore")
SEP = "=" * 60


def main():
    config.ensure_dirs()

    print(SEP); print("STEP 1 — Loading heating window data"); print(SEP)
    df_h, evs_h = run_pipeline("heating")
    print(f"  Snapshots (5-min resampled): {len(df_h)} rows")
    print(f"  Date range : {df_h.index.min()}  →  {df_h.index.max()}")
    print(f"  T_room     : {df_h['T_room'].min():.2f} – {df_h['T_room'].max():.2f} °C")
    print(f"  T_out      : {df_h['T_out'].min():.2f} – {df_h['T_out'].max():.2f} °C")
    print(f"  Events     : {len(evs_h)}")

    print(); print(SEP); print("STEP 2 — Fitting RC thermal model"); print(SEP)
    params = fit_rc_ols(df_h)
    b1, b2, b3 = params["beta1"], params["beta2"], params["beta3"]
    tau = params["tau_hours"]
    beta = (b1, b2, b3)
    print(f"  β₁ = {b1:+.5f}  β₂ = {b2:+.5f}  β₃ = {b3:+.5f}")
    print(f"  τ  = {tau:.2f} h   RMSE(all) = {params['rmse_all']:.4f} °C/h   "
          f"R²(all) = {params['r2_all']:.4f}")

    print(); print(SEP); print("STEP 3 — March 30 ramp reproduction"); print(SEP)
    day0 = df_h.loc["2026-03-30"].dropna(subset=["T_room", "T_supply", "T_out"])
    if len(day0) > 5:
        traj0 = simulate_trajectory(
            float(day0["T_room"].iloc[0]),
            day0["T_supply"].values, day0["T_out"].values, beta,
        )
        rmse_traj = float(np.sqrt(np.mean((traj0 - day0["T_room"].values) ** 2)))
        print(f"  March 30 trajectory RMSE = {rmse_traj:.3f} °C")

    print(); print(SEP); print("STEP 4 — Preheat counterfactual"); print(SEP)
    lead_h, traj_opt = predict_preheat_start(
        T_room_now=16.87, T_out_const=1.0, hours_to_event=24, beta=beta,
    )
    print(f"  Optimal preheat lead time : {lead_h:.2f} h  ({lead_h*60:.0f} min)")
    print(f"  Predicted T_room at event : {traj_opt[-1]:.2f} °C")
    print(f"  Current system            : 0.42 h → 18.80 °C (2.20 °C short)")

    print(); print(SEP); print("STEP 5 — Building-type sweep"); print(SEP)
    for label, specs in BUILDING_TYPES.items():
        if specs["beta1"] is None:
            beta_use, tau_use = beta, tau
        else:
            beta_use = (specs["beta1"], specs["beta2"], 0.0)
            tau_use = -1.0 / specs["beta2"]
        lead, _ = predict_preheat_start(17.0, 1.0, 24, beta_use)
        print(f"  {label:<35} τ={tau_use:6.1f} h  lead={lead:5.2f} h")

    print(); print(SEP); print("STEP 6 — Cross-window validation"); print(SEP)
    try:
        df_c, _ = run_pipeline("cooling")
        val = validate_on_cooling(beta, df_c)
        print(f"  Cooling dT/dt RMSE : {val['rmse_dT_per_h']:.4f} °C/h")
        print(f"  Cooling traj  RMSE : {val['rmse_trajectory_degC']:.3f} °C")
    except Exception as e:
        print(f"  [ERROR] {e}")

    print(); print(SEP); print("STEP 7 — Diagnostic plots"); print(SEP)
    plot_march30_fit(df_h, beta, evs_h)
    plot_preheat_map(beta)
    plot_building_sweep(beta)

    print(); print(SEP); print("DONE"); print(SEP)
    print(f"  Plots written to: {config.OUTPUT_DIR}")


if __name__ == "__main__":
    main()
