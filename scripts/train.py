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

from lbenergy import config, run_pipeline, fit_rc_ols   # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Calibrate the RC thermal model.")
    parser.add_argument("--window", default="heating", choices=["heating", "cooling"])
    args = parser.parse_args()

    config.ensure_dirs()

    print(f"[train] Building '{args.window}' pipeline ...")
    df, _events = run_pipeline(args.window)

    print(f"[train] Fitting RC model on {len(df)} rows ...")
    params = fit_rc_ols(df)

    out = config.MODELS_DIR / "rc_params.json"
    payload = {
        "window":  args.window,
        "beta1":   params["beta1"],
        "beta2":   params["beta2"],
        "beta3":   params["beta3"],
        "tau_hours": params["tau_hours"],
        "rmse_all":  params["rmse_all"],
        "r2_all":    params["r2_all"],
        "n_samples": params["n_samples"],
    }
    out.write_text(json.dumps(payload, indent=2))

    print(f"[train] β₁={payload['beta1']:.4f}  β₂={payload['beta2']:.4f}  "
          f"τ={payload['tau_hours']:.1f} h  RMSE={payload['rmse_all']:.4f} °C/h")
    print(f"[train] Saved → {out}")


if __name__ == "__main__":
    main()
