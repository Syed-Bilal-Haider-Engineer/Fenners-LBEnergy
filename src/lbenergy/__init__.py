"""
lbenergy — Adaptive Predictive Preheat Control (grey-box RC + ML residual).

Public API re-exported here so callers can do, e.g.:

    from lbenergy import run_pipeline, fit_rc_ols, predict_preheat_start
"""

from __future__ import annotations

from . import config
from .data import (
    build_dataset, build_prediction_frame, build_anomaly_frame,
    load_snapshots_raw, load_power_raw, clean,
    load_snapshots, load_power, load_events,
)
from .pipeline import run_pipeline, run_anomaly_pipeline, persist_parquet
from .rc_model import fit_rc_ols, simulate_trajectory
from .preheat import predict_preheat_start
from .evaluate import validate_on_cooling, trajectory_rmse
from .residual import ResidualCorrector
from .external import fetch_weather, join_external

__all__ = [
    "config",
    "build_dataset", "build_prediction_frame", "build_anomaly_frame",
    "load_snapshots_raw", "load_power_raw", "clean",
    "load_snapshots", "load_power", "load_events",
    "run_pipeline", "run_anomaly_pipeline", "persist_parquet",
    "fit_rc_ols", "simulate_trajectory",
    "predict_preheat_start",
    "validate_on_cooling", "trajectory_rmse",
    "ResidualCorrector",
    "fetch_weather", "join_external",
]
