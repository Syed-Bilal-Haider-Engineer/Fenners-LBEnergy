"""Reusable PDF report skeleton.

`ReportBuilder` enforces the invariant shell — logo top-left on every page,
title block, plain black typography, 2-page hard cap. Subclasses override
`title`, optionally `subtitle`, and `body()` to supply content sections.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    Flowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from lbenergy.reports import branding as B

MAX_PAGES = 2
MAX_KPIS = 4


def _styles() -> dict[str, ParagraphStyle]:
    return {
        "title": ParagraphStyle(
            "title",
            fontName=B.FONT_FAMILY_BOLD,
            fontSize=18,
            leading=22,
            textColor=B.TEXT_COLOR,
            spaceAfter=2,
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            fontName=B.FONT_FAMILY,
            fontSize=10,
            leading=13,
            textColor=B.TEXT_COLOR,
            spaceAfter=10,
        ),
        "section": ParagraphStyle(
            "section",
            fontName=B.FONT_FAMILY_BOLD,
            fontSize=12,
            leading=15,
            textColor=B.TEXT_COLOR,
            spaceBefore=4,
            spaceAfter=2,
        ),
        "body": ParagraphStyle(
            "body",
            fontName=B.FONT_FAMILY,
            fontSize=10,
            leading=13,
            textColor=B.TEXT_COLOR,
        ),
        "kpi_label": ParagraphStyle(
            "kpi_label",
            fontName=B.FONT_FAMILY,
            fontSize=8,
            leading=10,
            textColor=B.TEXT_COLOR,
        ),
        "kpi_value": ParagraphStyle(
            "kpi_value",
            fontName=B.FONT_FAMILY_BOLD,
            fontSize=14,
            leading=17,
            textColor=B.TEXT_COLOR,
        ),
    }


class ReportBuilder:
    """Base class for LB Energy PDF reports."""

    title: str = "Untitled Report"
    subtitle: Optional[str] = None

    def __init__(self, output_path: Path):
        self.output_path = Path(output_path)
        self.styles = _styles()

    def build(self) -> Path:
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        doc = SimpleDocTemplate(
            str(self.output_path),
            pagesize=A4,
            leftMargin=B.PAGE_MARGIN,
            rightMargin=B.PAGE_MARGIN,
            topMargin=B.PAGE_MARGIN + B.LOGO_HEIGHT_PT + B.LOGO_TO_TITLE_GAP,
            bottomMargin=B.PAGE_MARGIN,
            title=self.title,
        )

        story: list[Flowable] = [Paragraph(self.title, self.styles["title"])]
        if self.subtitle:
            story.append(Paragraph(self.subtitle, self.styles["subtitle"]))
        story.append(self._rule())
        story.extend(self.body())

        doc.build(story, onFirstPage=self._on_page, onLaterPages=self._on_page)

        if doc.page > MAX_PAGES:
            raise RuntimeError(
                f"Report exceeded {MAX_PAGES} pages (rendered {doc.page}). "
                f"Trim content in body()."
            )
        return self.output_path

    def body(self) -> list[Flowable]:
        raise NotImplementedError("Subclasses must implement body().")

    def section_heading(self, text: str) -> Flowable:
        return KeepTogether([
            Paragraph(text, self.styles["section"]),
            self._rule(),
            Spacer(1, 2),
        ])

    def paragraph(self, text: str) -> Flowable:
        return Paragraph(text, self.styles["body"])

    def kpi_row(self, kpis: list[tuple[str, str]]) -> Flowable:
        if len(kpis) > MAX_KPIS:
            raise ValueError(f"kpi_row supports at most {MAX_KPIS} entries (got {len(kpis)}).")
        cells = [
            [Paragraph(label, self.styles["kpi_label"]),
             Paragraph(value, self.styles["kpi_value"])]
            for label, value in kpis
        ]
        # One column per KPI, two rows (label on top, value below).
        data = [
            [c[0] for c in cells],
            [c[1] for c in cells],
        ]
        table = Table(data, hAlign="LEFT")
        table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
            ("BOTTOMPADDING", (0, 1), (-1, 1), 6),
        ]))
        return table

    def kv_table(
        self,
        rows: list[tuple[str, ...]],
        header: Optional[tuple[str, ...]] = None,
    ) -> Flowable:
        data: list[list] = []
        if header is not None:
            data.append([Paragraph(f"<b>{c}</b>", self.styles["body"]) for c in header])
        for row in rows:
            data.append([Paragraph(str(c), self.styles["body"]) for c in row])
        table = Table(data, hAlign="LEFT")
        table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, B.RULE_COLOR),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        return table

    def spacer(self, height_pt: int = 6) -> Flowable:
        return Spacer(1, height_pt)

    def page_break(self) -> Flowable:
        return PageBreak()

    def _rule(self) -> Flowable:
        # Thin black horizontal rule rendered via a single-cell table.
        t = Table([[""]], colWidths=["100%"], rowHeights=[0.5])
        t.setStyle(TableStyle([
            ("LINEABOVE", (0, 0), (-1, 0), 0.5, B.RULE_COLOR),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        return t

    def _on_page(self, canvas, doc) -> None:
        canvas.saveState()

        logo = B.load_logo_drawing()
        x = B.PAGE_MARGIN
        y = A4[1] - B.PAGE_MARGIN - logo.height
        logo.drawOn(canvas, x, y)

        second_w, second_h = B.second_logo_size(B.LOGO_HEIGHT_PT)
        canvas.drawImage(
            str(B.SECOND_LOGO_PATH),
            x + logo.width + B.LOGO_GAP_PT,
            y,
            width=second_w,
            height=second_h,
            mask="auto",
            preserveAspectRatio=True,
        )

        canvas.setFont(B.FONT_FAMILY, 8)
        canvas.setFillColor(B.TEXT_COLOR)
        canvas.drawRightString(
            A4[0] - B.PAGE_MARGIN,
            B.PAGE_MARGIN / 2,
            f"{doc.page} / {MAX_PAGES}",
        )

        canvas.restoreState()
