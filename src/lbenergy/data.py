"""
data.py — Dataset loading and feature construction.

Pure I/O + dataframe assembly. No model logic lives here.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from .config import RESAMPLE_MIN


def load_snapshots(directory: Path) -> pd.DataFrame:
    """
    Load heat_pump_snapshots.csv, average across all 4 devices at each
    timestamp (T_room and T_out are shared; T_supply varies slightly).
    Returns a DataFrame indexed by timestamp, resampled to RESAMPLE_MIN.
    """
    snap = pd.read_csv(
        directory / "heat_pump_snapshots.csv",
        parse_dates=["last_seen_at"],
        usecols=[
            "last_seen_at",
            "status_temperature_in_celsius",
            "status_temperature_outside_in_celsius",
            "status_temperature_supply_in_celsius",
            "status_temperature_return_in_celsius",
            "status_is_heating_required",
            "status_target_temperature_in_celsius",
            "status_is_compressor_active",
            "status_humidity_in_percent",
            "status_carbon_dioxide_in_ppm",
        ],
    )
    snap = snap.rename(columns={
        "last_seen_at":                           "ts",
        "status_temperature_in_celsius":          "T_room",
        "status_temperature_outside_in_celsius":  "T_out",
        "status_temperature_supply_in_celsius":   "T_supply",
        "status_temperature_return_in_celsius":   "T_return",
        "status_is_heating_required":             "heating_req",
        "status_target_temperature_in_celsius":   "setpoint",
        "status_is_compressor_active":            "compressor",
        "status_humidity_in_percent":             "humidity",
        "status_carbon_dioxide_in_ppm":           "co2",
    })

    # Average across devices at each timestamp
    snap = snap.groupby("ts").agg(
        T_room      =("T_room",      "mean"),
        T_out       =("T_out",       "mean"),
        T_supply    =("T_supply",    "mean"),
        T_return    =("T_return",    "mean"),
        heating_req =("heating_req", "max"),
        setpoint    =("setpoint",    "first"),
        compressor  =("compressor",  "max"),
        humidity    =("humidity",    "mean"),
        co2         =("co2",         "mean"),
    )

    # Resample to regular grid
    snap = snap.resample(f"{RESAMPLE_MIN}min").mean()
    return snap.dropna(subset=["T_room", "T_out", "T_supply"])


def load_power(directory: Path) -> pd.Series:
    """
    Load power_draw.csv, sum kW across all 4 devices per 5-minute timestamp.
    Returns a Series named 'P_total_kw'.
    """
    power = pd.read_csv(
        directory / "power_draw.csv",
        parse_dates=["timestamp"],
        usecols=["timestamp", "power_draw_kw"],
    )
    total = power.groupby("timestamp")["power_draw_kw"].sum()
    total.name = "P_total_kw"
    return total


def load_events(directory: Path) -> pd.DataFrame:
    """Load space_events.csv with UTC-parsed start/end times."""
    ev = pd.read_csv(
        directory / "space_events.csv",
        parse_dates=["starts_at", "ends_at"],
    )
    return ev.sort_values("starts_at").reset_index(drop=True)


def build_dataset(directory: Path) -> pd.DataFrame:
    """Merge snapshots + power into a single analysis DataFrame with features."""
    snaps = load_snapshots(directory)
    power = load_power(directory)
    df = snaps.join(power, how="inner")

    # Derived features
    df["delta_Tsup_room"] = df["T_supply"] - df["T_room"]   # supply heating drive
    df["delta_Troom_out"] = df["T_room"]   - df["T_out"]    # heat loss drive

    # Forward difference dT/dt in °C/h (using next 5-min step)
    dt_h = RESAMPLE_MIN / 60.0
    df["dT_dt"] = df["T_room"].diff().shift(-1) / dt_h

    # Heating mode classification
    df["mode"] = "standby"
    df.loc[df["T_supply"] >= 40, "mode"] = "fan_coil"          # hot-water coil active
    df.loc[df["P_total_kw"] >= 20, "mode"] = "boost"           # electric boost

    return df
