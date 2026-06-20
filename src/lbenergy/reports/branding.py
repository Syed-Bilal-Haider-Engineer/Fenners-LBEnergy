"""Report branding constants — intentionally monochrome.

The LB Energy logo is the only coloured element on a report page. All text
and rules render in black. Constants are exposed (rather than inlined) so a
future branded report variant could swap them without touching the base class.
"""

from __future__ import annotations

from reportlab.lib import colors
from reportlab.lib.units import inch
from svglib.svglib import svg2rlg

from lbenergy.config import REPO_ROOT

TEXT_COLOR = colors.black
RULE_COLOR = colors.black

FONT_FAMILY = "Helvetica"
FONT_FAMILY_BOLD = "Helvetica-Bold"

LOGO_PATH = REPO_ROOT / "assets" / "brand" / "lb-energy-logo.svg"
LOGO_HEIGHT_PT = 36  # ~0.5 inch

PAGE_MARGIN = 0.6 * inch
LOGO_TO_TITLE_GAP = 18  # points of vertical breathing room after the logo


def load_logo_drawing():
    """Return a ReportLab Drawing of the LB Energy logo scaled to LOGO_HEIGHT_PT."""
    drawing = svg2rlg(str(LOGO_PATH))
    scale = LOGO_HEIGHT_PT / drawing.height
    drawing.width *= scale
    drawing.height *= scale
    drawing.scale(scale, scale)
    return drawing
