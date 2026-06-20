"""Financial report — energy savings the predictive controller delivered.

Reads `outputs/backtest_heating.csv` (or any backtest CSV with the same
schema) and renders a 2-page PDF summarising kWh used with/without the model,
total savings, and cost avoided at a given electricity tariff.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd
from reportlab.platypus import Flowable

from lbenergy.reports.builder import ReportBuilder


class FinancialReport(ReportBuilder):
    title = "Energy Savings — Financial Report"
    subtitle = "LB Energy Predictive Pre-Heat Controller"

    def __init__(
        self,
        output_path: Path,
        backtest_csv: Path,
        unit_cost_eur_per_kwh: float = 0.30,
    ):
        super().__init__(output_path)
        self.backtest_csv = Path(backtest_csv)
        self.unit_cost = unit_cost_eur_per_kwh

    def body(self) -> list[Flowable]:
        df = pd.read_csv(self.backtest_csv, parse_dates=["event_start"])
        totals = self._summarize(df)

        return [
            self.section_heading("Summary"),
            self.spacer(4),
            self.kpi_row([
                ("Energy without model",
                    f"{totals['e_baseline_kwh']:.0f} kWh"),
                ("Energy with model",
                    f"{totals['e_model_kwh']:.0f} kWh"),
                ("Energy saved",
                    f"{totals['kwh_saved']:.0f} kWh "
                    f"({totals['pct_saved']:.0f}%)"),
                ("Cost avoided",
                    f"€{totals['eur_saved']:.0f}"),
            ]),
            self.spacer(10),
            self.section_heading("Per-event breakdown"),
            self.spacer(4),
            self.kv_table(
                rows=self._event_rows(df),
                header=("Event start", "Without model (kWh)",
                        "With model (kWh)", "Saved (kWh)"),
            ),
            self.spacer(10),
            self.section_heading("Method"),
            self.spacer(4),
            self.paragraph(
                "Baseline (B1) follows the building's current fixed pre-heat "
                "schedule. Model (B3) uses the calibrated RC controller to "
                "start pre-heat at the optimal lead time. Energy figures are "
                "electrical kWh measured at the heat pump over the pre-heat "
                f"window for each heating event in the source dataset. Cost "
                f"avoided assumes an electricity tariff of €{self.unit_cost:.2f}/kWh."
            ),
        ]

    def _summarize(self, df: pd.DataFrame) -> dict:
        e_baseline = float(df["E_B1_kwh"].sum())
        e_model = float(df["E_B3_kwh"].sum())
        kwh_saved = float(df["kwh_saved"].sum())
        pct_saved = (kwh_saved / e_baseline * 100.0) if e_baseline > 0 else 0.0
        eur_saved = kwh_saved * self.unit_cost
        return {
            "e_baseline_kwh": e_baseline,
            "e_model_kwh": e_model,
            "kwh_saved": kwh_saved,
            "pct_saved": pct_saved,
            "eur_saved": eur_saved,
        }

    @staticmethod
    def _event_rows(df: pd.DataFrame) -> list[tuple[str, ...]]:
        return [
            (
                row.event_start.strftime("%Y-%m-%d %H:%M"),
                f"{row.E_B1_kwh:.1f}",
                f"{row.E_B3_kwh:.1f}",
                f"{row.kwh_saved:.1f}",
            )
            for row in df.itertuples()
        ]
