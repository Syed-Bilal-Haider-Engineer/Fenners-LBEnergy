"""PDF report generation for LB Energy.

Reusable document shell (`ReportBuilder`) + concrete report subclasses.
New report topics extend `ReportBuilder` and override `body()`.
"""

from lbenergy.reports.builder import ReportBuilder
from lbenergy.reports.financial import FinancialReport

__all__ = ["ReportBuilder", "FinancialReport"]
