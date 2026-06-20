"""
generate_report.py — Render a PDF report from pipeline outputs.

The report type is a required positional argument.

Usage:
    python scripts/generate_report.py financial
    python scripts/generate_report.py financial --unit-cost 0.45
    python scripts/generate_report.py sustainability --co2-factor 0.42
    python scripts/generate_report.py financial \\
        --input outputs/backtest_heating.csv \\
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

from lbenergy import config                                  # noqa: E402
from lbenergy.reports import FinancialReport, SustainabilityReport  # noqa: E402


def _build_financial(args, output):
    return FinancialReport(
        output_path=output,
        backtest_csv=args.input,
        unit_cost_eur_per_kwh=args.unit_cost,
    )


def _build_sustainability(args, output):
    return SustainabilityReport(
        output_path=output,
        backtest_csv=args.input,
        co2_factor_kg_per_kwh=args.co2_factor,
    )


REPORTS = {
    "financial": _build_financial,
    "sustainability": _build_sustainability,
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a PDF report.")
    parser.add_argument(
        "report",
        choices=sorted(REPORTS),
        help="Which report to render.",
    )
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
        help="Electricity tariff in EUR/kWh, used by report=financial (default: 0.30)",
    )
    parser.add_argument(
        "--co2-factor",
        type=float,
        default=0.38,
        help="Grid emission factor in kg CO2/kWh, used by report=sustainability "
             "(default: 0.38, ~Germany 2024 national average)",
    )
    args = parser.parse_args()

    config.ensure_dirs()
    output = args.output or (config.OUTPUT_DIR / f"{args.report}_report.pdf")

    report = REPORTS[args.report](args, output)
    written = report.build()
    print(f"Wrote {written}")


if __name__ == "__main__":
    main()
