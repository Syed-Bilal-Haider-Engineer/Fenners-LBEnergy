"""
frontend/app.py — Streamlit demo dashboard.

Run:
    streamlit run frontend/app.py

Interactive what-if: pick a starting room temp and outside temp, see the
required preheat lead time and the predicted temperature trajectory.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Make the src/ package importable.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

import numpy as np                                   # noqa: E402
import streamlit as st                               # noqa: E402

from lbenergy import predict_preheat_start           # noqa: E402
from lbenergy.config import DT_HOURS, T_SETPOINT     # noqa: E402

st.set_page_config(page_title="LBenergy Preheat Control", page_icon="🔥", layout="wide")

st.title("🔥 Adaptive Predictive Preheat Control")
st.caption("Grey-box RC thermal model — LBenergy × TUM Hackathon")

# Default fitted parameters (replace with models/rc_params.json once trained).
DEFAULT_BETA = (0.05, -0.10, 0.0)

with st.sidebar:
    st.header("Scenario")
    t_room = st.slider("Starting room temperature (°C)", 10.0, 21.0, 16.87, 0.1)
    t_out = st.slider("Outside temperature (°C)", -15.0, 20.0, 1.0, 0.5)
    st.header("Model parameters (β)")
    b1 = st.number_input("β₁ (supply-air gain)", value=DEFAULT_BETA[0], format="%.4f")
    b2 = st.number_input("β₂ (heat-loss coeff)", value=DEFAULT_BETA[1], format="%.4f")
    b3 = st.number_input("β₃ (bias)", value=DEFAULT_BETA[2], format="%.4f")

beta = (b1, b2, b3)
lead_h, traj = predict_preheat_start(
    T_room_now=t_room, T_out_const=t_out, hours_to_event=24, beta=beta,
)

col1, col2, col3 = st.columns(3)
col1.metric("Required preheat lead time", f"{lead_h:.2f} h", f"{lead_h * 60:.0f} min")
col2.metric("Predicted T_room at event", f"{traj[-1]:.2f} °C", f"target {T_SETPOINT} °C")
col3.metric("vs. current (0.42 h boost)", f"{(lead_h - 0.42) * 60:+.0f} min", "earlier start")

st.subheader("Predicted temperature trajectory")
times_h = np.arange(len(traj)) * DT_HOURS
st.line_chart({"T_room (°C)": traj}, x_label="Hours from preheat start")

st.info(
    "This is a scaffold. Wire it to the backend `/predict/preheat_start` "
    "endpoint or load fitted parameters from `models/rc_params.json` for live values."
)
