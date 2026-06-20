"""
residual.py — ML residual corrector (LightGBM).  [SCAFFOLD — not yet implemented]

The grey-box hybrid: the RC physics core captures the dominant dynamics, and a
lightweight gradient-boosting model learns the residual

    ε(t) = T_measured(t) − T_RC_predicted(t)

so the combined prediction is  T_pred = T_RC + ε_ML.

This module is a stub defining the intended interface. Fill in `fit` and
`predict` once the RC fit + trajectory pipeline is producing residuals.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

# Features the corrector is intended to consume (see PDR §6.4).
RESIDUAL_FEATURES = [
    "hour_of_day", "day_of_week", "humidity", "co2",
    "solar_irradiance_forecast", "wind_speed_forecast",
    "occupancy_flag", "compressor", "T_supply",
    "time_since_setpoint_change",
]


class ResidualCorrector:
    """LightGBM corrector for RC residuals. Quantile mode gives uncertainty bands."""

    def __init__(self, quantile: float | None = None):
        self.quantile = quantile
        self.model = None  # set in fit()

    def fit(self, X: pd.DataFrame, residuals: np.ndarray) -> "ResidualCorrector":
        """Train on engineered features X against RC residuals ε."""
        raise NotImplementedError(
            "ResidualCorrector.fit is a scaffold. Wire up LightGBM here once "
            "the RC pipeline emits residuals (see PDR §6.4)."
        )

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Predict the residual correction ε_ML for each row in X."""
        raise NotImplementedError(
            "ResidualCorrector.predict is a scaffold."
        )
