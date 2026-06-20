"""
backtest.py — Run the event-level backtest and print results.

Usage:
    python scripts/backtest.py [--window heating|cooling]

Writes outputs/backtest_<window>.csv and prints the per-event table + summary.
"""

from __future__ import annotations

import argparse
import io
import sys
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from lbenergy import config                       # noqa: E402
from lbenergy.backtest import run_backtest        # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Event-level preheat backtest.")
    parser.add_argument("--window", default="heating", choices=["heating", "cooling"])
    args = parser.parse_args()

    config.ensure_dirs()
    per_event, summary = run_backtest(args.window)

    print(f"\n=== Per-event ({args.window}) ===")
    print(per_event.to_string(index=False))

    print(f"\n=== Summary ({args.window}) ===")
    for k, v in summary.items():
        print(f"  {k:18s}: {v}")
    print("\n  (€/CO₂ use assumed factors — see config; electrical energy only.)")

    out = config.OUTPUT_DIR / f"backtest_{args.window}.csv"
    per_event.to_csv(out, index=False)
    print(f"\nSaved → {out}")


if __name__ == "__main__":
    main()
