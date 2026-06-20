"""
train.py — Calibrate the RC thermal model and save parameters to models/.

Usage:
    python scripts/train.py [--window heating|cooling]

Writes models/rc_params.json containing the fitted {β₁, β₂, β₃, τ}.
"""

from __future__ import annotations

import argparse
import io
import json
import sys
from pathlib import Path

# Force UTF-8 output on Windows consoles that default to cp1252.
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# Make the src/ package importable when run as a plain script.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from lbenergy import (  # noqa: E402
    config,
    run_pipeline,
    fit_rc_ols,
    fit_heatup_trajectory,
    fit_cooldown_trajectory,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Calibrate the RC thermal model.")
    parser.add_argument("--window", default="heating", choices=["heating", "cooling"])
    args = parser.parse_args()

    config.ensure_dirs()

    print(f"[train] Building '{args.window}' pipeline ...")
    df, _events = run_pipeline(args.window)

    fit_name = "cool-down" if args.window == "cooling" else "heat-up"
    print(f"[train] Trajectory-calibrating {fit_name} model on {len(df)} rows ...")
    hp = fit_cooldown_trajectory(df) if args.window == "cooling" else fit_heatup_trajectory(df)
    # Diagnostics: OLS fit (passive-cooling τ etc.).
    ols = fit_rc_ols(df)

    out = config.MODELS_DIR / "rc_params.json"
    payload = {
        "window":         args.window,
        "beta1":          hp["beta1"],
        "beta2":          hp["beta2"],
        "beta3":          hp["beta3"],
        "T_supply_eff":   hp["T_supply_eff"],     # controller MUST use this as T_supply_nom
        "ramp_rmse_degC": hp["ramp_rmse_degC"],
        "n_ramps":        hp["n_ramps"],
        "tau_cool_hours": ols["tau_stage1_h"],    # diagnostic: passive-cooling τ
    }
    out.write_text(json.dumps(payload, indent=2))

    print(f"[train] β₁={payload['beta1']:.4f}  β₂={payload['beta2']:.4f}  "
          f"β₃={payload['beta3']:.4f}  T_supply_eff={payload['T_supply_eff']:.1f} °C")
    print(f"[train] ramp RMSE={payload['ramp_rmse_degC']:.3f} °C  "
          f"(τ_cool≈{payload['tau_cool_hours']:.0f} h, diagnostic)")
    print(f"[train] Saved → {out}")


if __name__ == "__main__":
    main()
