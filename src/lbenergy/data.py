"""
data.py — Dataset loading, cleaning, and the two pipeline builders.

Architecture: a shared raw loader + a shared `clean()` feed TWO builders that
diverge only at aggregation (see DATA_CONTRACT.md):

    load_snapshots_raw ─┐
                        ├─ clean ─┬─ build_prediction_frame  (room-level, 15-min)
    load_power_raw ─────┘         └─ build_anomaly_frame     (device-level, ~90 s)

Cleaning logic lives in exactly one place so a data fix never has to be made
twice. Pure I/O + dataframe assembly — no model logic here.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from .config import (
    PRED_RESAMPLE_MIN, ANOMALY_REF_BUCKET, BOOST_KW_THRESHOLD, RESAMPLE_MIN,
)

# Source columns we care about, mapped to short names.
_RENAME = {
    "last_seen_at":                          "ts",
    "device_id":                             "device_id",
    "status_temperature_in_celsius":         "T_room",
    "status_temperature_outside_in_celsius": "T_out",
    "status_temperature_supply_in_celsius":  "T_supply",
    "status_temperature_return_in_celsius":  "T_return",
    "status_is_heating_required":            "heating_req",
    "status_is_cooling_required":            "cooling_req",
    "status_target_temperature_in_celsius":  "setpoint",
    "status_is_compressor_active":           "compressor",
    "status_humidity_in_percent":            "humidity",
    "status_carbon_dioxide_in_ppm":          "co2",
    "status_low_pressure_in_bar":            "p_low",
    "status_high_pressure_in_bar":           "p_high",
    "status_air_flow_supply_in_percent":     "flow_supply",
    "status_air_flow_return_in_percent":     "flow_return",
    "status_is_defrost_active":              "defrost",
    "status_is_alarm_active":                "alarm",
    "status_error_registers":                "error_registers",
    "status_is_enabled":                     "enabled",
    "status_has_network_error":              "net_error",
    "status_network_error_count":            "net_error_count",
    "status_system_uptime_in_seconds":       "uptime_s",
}


# ─── Shared raw loaders ──────────────────────────────────────────────────────

def load_snapshots_raw(directory: Path) -> pd.DataFrame:
    """
    Load heat_pump_snapshots.csv at NATIVE resolution, device-level, renamed.
    Indexed by timestamp, keeps `device_id`. Robust to columns missing in one
    of the two windows.
    """
    path = directory / "heat_pump_snapshots.csv"
    available = pd.read_csv(path, nrows=0).columns
    usecols = [c for c in _RENAME if c in available]
    snap = pd.read_csv(path, usecols=usecols, parse_dates=["last_seen_at"])
    snap = snap.rename(columns=_RENAME).sort_values("ts").set_index("ts")
    return snap


def load_power_raw(directory: Path) -> pd.DataFrame:
    """Load power_draw.csv at native 5-min, device-level (ts, device_id, kw)."""
    power = pd.read_csv(
        directory / "power_draw.csv",
        parse_dates=["timestamp"],
        usecols=["timestamp", "device_id", "power_draw_kw"],
    ).rename(columns={"timestamp": "ts", "power_draw_kw": "kw"})
    return power


def load_events(directory: Path) -> pd.DataFrame:
    """Load space_events.csv with UTC-parsed start/end times."""
    ev = pd.read_csv(directory / "space_events.csv", parse_dates=["starts_at", "ends_at"])
    return ev.sort_values("starts_at").reset_index(drop=True)


# ─── Shared cleaning ─────────────────────────────────────────────────────────

def clean(df: pd.DataFrame, *, drop_alarms: bool = True, drop_defrost: bool = True) -> pd.DataFrame:
    """
    Drop rows that would corrupt downstream use. Always drops disabled units,
    network errors, implausible temperatures and just-rebooted controllers.

    `drop_alarms` / `drop_defrost` default True for the PREDICTION pipeline
    (we want clean dynamics). The ANOMALY pipeline passes False — alarms and
    defrost cycles are exactly the signal it must learn to recognise.
    """
    out = df
    if "enabled" in out:
        out = out[out["enabled"] != 0]
    if "net_error" in out:
        out = out[out["net_error"].fillna(0) == 0]
    if "net_error_count" in out:
        out = out[out["net_error_count"].fillna(0) == 0]
    if "uptime_s" in out:
        out = out[out["uptime_s"].fillna(1e9) >= 300]      # >5 min since boot
    for col in ("T_room", "T_out"):
        if col in out:
            out = out[out[col].between(-30, 60)]
    if drop_alarms and "alarm" in out:
        out = out[out["alarm"].fillna(0) == 0]
    if drop_alarms and "error_registers" in out:
        out = out[~_error_register_nonzero(out["error_registers"])]
    if drop_defrost and "defrost" in out:
        out = out[out["defrost"].fillna(0) == 0]
    return out


def _error_register_nonzero(values: pd.Series) -> pd.Series:
    """True when any comma-separated Modbus error register contains a bit."""
    text = values.fillna("0").astype(str).str.strip()
    return text.apply(
        lambda raw: any(
            int(float(part or "0")) != 0 for part in raw.split(",") if part.strip() != ""
        )
    )


# ─── Pipeline 1: prediction (room-level, 15-min) ─────────────────────────────

def build_prediction_frame(
    directory: Path,
    resample_min: int = PRED_RESAMPLE_MIN,
) -> pd.DataFrame:
    """
    Room-level analysis frame on a `resample_min`-minute grid for the RC model.

    Device aggregation: MEDIAN for room/environment signals (robust to one bad
    sensor), MAX for heating-required, SUM for power. Boost is flagged from the
    MAX power in each bucket so a brief boost isn't averaged away.
    """
    raw = clean(load_snapshots_raw(directory))

    grid = f"{resample_min}min"
    room = raw.resample(grid).agg(
        T_room      =("T_room",      "median"),
        T_out       =("T_out",       "median"),
        T_supply    =("T_supply",    "median"),
        T_return    =("T_return",    "median"),
        heating_req =("heating_req", "max"),
        setpoint    =("setpoint",    "median"),
        compressor  =("compressor",  "max"),
        humidity    =("humidity",    "median"),
        co2         =("co2",         "median"),
    )

    # Total instantaneous power (sum across devices), then mean / max per bucket.
    total = load_power_raw(directory).groupby("ts")["kw"].sum()
    P_mean = total.resample(grid).mean().rename("P_total_kw")
    P_max  = total.resample(grid).max().rename("P_total_max_kw")

    df = room.join([P_mean, P_max], how="inner").dropna(
        subset=["T_room", "T_out", "T_supply"]
    )

    # Derived features
    df["delta_Tsup_room"] = df["T_supply"] - df["T_room"]
    df["delta_Troom_out"] = df["T_room"]   - df["T_out"]
    dt_h = resample_min / 60.0
    df["dT_dt"] = df["T_room"].diff().shift(-1) / dt_h
    df["is_boost"] = (df["P_total_max_kw"] >= BOOST_KW_THRESHOLD).astype(int)
    df["mode"] = "standby"
    df.loc[df["T_supply"] >= 40, "mode"] = "fan_coil"
    df.loc[df["is_boost"] == 1, "mode"] = "boost"
    return df


# Backward-compatible alias: existing callers (pipeline.run_pipeline, notebooks)
# keep working and silently get the improved 15-min/median behaviour.
def build_dataset(directory: Path) -> pd.DataFrame:
    return build_prediction_frame(directory)


# ─── Pipeline 2: anomaly (device-level, native ~90 s) ────────────────────────

def build_anomaly_frame(
    directory: Path,
    ref_bucket: str = ANOMALY_REF_BUCKET,
) -> pd.DataFrame:
    """
    Device-level frame at NATIVE resolution (~90 s) for anomaly detection.

    Keeps every device separate and KEEPS alarm/defrost rows (those are signal,
    not noise). Adds `T_room_dev` = this device's room-temp reading minus the
    cross-device median in a short time bucket — a strong single-sensor-fault
    and local-disturbance detector.
    """
    raw = clean(load_snapshots_raw(directory), drop_alarms=False, drop_defrost=False)
    raw = raw.reset_index()

    # Cross-device agreement: deviation from the peer median in each short bucket.
    raw["bucket"] = raw["ts"].dt.floor(ref_bucket)
    ref = raw.groupby("bucket")["T_room"].median().rename("T_room_ref")
    raw = raw.join(ref, on="bucket")
    raw["T_room_dev"] = raw["T_room"] - raw["T_room_ref"]

    # Attach each device's own power (5-min, forward-filled to the native grid).
    power = load_power_raw(directory).rename(columns={"kw": "P_device_kw"})
    raw = pd.merge_asof(
        raw.sort_values("ts"),
        power.sort_values("ts"),
        on="ts", by="device_id", direction="nearest",
        tolerance=pd.Timedelta("5min"),
    )
    return raw.drop(columns=["bucket"]).set_index("ts")


# ─── Legacy helpers kept for backward compatibility ──────────────────────────

def load_snapshots(directory: Path) -> pd.DataFrame:
    """Deprecated: room-level loader. Prefer build_prediction_frame()."""
    raw = clean(load_snapshots_raw(directory))
    return raw.resample(f"{RESAMPLE_MIN}min").median().dropna(
        subset=["T_room", "T_out", "T_supply"]
    )


def load_power(directory: Path) -> pd.Series:
    """Deprecated: total power per native 5-min timestamp."""
    total = load_power_raw(directory).groupby("ts")["kw"].sum()
    total.name = "P_total_kw"
    return total
