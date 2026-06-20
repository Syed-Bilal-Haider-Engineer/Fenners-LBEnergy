"""
external.py — Second data source: external weather (and optional grid signals).

The physics model is fed by TWO data sources:

  1. INTERNAL  — IHL telemetry, aggregated to a room-level frame (see data.py /
                 DATA_CONTRACT.md). Owns: T_room, T_supply, P_total_kw, etc.
  2. EXTERNAL  — this module. Owns the *forward-looking* signals the IHL box
                 cannot measure: weather FORECAST (outside temp, solar, wind,
                 humidity) and optionally electricity price / grid carbon.

Why external weather matters for the controller:
  • The preheat decision is made N hours BEFORE the event, so it needs the
    forecast outside temperature over the preheat window — not the single
    current sensor reading. A cold front arriving at 06:00 changes the start time.
  • Solar irradiance + wind drive the ML residual layer (residual.py): solar is
    free daytime heat; wind strips heat from thin-walled structures.

Source: Open-Meteo (https://open-meteo.com) — free, no API key. The *archive*
endpoint returns real historical weather for the dataset dates, so we can train
and validate against the actual conditions the building experienced.

This module is a SCAFFOLD with a working fetch + a safe offline fallback. The
join contract (columns, grid, key) is fixed; swap the fetch internals freely.
"""

from __future__ import annotations

import json
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
import pandas as pd

from .config import DATA_ROOT, RESAMPLE_MIN

# TUM Aerospace & Geodesy Campus, Ottobrunn-Taufkirchen (challenge scenario).
LOCATION = {"latitude": 48.06, "longitude": 11.67, "timezone": "UTC"}

# The columns this source is contracted to deliver (see DATA_CONTRACT.md §2).
EXTERNAL_COLUMNS = [
    "T_out_fc",          # °C   outside air temperature (forecast/archive)
    "solar_irradiance",  # W/m² global horizontal irradiance
    "wind_speed",        # m/s  10 m wind speed
    "humidity_out",      # %    outside relative humidity
]

_CACHE_DIR = DATA_ROOT / "_external_cache"
_OPEN_METEO_ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"


def fetch_weather(start: str, end: str, *, use_cache: bool = True) -> pd.DataFrame:
    """
    Fetch hourly weather for [start, end] (YYYY-MM-DD) at the campus location.

    Returns a DataFrame indexed by UTC timestamp with EXTERNAL_COLUMNS.
    Falls back to an empty (all-NaN) frame on any network error so the rest of
    the pipeline still runs offline — callers should treat NaNs as "no external
    data, use the on-unit sensor instead".
    """
    _CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = _CACHE_DIR / f"weather_{start}_{end}.csv"   # CSV: no pyarrow dep
    if use_cache and cache_file.exists():
        return pd.read_csv(cache_file, index_col=0, parse_dates=True)

    params = {
        **LOCATION,
        "start_date": start,
        "end_date": end,
        "hourly": "temperature_2m,shortwave_radiation,wind_speed_10m,relative_humidity_2m",
    }
    url = f"{_OPEN_METEO_ARCHIVE}?{urllib.parse.urlencode(params)}"
    try:
        with urllib.request.urlopen(url, timeout=20) as resp:
            payload = json.loads(resp.read().decode())
        h = payload["hourly"]
        df = pd.DataFrame({
            "ts":               pd.to_datetime(h["time"], utc=True).tz_localize(None),
            "T_out_fc":         h["temperature_2m"],
            "solar_irradiance": h["shortwave_radiation"],
            "wind_speed":       h["wind_speed_10m"],
            "humidity_out":     h["relative_humidity_2m"],
        }).set_index("ts")
    except Exception as exc:  # offline / API down → safe fallback
        print(f"[external] weather fetch failed ({exc}); returning empty frame.")
        idx = pd.date_range(start, end, freq="h")
        return pd.DataFrame(np.nan, index=idx, columns=EXTERNAL_COLUMNS)

    if use_cache:                       # cache failure must NOT discard a good fetch
        try:
            df.to_csv(cache_file)
        except Exception as exc:
            print(f"[external] cache write skipped ({exc}).")
    return df


def join_external(model_df: pd.DataFrame, weather: pd.DataFrame) -> pd.DataFrame:
    """
    Align the external weather (hourly) onto the model frame's 5-min grid and
    merge on the timestamp index. Weather is interpolated linearly to the finer
    grid (it varies smoothly), so every model row gets forward-looking signals.

    Join key: the UTC timestamp index — the single contract both sources share.
    """
    if weather.empty or weather.isna().all().all():
        # No external data available: expose the columns as NaN so downstream
        # code can fall back to the on-unit T_out sensor without KeyErrors.
        for col in EXTERNAL_COLUMNS:
            model_df[col] = np.nan
        return model_df

    weather_5m = (
        weather.reindex(
            weather.index.union(model_df.index)
        )
        .interpolate(method="time")
        .reindex(model_df.index)
    )
    return model_df.join(weather_5m[EXTERNAL_COLUMNS], how="left")
