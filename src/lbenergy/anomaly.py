"""
anomaly.py - Fault and anomaly detection for the IHL telemetry stream.

Pillar 2 uses the same RC physics model as the preheat controller, but runs on
the device-level native cadence. It scores one-step RC residuals and combines
them with direct equipment checks to produce maintenance/operations alerts.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np
import pandas as pd

from .pipeline import run_anomaly_pipeline, run_pipeline
from .rc_model import fit_cooldown_trajectory, fit_heatup_trajectory


@dataclass(frozen=True)
class FaultThresholds:
    """Tunable thresholds for fault detection."""

    residual_z: float = 3.0
    cusum_k: float = 0.5
    cusum_h: float = 5.0
    peer_delta_c: float = 1.0
    setpoint_gap_c: float = 1.5
    min_alert_rows: int = 3
    min_setpoint_miss_rows: int = 20
    compressor_supply_delta_c: float = 2.0


def score_anomalies(
    anomaly_df: pd.DataFrame,
    beta: tuple[float, float, float],
    *,
    thresholds: FaultThresholds | None = None,
    mode: str = "heating",
) -> pd.DataFrame:
    """
    Add RC residual, CUSUM and rule-based fault flags to an anomaly frame.

    `anomaly_df` should come from `build_anomaly_frame` / `run_anomaly_pipeline`.
    The returned frame keeps the original device-level rows and adds scored
    columns that can be displayed directly or passed to `extract_alerts`.
    """
    th = thresholds or FaultThresholds()
    index_name = anomaly_df.index.name or "ts"
    scored = (
        anomaly_df.reset_index()
        .rename(columns={index_name: "ts"})
        .sort_values(["device_id", "ts"])
        .reset_index(drop=True)
    )

    b1, b2, b3 = beta
    grp = scored.groupby("device_id", group_keys=False)
    prev_room = grp["T_room"].shift(1)
    prev_supply = grp["T_supply"].shift(1)
    prev_out = grp["T_out"].shift(1)
    dt_h = grp["ts"].diff().dt.total_seconds() / 3600.0

    scored["dt_h"] = dt_h
    scored["T_rc_pred"] = prev_room + (
        b1 * (prev_supply - prev_room) + b2 * (prev_room - prev_out) + b3
    ) * scored["dt_h"]
    scored["rc_residual"] = scored["T_room"] - scored["T_rc_pred"]
    scored.loc[scored["dt_h"].isna() | (scored["dt_h"] <= 0), ["T_rc_pred", "rc_residual"]] = np.nan

    if "error_registers" in scored:
        scored["error_register_nonzero"] = _error_register_nonzero(scored["error_registers"])
    else:
        scored["error_register_nonzero"] = False
    scored["hardware_alarm"] = (
        scored.get("alarm", 0).fillna(0).astype(float).ne(0)
        | scored["error_register_nonzero"]
    )
    scored["peer_sensor_outlier"] = scored["T_room_dev"].abs() >= th.peer_delta_c

    _add_robust_residual_z(scored)
    _add_cusum(scored, th)

    scored["rc_negative_shift"] = scored["residual_z"] <= -th.residual_z
    scored["rc_positive_shift"] = scored["residual_z"] >= th.residual_z

    supply_delta = scored["T_supply"] - scored["T_room"]
    compressor_on = scored.get("compressor", 0).fillna(0).astype(float).eq(1)
    heating_req = scored.get("heating_req", 0).fillna(0).astype(float).eq(1)
    cooling_req = scored.get("cooling_req", 0).fillna(0).astype(float).eq(1)
    if mode == "cooling":
        scored["compressor_no_effect"] = compressor_on & (supply_delta > -th.compressor_supply_delta_c)
        scored["setpoint_miss"] = cooling_req & (
            (scored["T_room"] - scored["setpoint"]) >= th.setpoint_gap_c
        )
    else:
        scored["compressor_no_effect"] = (
            compressor_on & heating_req & (supply_delta < th.compressor_supply_delta_c)
        )
        scored["setpoint_miss"] = heating_req & (
            (scored["setpoint"] - scored["T_room"]) >= th.setpoint_gap_c
        )

    scored["defrost_active"] = scored.get("defrost", 0).fillna(0).astype(float).eq(1)
    scored["any_fault_flag"] = scored[FAULT_FLAG_COLUMNS].any(axis=1)
    return scored.set_index("ts")


FAULT_FLAG_COLUMNS = [
    "hardware_alarm",
    "peer_sensor_outlier",
    "cusum_negative_alarm",
    "cusum_positive_alarm",
    "rc_negative_shift",
    "rc_positive_shift",
    "compressor_no_effect",
    "setpoint_miss",
]


def extract_alerts(
    scored: pd.DataFrame,
    *,
    thresholds: FaultThresholds | None = None,
) -> list[dict]:
    """
    Convert scored rows into grouped alert records.

    Consecutive rows of the same fault type for the same device become one
    alert, so dashboards see incidents rather than hundreds of raw samples.
    """
    th = thresholds or FaultThresholds()
    alerts: list[dict] = []
    for flag in FAULT_FLAG_COLUMNS:
        if flag not in scored:
            continue
        for device_id, g in scored[scored[flag]].groupby("device_id"):
            if g.empty:
                continue
            segment_id = (g.index.to_series().diff() > pd.Timedelta(minutes=6)).cumsum()
            for _, seg in g.groupby(segment_id):
                min_rows = th.min_setpoint_miss_rows if flag == "setpoint_miss" else th.min_alert_rows
                if len(seg) < min_rows and flag not in {"hardware_alarm"}:
                    continue
                alerts.append(_alert_from_segment(flag, str(device_id), seg))
    return sorted(alerts, key=lambda a: (a["createdAt"], a["deviceId"], a["type"]))


def summarize_faults(scored: pd.DataFrame, alerts: Iterable[dict]) -> dict:
    """Compact summary for CLI/API consumers."""
    alert_list = list(alerts)
    return {
        "rows_scored": int(len(scored)),
        "devices": int(scored["device_id"].nunique()),
        "rows_with_fault_flags": int(scored["any_fault_flag"].sum()),
        "alert_count": int(len(alert_list)),
        "critical_count": sum(a["severity"] == "critical" for a in alert_list),
        "high_count": sum(a["severity"] == "high" for a in alert_list),
        "medium_count": sum(a["severity"] == "medium" for a in alert_list),
        "residual_rmse_degC": float(np.sqrt(np.nanmean(scored["rc_residual"] ** 2))),
    }


def run_fault_detection(
    window: str = "heating",
    *,
    thresholds: FaultThresholds | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame, dict]:
    """
    End-to-end fault/anomaly pipeline for a named data window.

    Returns `(scored_rows, alerts_df, summary)`.
    """
    pred_df, _ = run_pipeline(window)
    fit = fit_cooldown_trajectory(pred_df) if window == "cooling" else fit_heatup_trajectory(pred_df)
    beta = (fit["beta1"], fit["beta2"], fit["beta3"])
    anomaly_df = run_anomaly_pipeline(window)
    scored = score_anomalies(anomaly_df, beta, thresholds=thresholds, mode=window)
    alerts = extract_alerts(scored, thresholds=thresholds)
    summary = summarize_faults(scored, alerts)
    summary.update(
        {
            "window": window,
            "beta1": float(beta[0]),
            "beta2": float(beta[1]),
            "beta3": float(beta[2]),
            "ramp_rmse_degC": float(fit["ramp_rmse_degC"]),
        }
    )
    return scored, pd.DataFrame(alerts), summary


def _add_robust_residual_z(scored: pd.DataFrame) -> None:
    normal = (
        scored["rc_residual"].notna()
        & ~scored["hardware_alarm"]
        & ~scored["peer_sensor_outlier"]
        & scored.get("defrost", 0).fillna(0).astype(float).eq(0)
    )
    centers = scored[normal].groupby("device_id")["rc_residual"].median()
    abs_dev = scored[normal].copy()
    abs_dev["abs_dev"] = (abs_dev["rc_residual"] - abs_dev["device_id"].map(centers)).abs()
    scales = 1.4826 * abs_dev.groupby("device_id")["abs_dev"].median()
    fallback_scale = float(scored.loc[normal, "rc_residual"].std(skipna=True) or 0.1)

    scored["residual_center"] = scored["device_id"].map(centers).fillna(0.0)
    scored["residual_scale"] = scored["device_id"].map(scales).fillna(fallback_scale)
    scored["residual_scale"] = scored["residual_scale"].clip(lower=0.05)
    scored["residual_z"] = (
        scored["rc_residual"] - scored["residual_center"]
    ) / scored["residual_scale"]


def _add_cusum(scored: pd.DataFrame, thresholds: FaultThresholds) -> None:
    scored["cusum_pos"] = 0.0
    scored["cusum_neg"] = 0.0
    scored["cusum_positive_alarm"] = False
    scored["cusum_negative_alarm"] = False

    for _, idx in scored.groupby("device_id").groups.items():
        pos = 0.0
        neg = 0.0
        for row_idx in idx:
            z = scored.at[row_idx, "residual_z"]
            if not np.isfinite(z):
                pos = neg = 0.0
            else:
                z = float(np.clip(z, -8.0, 8.0))
                pos = max(0.0, pos + z - thresholds.cusum_k)
                neg = min(0.0, neg + z + thresholds.cusum_k)
            scored.at[row_idx, "cusum_pos"] = pos
            scored.at[row_idx, "cusum_neg"] = neg
            if pos >= thresholds.cusum_h:
                scored.at[row_idx, "cusum_positive_alarm"] = True
                pos = 0.0
            if neg <= -thresholds.cusum_h:
                scored.at[row_idx, "cusum_negative_alarm"] = True
                neg = 0.0


def _alert_from_segment(flag: str, device_id: str, seg: pd.DataFrame) -> dict:
    info = _ALERT_INFO[flag]
    first = seg.iloc[0]
    gap = float(np.nanmax(np.abs(seg["rc_residual"]))) if "rc_residual" in seg else float("nan")
    evidence = {
        "rows": int(len(seg)),
        "maxAbsResidualDegC": None if not np.isfinite(gap) else round(gap, 2),
        "maxPeerDeviationDegC": round(float(seg["T_room_dev"].abs().max()), 2),
        "meanRoomTempDegC": round(float(seg["T_room"].mean()), 2),
        "meanSetpointDegC": round(float(seg["setpoint"].mean()), 2),
    }
    return {
        "id": f"{flag}-{device_id[:8]}-{pd.Timestamp(seg.index[0]).strftime('%Y%m%d%H%M%S')}",
        "type": flag,
        "severity": info["severity"],
        "title": info["title"],
        "message": info["message"],
        "deviceId": device_id,
        "createdAt": pd.Timestamp(seg.index[0]).isoformat(),
        "resolvedAt": pd.Timestamp(seg.index[-1]).isoformat(),
        "durationMinutes": round((seg.index[-1] - seg.index[0]).total_seconds() / 60.0, 1),
        "temperature": round(float(first["T_room"]), 2),
        "setpoint": round(float(first["setpoint"]), 2),
        "evidence": evidence,
        "likelyCause": info["likely_cause"],
        "probableComponent": info["component"],
        "partsToPick": info["parts"],
        "recommendedAction": info["action"],
        "confidence": _confidence_for(flag, seg),
        "evidenceSummary": _evidence_summary(flag, evidence),
    }


def _error_register_nonzero(values: pd.Series) -> pd.Series:
    text = values.fillna("0").astype(str).str.strip()

    def has_bit(raw: str) -> bool:
        for part in raw.split(","):
            part = part.strip()
            if not part:
                continue
            try:
                if int(float(part)) != 0:
                    return True
            except ValueError:
                return True
        return False

    return text.apply(has_bit)


_ALERT_INFO = {
    "hardware_alarm": {
        "severity": "critical",
        "title": "Controller alarm or error register set",
        "message": "Device telemetry reports an active alarm/error bit.",
        "likely_cause": "Controller fault or communication error register is active.",
        "component": "Controller / communications",
        "parts": ["Controller interface module", "communication harness", "service laptop"],
        "action": "Read the Modbus register, inspect controller wiring, then clear and observe.",
    },
    "peer_sensor_outlier": {
        "severity": "medium",
        "title": "Room sensor disagrees with peer devices",
        "message": "This device reports a room temperature far from the room median.",
        "likely_cause": "Sensor drift, placement issue, or local airflow bias.",
        "component": "Room temperature sensor",
        "parts": ["Temperature sensor", "mounting clip", "calibration kit"],
        "action": "Compare against peer pumps and recalibrate or replace the sensor.",
    },
    "cusum_negative_alarm": {
        "severity": "high",
        "title": "Sustained colder-than-model residual",
        "message": "Measured temperature is persistently below the RC model prediction.",
        "likely_cause": "Increasing heat loss, door/ventilation leakage, or weakening refrigerant path.",
        "component": "Envelope / refrigerant circuit",
        "parts": ["Filter set", "refrigerant service kit", "seal inspection kit"],
        "action": "Inspect airflow, filters, door/vent state, and refrigerant pressure trend.",
    },
    "cusum_positive_alarm": {
        "severity": "medium",
        "title": "Sustained warmer-than-model residual",
        "message": "Measured temperature is persistently above the RC model prediction.",
        "likely_cause": "Unexpected heat gain, sensor bias, or control overshoot.",
        "component": "Controls / room sensor",
        "parts": ["Temperature sensor", "controller service kit"],
        "action": "Check setpoint history, sensor placement, and external heat gains.",
    },
    "rc_negative_shift": {
        "severity": "high",
        "title": "Sharp negative thermal residual",
        "message": "The room is colder than expected from the physics model.",
        "likely_cause": "Door/ventilation event, defrost dip, or sudden capacity loss.",
        "component": "Envelope / airflow path",
        "parts": ["Filter set", "seal inspection kit"],
        "action": "Confirm whether this coincides with defrost; if sustained, inspect airflow and envelope leakage.",
    },
    "rc_positive_shift": {
        "severity": "medium",
        "title": "Sharp positive thermal residual",
        "message": "The room is warmer than expected from the physics model.",
        "likely_cause": "Solar/occupancy gain, sensor bias, or control overshoot.",
        "component": "Controls / room sensor",
        "parts": ["Temperature sensor", "controller service kit"],
        "action": "Check occupancy, solar exposure, and sensor agreement with peer pumps.",
    },
    "compressor_no_effect": {
        "severity": "critical",
        "title": "Compressor active with weak supply response",
        "message": "The compressor is active but supply air is not moving the room temperature.",
        "likely_cause": "Running unit is drawing power but delivering weak thermal effect.",
        "component": "Compressor / fan-coil / refrigerant circuit",
        "parts": ["Refrigerant service kit", "fan inspection kit", "filter set"],
        "action": "Inspect compressor operation, fan airflow, filters, and refrigerant pressures first.",
    },
    "setpoint_miss": {
        "severity": "high",
        "title": "Setpoint not reached",
        "message": "Room temperature remains far from setpoint while conditioning is required.",
        "likely_cause": "Extended conditioning could not reach target; likely envelope loss, refrigerant low, or undersizing.",
        "component": "Envelope / capacity",
        "parts": ["Filter set", "refrigerant service kit", "thermal inspection kit"],
        "action": "Check whether preheat was long enough, then inspect capacity, refrigerant, filters, and envelope leakage.",
    },
}


def _confidence_for(flag: str, seg: pd.DataFrame) -> float:
    base = {
        "hardware_alarm": 0.95,
        "compressor_no_effect": 0.86,
        "setpoint_miss": 0.78,
        "cusum_negative_alarm": 0.76,
        "cusum_positive_alarm": 0.68,
        "rc_negative_shift": 0.70,
        "rc_positive_shift": 0.62,
        "peer_sensor_outlier": 0.82,
    }.get(flag, 0.6)
    duration_bonus = min(len(seg) / 200.0, 0.08)
    residual_bonus = 0.0
    if "rc_residual" in seg:
        max_abs = float(np.nanmax(np.abs(seg["rc_residual"])))
        residual_bonus = min(max_abs / 10.0, 0.06)
    return round(min(base + duration_bonus + residual_bonus, 0.98), 2)


def _evidence_summary(flag: str, evidence: dict) -> str:
    residual = evidence.get("maxAbsResidualDegC")
    peer = evidence.get("maxPeerDeviationDegC")
    rows = evidence.get("rows")
    if flag == "hardware_alarm":
        return f"Error register active across {rows} samples."
    if flag == "peer_sensor_outlier":
        return f"Peer deviation peaked at {peer} degC."
    if flag == "compressor_no_effect":
        return f"Compressor was active while thermal response stayed weak for {rows} samples."
    if flag == "setpoint_miss":
        return f"Setpoint miss persisted for {rows} samples with max residual {residual} degC."
    return f"Residual evidence peaked at {residual} degC across {rows} samples."
