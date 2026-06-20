"""
generate_report.py — Render a PDF report from pipeline outputs.

Usage:
    python scripts/generate_report.py
    python scripts/generate_report.py --report financial --unit-cost 0.45
    python scripts/generate_report.py --input outputs/backtest_heating.csv \\
                                      --output outputs/financial_report.pdf
"""

from __future__ import annotations

import argparse
import io
import sys
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from lbenergy import config                              # noqa: E402
from lbenergy.reports import FinancialReport             # noqa: E402

REPORTS = {
    "financial": FinancialReport,
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a PDF report.")
    parser.add_argument("--report", default="financial", choices=sorted(REPORTS))
    parser.add_argument(
        "--input",
        type=Path,
        default=config.OUTPUT_DIR / "backtest_heating.csv",
        help="Source CSV (default: outputs/backtest_heating.csv)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output PDF path (default: outputs/<report>_report.pdf)",
    )
    parser.add_argument(
        "--unit-cost",
        type=float,
        default=0.30,
        help="Electricity tariff in EUR/kWh for cost-avoided calculation (default: 0.30)",
    )
    args = parser.parse_args()

    config.ensure_dirs()
    output = args.output or (config.OUTPUT_DIR / f"{args.report}_report.pdf")

    report_cls = REPORTS[args.report]
    report = report_cls(
        output_path=output,
        backtest_csv=args.input,
        unit_cost_eur_per_kwh=args.unit_cost,
    )
    written = report.build()
    print(f"Wrote {written}")


if __name__ == "__main__":
    main()
