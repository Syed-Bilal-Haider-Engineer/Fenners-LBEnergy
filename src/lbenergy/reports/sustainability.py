"""Sustainability report — environmental impact of the predictive controller.

Renders a PDF summarising avoided CO2 emissions, comfort delivery, and a
manager-friendly translation (kilometres of car travel not driven, trees
absorbing CO2 for a year, household-days of grid electricity). Caller
supplies events as a pre-loaded DataFrame; see scripts/generate_report.py.
"""

from __future__ import annotations

from io import BytesIO
from pathlib import Path
from typing import Optional

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Flowable, Image

from lbenergy.reports.builder import ReportBuilder

# Illustrative equivalences — not part of any certified inventory calculation.
KG_CO2_PER_KM_CAR = 0.12          # EU passenger-car tailpipe average (kg CO2/km).
KG_CO2_PER_TREE_YEAR = 21.0       # US EPA: mature tree absorbs ~21 kg CO2/year.
KWH_PER_HOUSEHOLD_DAY = 10.0      # EU household average electricity (~10 kWh/day).


class SustainabilityReport(ReportBuilder):
    title = "Sustainability Report"
    subtitle = "LB Energy Predictive Pre-Heat Controller"

    def __init__(
        self,
        output_path: Path,
        df: pd.DataFrame,
        co2_factor_kg_per_kwh: float = 0.38,
        devices_csv: Optional[Path] = None,
    ):
        super().__init__(output_path)
        self.df = df
        self.co2_factor = co2_factor_kg_per_kwh
        self.devices_csv = Path(devices_csv) if devices_csv else None

    def body(self) -> list[Flowable]:
        df = self.df
        totals = self._summarize(df)
        period = self._period_line(df)

        flow: list[Flowable] = [
            self.paragraph(period),
            self.spacer(8),
            self.section_heading("Summary"),
            self.spacer(4),
            self.kpi_row([
                ("CO2 avoided",
                    f"{totals['co2_saved_kg']:.0f} kg "
                    f"({totals['pct_saved']:.0f}%)"),
                ("Comfort delivery",
                    f"{totals['pct_on_time']:.0f}% on time"),
                ("Avg comfort uplift",
                    f"+{totals['avg_uplift_c']:.1f} °C"),
            ]),
            self.spacer(8),
            self.paragraph(self._equivalences_html(totals)),
            self.spacer(10),
            self.section_heading("Comfort delivery, event by event"),
            self.spacer(4),
            self._comfort_chart(df),
            self.spacer(10),
            self.section_heading("Per-event breakdown"),
            self.spacer(4),
            self.paragraph(
                f"Outside temperatures during these events ranged from "
                f"{df['T_out_window'].min():.1f} °C to "
                f"{df['T_out_window'].max():.1f} °C."
            ),
            self.spacer(4),
            self.kv_table(
                rows=self._event_rows(df),
                header=("Event start", "Outside (°C)", "CO2 saved (kg)",
                        "T at deadline\nwithout model (°C)",
                        "T at deadline\nwith model (°C)"),
            ),
            self.spacer(10),
            self.section_heading("Explanation"),
            self.spacer(4),
            self.paragraph(
                "Without model and with model figures are taken directly from "
                "the backtest results for each event. CO2 avoided is "
                "computed as kWh saved at the heat pump multiplied by a grid "
                f"emission factor of {self.co2_factor:.2f} kg CO2/kWh "
                "(static national-average assumption, a marginal or "
                "time-of-use factor would change the figure). Outside "
                "temperature is taken from the backtest data for each event. "
                "Comfort delivery counts events whose room "
                "temperature reached the booked-start setpoint by the "
                "deadline; comfort uplift is the average increase in deadline "
                "temperature delivered by the controller. Equivalences "
                f"(car-km at {KG_CO2_PER_KM_CAR:.2f} kg CO2/km, "
                f"{KG_CO2_PER_TREE_YEAR:.0f} kg CO2/tree/year, "
                f"{KWH_PER_HOUSEHOLD_DAY:.0f} kWh/household/day) are "
                "illustrative, not certified inventory math."
            ),
        ]
        return flow

    def _summarize(self, df: pd.DataFrame) -> dict:
        kwh_saved = float(df["kwh_saved"].sum())
        e_baseline = float(df["E_B1_kwh"].sum())
        co2_saved = kwh_saved * self.co2_factor
        pct_saved = (kwh_saved / e_baseline * 100.0) if e_baseline > 0 else 0.0
        b3 = (df["B3_on_time"].astype(str).str.lower() == "true").sum()
        n = int(len(df))
        pct_on_time = (b3 / n * 100.0) if n > 0 else 0.0
        avg_uplift = float((df["B3_T_deadline"] - df["B1_T_deadline"]).mean())
        household_kwh_per_day = KWH_PER_HOUSEHOLD_DAY * self.co2_factor
        return {
            "kwh_saved": kwh_saved,
            "co2_saved_kg": co2_saved,
            "pct_saved": pct_saved,
            "equiv_km": co2_saved / KG_CO2_PER_KM_CAR,
            "equiv_trees": co2_saved / KG_CO2_PER_TREE_YEAR,
            "equiv_household_days": (
                co2_saved / household_kwh_per_day if household_kwh_per_day > 0 else 0.0
            ),
            "pct_on_time": pct_on_time,
            "n_events": n,
            "avg_uplift_c": avg_uplift,
        }

    def _period_line(self, df: pd.DataFrame) -> str:
        start = df["event_start"].min().strftime("%Y-%m-%d")
        end = df["event_start"].max().strftime("%Y-%m-%d")
        n = len(df)
        fleet = self._fleet_count()
        fleet_txt = f" · {fleet} heat-pump units" if fleet else ""
        return f"<b>Period:</b> {start} → {end} · {n} events{fleet_txt}"

    def _fleet_count(self) -> Optional[int]:
        if not self.devices_csv or not self.devices_csv.exists():
            return None
        return int(len(pd.read_csv(self.devices_csv)))

    def _equivalences_html(self, totals: dict) -> str:
        return (
            "<b>Equivalent to:</b><br/>"
            f"• {totals['equiv_km']:,.0f} km not driven "
            f"(EU passenger car, {KG_CO2_PER_KM_CAR:.2f} kg CO2/km)<br/>"
            f"• {totals['equiv_trees']:.0f} trees absorbing CO2 for a year "
            f"(~{KG_CO2_PER_TREE_YEAR:.0f} kg CO2/tree/year)<br/>"
            f"• {totals['equiv_household_days']:.0f} household-days of grid "
            f"electricity (~{KWH_PER_HOUSEHOLD_DAY:.0f} kWh/day)"
        )

    def _comfort_chart(self, df: pd.DataFrame) -> Flowable:
        labels = [ts.strftime("%b %d, %H:%M") for ts in df["event_start"]]
        b1 = df["B1_T_deadline"].to_numpy()
        b3 = df["B3_T_deadline"].to_numpy()
        setpoint = float(df["setpoint"].iloc[0]) if len(df) else 21.0

        n = len(df)
        height_in = max(2.2, 0.45 * n + 1.0)
        fig, ax = plt.subplots(figsize=(7.5, height_in))
        y = range(n)
        bar_h = 0.38
        ax.barh([i + bar_h / 2 for i in y], b1, height=bar_h,
                color="#bdbdbd", label="Baseline (B1)")
        ax.barh([i - bar_h / 2 for i in y], b3, height=bar_h,
                color="#2b6cb0", label="Model (B3)")
        ax.axvline(setpoint, color="black", linestyle="--", linewidth=1,
                   label=f"Setpoint ({setpoint:.0f} °C)")
        ax.set_yticks(list(y))
        ax.set_yticklabels(labels)
        ax.invert_yaxis()
        ax.set_xlabel("Room temperature at deadline (°C)")
        # Legend sits to the right of the plot so it never overlaps the bars.
        ax.legend(loc="center left", bbox_to_anchor=(1.02, 0.5),
                  fontsize=8, frameon=False)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)

        buf = BytesIO()
        fig.savefig(buf, format="png", dpi=150, bbox_inches="tight")
        plt.close(fig)
        buf.seek(0)
        img_w = 16 * cm
        px_w, px_h = ImageReader(buf).getSize()
        buf.seek(0)
        img_h = img_w * (px_h / px_w)
        img = Image(buf, width=img_w, height=img_h)
        img.hAlign = "LEFT"
        return img

    def _event_rows(self, df: pd.DataFrame) -> list[tuple[str, ...]]:
        return [
            (
                row.event_start.strftime("%Y-%m-%d %H:%M"),
                f"{row.T_out_window:.1f}",
                f"{row.kwh_saved * self.co2_factor:.1f}",
                f"{row.B1_T_deadline:.1f}",
                f"{row.B3_T_deadline:.1f}",
            )
            for row in df.itertuples()
        ]
