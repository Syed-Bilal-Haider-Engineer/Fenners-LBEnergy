"""
backend/main.py — FastAPI service exposing preheat-start predictions.

Run:
    uvicorn backend.main:app --reload

Endpoints:
    GET  /health
    POST /predict/preheat_start   → optimal preheat lead time for an event
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Make the src/ package importable.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from fastapi import FastAPI, HTTPException          # noqa: E402
from pydantic import BaseModel, Field               # noqa: E402

from lbenergy import config, predict_preheat_start  # noqa: E402

app = FastAPI(
    title="LBenergy Preheat Control API",
    description="Optimal preheat start-time prediction via grey-box RC model.",
    version="0.1.0",
)


class PreheatRequest(BaseModel):
    t_room_now: float = Field(..., description="Current room temperature (°C)")
    t_out: float = Field(..., description="Outside temperature forecast (°C)")
    hours_to_event: float = Field(24.0, description="Hours until event start")
    # Optional override of fitted parameters; otherwise loaded from models/.
    beta1: float | None = None
    beta2: float | None = None
    beta3: float | None = None


class PreheatResponse(BaseModel):
    lead_time_hours: float
    predicted_t_room_at_event: float
    beta_used: list[float]


def _load_beta() -> tuple[float, float, float]:
    """Load fitted RC parameters from models/rc_params.json (run train.py first)."""
    params_path = config.MODELS_DIR / "rc_params.json"
    if not params_path.exists():
        raise HTTPException(
            status_code=503,
            detail="No fitted model found. Run `python scripts/train.py` first.",
        )
    p = json.loads(params_path.read_text())
    return p["beta1"], p["beta2"], p["beta3"]


@app.get("/health")
def health() -> dict:
    model_ready = (config.MODELS_DIR / "rc_params.json").exists()
    return {"status": "ok", "model_ready": model_ready}


@app.post("/predict/preheat_start", response_model=PreheatResponse)
def preheat_start(req: PreheatRequest) -> PreheatResponse:
    if None not in (req.beta1, req.beta2, req.beta3):
        beta = (req.beta1, req.beta2, req.beta3)
    else:
        beta = _load_beta()

    lead_h, traj = predict_preheat_start(
        T_room_now=req.t_room_now,
        T_out_const=req.t_out,
        hours_to_event=req.hours_to_event,
        beta=beta,
    )
    return PreheatResponse(
        lead_time_hours=round(lead_h, 3),
        predicted_t_room_at_event=round(float(traj[-1]), 2),
        beta_used=list(beta),
    )
