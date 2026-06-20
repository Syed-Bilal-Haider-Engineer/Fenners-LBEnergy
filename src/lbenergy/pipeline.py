"""
pipeline.py — Data pipeline orchestration.

Chains ingestion → feature construction → (optional) persistence into a single
entry point so notebooks, training, and serving all build the analysis frame
the same way.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from .config import HEATING_DIR, COOLING_DIR
from .data import build_dataset, load_events

# Named windows the pipeline knows how to build.
WINDOWS = {
    "heating": HEATING_DIR,
    "cooling": COOLING_DIR,
}


def run_pipeline(window: str = "heating") -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Build the analysis DataFrame + events for a named window ("heating"/"cooling").

    Returns (df, events). This is the single source of truth for "give me the
    cleaned, feature-engineered telemetry" — use it instead of calling
    build_dataset directly so every consumer stays consistent.
    """
    if window not in WINDOWS:
        raise ValueError(f"Unknown window {window!r}. Options: {list(WINDOWS)}")
    directory = WINDOWS[window]
    df = build_dataset(directory)
    events = load_events(directory)
    return df, events


def persist_parquet(df: pd.DataFrame, out_path: Path) -> Path:
    """Persist a built DataFrame to Parquet (cheap cache for repeat runs)."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(out_path)
    return out_path
