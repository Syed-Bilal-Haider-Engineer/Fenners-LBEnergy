"""Run the fault/anomaly detector and write output artifacts."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from lbenergy.anomaly import run_fault_detection
from lbenergy.config import OUTPUT_DIR, ensure_dirs


def main() -> None:
    parser = argparse.ArgumentParser(description="Run IHL fault/anomaly detection.")
    parser.add_argument("--window", choices=["heating", "cooling"], default="heating")
    args = parser.parse_args()

    ensure_dirs()
    scored, alerts, summary = run_fault_detection(args.window)

    scored_path = OUTPUT_DIR / f"anomaly_scores_{args.window}.csv"
    alerts_path = OUTPUT_DIR / f"anomaly_alerts_{args.window}.json"
    scored.to_csv(scored_path)
    artifact = {
        "summary": summary,
        "alerts": alerts.to_dict("records") if not alerts.empty else [],
    }
    alerts_path.write_text(json.dumps(artifact, indent=2), encoding="utf-8")

    print(f"window={args.window}")
    print(f"rows_scored={summary['rows_scored']}")
    print(f"alerts={summary['alert_count']}")
    print(f"critical={summary['critical_count']} high={summary['high_count']} medium={summary['medium_count']}")
    print(f"residual_rmse_degC={summary['residual_rmse_degC']:.3f}")
    print(f"wrote {scored_path}")
    print(f"wrote {alerts_path}")


if __name__ == "__main__":
    main()
