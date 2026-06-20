"""Sustainability report — environmental impact of the predictive controller.

Reads `outputs/backtest_heating.csv` and renders a 2-page PDF summarising
avoided CO2 emissions, comfort delivery, and a manager-friendly translation
(kilometres of car travel not driven).
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd
from reportlab.platypus import Flowable

from lbenergy.reports.builder import ReportBuilder

# Average tailpipe emissions for an EU passenger car (kg CO2 / km).
# Used purely for the manager-facing equivalence; not part of any
# certified inventory calculation.
KG_CO2_PER_KM_CAR = 0.12


class SustainabilityReport(ReportBuilder):
    title = "Sustainability Report"
    subtitle = "LB Energy Predictive Pre-Heat Controller"

    def __init__(
        self,
        output_path: Path,
        backtest_csv: Path,
        co2_factor_kg_per_kwh: float = 0.38,
    ):
        super().__init__(output_path)
        self.backtest_csv = Path(backtest_csv)
        self.co2_factor = co2_factor_kg_per_kwh

    def body(self) -> list[Flowable]:
        df = pd.read_csv(self.backtest_csv, parse_dates=["event_start"])
        totals = self._summarize(df)

        return [
            self.section_heading("Summary"),
            self.spacer(4),
            self.kpi_row([
                ("CO2 avoided",
                    f"{totals['co2_saved_kg']:.0f} kg "
                    f"({totals['pct_saved']:.0f}%)"),
                ("Equivalent km not driven",
                    f"{totals['equiv_km']:,.0f} km"),
                ("Comfort delivery",
                    f"{totals['b1_on_time']} -> {totals['b3_on_time']} "
                    f"/ {totals['n_events']} events"),
                ("Avg comfort uplift",
                    f"+{totals['avg_uplift_c']:.1f} °C"),
            ]),
            self.spacer(10),
            self.section_heading("Per-event breakdown"),
            self.spacer(4),
            self.kv_table(
                rows=self._event_rows(df),
                header=("Event start", "CO2 saved (kg)",
                        "T at deadline\nwithout model (°C)",
                        "T at deadline\nwith model (°C)"),
            ),
            self.spacer(10),
            self.section_heading("Method"),
            self.spacer(4),
            self.paragraph(
                "Baseline (B1) follows the building's current fixed pre-heat "
                "schedule. Model (B3) uses the calibrated RC controller to "
                "start pre-heat at the optimal lead time. CO2 avoided is "
                "computed as kWh saved at the heat pump multiplied by a grid "
                f"emission factor of {self.co2_factor:.2f} kg CO2/kWh "
                "(static national-average assumption — a marginal or "
                "time-of-use factor would change the figure). The car-km "
                f"equivalence uses {KG_CO2_PER_KM_CAR:.2f} kg CO2/km, "
                "the approximate EU passenger-car average. Comfort delivery "
                "counts events whose room temperature reached the booked-start "
                "setpoint by the deadline; comfort uplift is the average "
                "increase in deadline temperature delivered by the controller."
            ),
        ]

    def _summarize(self, df: pd.DataFrame) -> dict:
        kwh_saved = float(df["kwh_saved"].sum())
        e_baseline = float(df["E_B1_kwh"].sum())
        co2_saved = kwh_saved * self.co2_factor
        pct_saved = (kwh_saved / e_baseline * 100.0) if e_baseline > 0 else 0.0
        b1 = (df["B1_on_time"].astype(str).str.lower() == "true").sum()
        b3 = (df["B3_on_time"].astype(str).str.lower() == "true").sum()
        avg_uplift = float((df["B3_T_deadline"] - df["B1_T_deadline"]).mean())
        return {
            "kwh_saved": kwh_saved,
            "co2_saved_kg": co2_saved,
            "pct_saved": pct_saved,
            "equiv_km": co2_saved / KG_CO2_PER_KM_CAR,
            "b1_on_time": int(b1),
            "b3_on_time": int(b3),
            "n_events": int(len(df)),
            "avg_uplift_c": avg_uplift,
        }

    def _event_rows(self, df: pd.DataFrame) -> list[tuple[str, ...]]:
        return [
            (
                row.event_start.strftime("%Y-%m-%d %H:%M"),
                f"{row.kwh_saved * self.co2_factor:.1f}",
                f"{row.B1_T_deadline:.1f}",
                f"{row.B3_T_deadline:.1f}",
            )
            for row in df.itertuples()
        ]
