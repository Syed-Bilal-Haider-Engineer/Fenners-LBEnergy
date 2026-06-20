"""
generate_report.py — Render PDF reports from backtest pipeline outputs.

By default this script scans `outputs/` for backtest CSVs, groups events by
ISO week, and writes one PDF per (report type × week). The output filename
embeds the first event date of the week, e.g. `sustainability_2026-03-30.pdf`.

────────────────────────────────────────────────────────────────────────────
USAGE
────────────────────────────────────────────────────────────────────────────

  python scripts/generate_report.py <report> [options]

  <report>
    sustainability   Environmental impact report (CO2 avoided, comfort, etc.)
    financial        Energy savings / cost avoided report.
    all              Render every report type for every weekly slice.

────────────────────────────────────────────────────────────────────────────
COMMON RECIPES
────────────────────────────────────────────────────────────────────────────

  # Render both reports for every week found in outputs/backtest_*.csv:
  python scripts/generate_report.py all

  # Sustainability only, every week, default inputs:
  python3 scripts/generate_report.py sustainability

  # Restrict to a single CSV; still produces one PDF per ISO week within it:
  python scripts/generate_report.py sustainability \\
      --input outputs/backtest_heating.csv

  # Single CSV, single PDF (no weekly slicing). Use --output to name it:
  python scripts/generate_report.py financial \\
      --input outputs/backtest_heating.csv \\
      --period whole \\
      --output outputs/financial_heating.pdf

  # Override the electricity tariff (financial) or grid emission factor
  # (sustainability) — propagates to every slice produced this run:
  python scripts/generate_report.py financial --unit-cost 0.45
  python scripts/generate_report.py sustainability --co2-factor 0.42

  # Custom devices lookup (otherwise data/devices.csv is used to render the
  # fleet count on the sustainability report):
  python scripts/generate_report.py sustainability \\
      --devices-csv data/devices.csv

────────────────────────────────────────────────────────────────────────────
OPTIONS
────────────────────────────────────────────────────────────────────────────

  --input PATH         Single backtest CSV. Takes precedence over --input-glob.
  --input-glob GLOB    Glob of backtest CSVs (default:
                       outputs/backtest_heating.csv — heating-only because the
                       sustainability/financial wording is pre-heat focused).
                       Widen to outputs/backtest_*.csv to also pick up cooling.
                       Ignored when --input is given.
  --output PATH        Output PDF path. Only valid with `--input` AND
                       `--period whole` (i.e. exactly one PDF will be written).
  --output-dir PATH    Directory for auto-named PDFs (default: outputs/).
  --devices-csv PATH   Devices lookup CSV (default: data/devices.csv). Used
                       by the sustainability report's fleet count line.
  --period {weekly,whole}
                       weekly (default): emit one PDF per ISO week of events.
                       whole: treat all events as a single report.
  --unit-cost FLOAT    Electricity tariff in EUR/kWh (financial, default 0.30).
  --co2-factor FLOAT   Grid emission factor in kg CO2/kWh (sustainability,
                       default 0.38 = approx. Germany 2024 national average).

────────────────────────────────────────────────────────────────────────────
OUTPUT NAMING
────────────────────────────────────────────────────────────────────────────

  Auto-named PDFs use the first event date in the slice:
    outputs/sustainability_2026-03-30.pdf
    outputs/financial_2026-03-30.pdf
    outputs/sustainability_2026-05-25.pdf
    ...

  Pass --output PATH to force a name (only with --input + --period whole).
"""

from __future__ import annotations

import argparse
import io
import sys
from pathlib import Path
from typing import Iterable

import pandas as pd

if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from lbenergy import config                                  # noqa: E402
from lbenergy.reports import FinancialReport, SustainabilityReport  # noqa: E402


def _build_financial(args, output: Path, df: pd.DataFrame):
    return FinancialReport(
        output_path=output,
        df=df,
        unit_cost_eur_per_kwh=args.unit_cost,
    )


def _build_sustainability(args, output: Path, df: pd.DataFrame):
    return SustainabilityReport(
        output_path=output,
        df=df,
        co2_factor_kg_per_kwh=args.co2_factor,
        devices_csv=args.devices_csv,
    )


REPORTS = {
    "financial": _build_financial,
    "sustainability": _build_sustainability,
}


def _iter_inputs(args) -> Iterable[Path]:
    if args.input:
        yield Path(args.input)
        return
    matches = sorted(Path().glob(args.input_glob))
    if not matches:
        raise SystemExit(f"No CSVs match --input-glob {args.input_glob!r}.")
    yield from matches


def _iter_slices(df: pd.DataFrame, period: str) -> Iterable[pd.DataFrame]:
    if period == "whole":
        if not df.empty:
            yield df
        return
    iso = df["event_start"].dt.isocalendar()
    grouped = df.groupby([iso.year, iso.week], sort=True)
    for _, slice_df in grouped:
        if not slice_df.empty:
            yield slice_df


def _output_path(args, report_name: str, slice_df: pd.DataFrame) -> Path:
    if args.output:
        return Path(args.output)
    start = slice_df["event_start"].min().strftime("%Y-%m-%d")
    return Path(args.output_dir) / f"{report_name}_{start}.pdf"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Render PDF reports from backtest CSVs (one PDF per ISO week by default).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "report",
        choices=[*sorted(REPORTS), "all"],
        help="Which report to render. Use 'all' for every registered type.",
    )
    parser.add_argument("--input", type=Path, default=None,
                        help="Single backtest CSV (takes precedence over --input-glob).")
    parser.add_argument("--input-glob", default="outputs/backtest_heating.csv",
                        help="Glob of backtest CSVs (default: outputs/backtest_heating.csv). "
                             "Widen to outputs/backtest_*.csv to also pick up cooling — "
                             "note the current report wording is heating-only.")
    parser.add_argument("--output", type=Path, default=None,
                        help="Output PDF path. Only valid with --input + --period whole.")
    parser.add_argument("--output-dir", type=Path, default=config.OUTPUT_DIR,
                        help="Directory for auto-named PDFs (default: outputs/).")
    parser.add_argument("--devices-csv", type=Path,
                        default=config.DATA_ROOT / "devices.csv",
                        help="Devices lookup CSV (default: data/devices.csv).")
    parser.add_argument("--period", choices=["weekly", "whole"], default="weekly",
                        help="weekly = one PDF per ISO week; whole = one PDF per input CSV.")
    parser.add_argument("--unit-cost", type=float, default=0.30,
                        help="Electricity tariff in EUR/kWh (financial, default 0.30).")
    parser.add_argument("--co2-factor", type=float, default=0.38,
                        help="Grid emission factor in kg CO2/kWh (sustainability, default 0.38).")
    args = parser.parse_args()

    if args.output and (not args.input or args.period != "whole"):
        parser.error("--output requires --input and --period whole "
                     "(otherwise PDF names are auto-generated per slice).")

    config.ensure_dirs()
    report_names = sorted(REPORTS) if args.report == "all" else [args.report]

    written = 0
    for csv_path in _iter_inputs(args):
        df = pd.read_csv(csv_path, parse_dates=["event_start"])
        if df.empty:
            print(f"Skipping {csv_path}: no events.")
            continue
        for slice_df in _iter_slices(df, args.period):
            for name in report_names:
                output = _output_path(args, name, slice_df)
                report = REPORTS[name](args, output, slice_df.reset_index(drop=True))
                path = report.build()
                print(f"Wrote {path}")
                written += 1

    print(f"Generated {written} report(s).")


if __name__ == "__main__":
    main()
