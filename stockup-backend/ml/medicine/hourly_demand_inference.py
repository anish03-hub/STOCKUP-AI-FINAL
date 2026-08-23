"""Shared, read-only inference utilities for the hourly medicine demand v2 model."""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd


MEDICINE_DIR = Path(__file__).resolve().parent
DATA_PATH = MEDICINE_DIR / "data" / "saleshourly.csv"
MODEL_PATH = MEDICINE_DIR / "models" / "hourly_demand_random_forest_v2.joblib"
METADATA_PATH = MEDICINE_DIR / "models" / "hourly_demand_feature_info_v2.json"
LAGS = (1, 2, 24, 168)


def load_model_contract() -> tuple[dict, dict]:
    """Load the saved model and verify its feature metadata matches exactly."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Saved v2 model not found: {MODEL_PATH}")
    if not METADATA_PATH.exists():
        raise FileNotFoundError(f"Saved v2 feature metadata not found: {METADATA_PATH}")

    artifact = joblib.load(MODEL_PATH)
    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    required_artifact_keys = {"model", "feature_columns", "target_columns", "lags", "rolling_features"}
    missing_keys = required_artifact_keys.difference(artifact)
    if missing_keys:
        raise ValueError(f"Saved model artifact is incomplete: {sorted(missing_keys)}")
    if artifact["feature_columns"] != metadata.get("feature_columns"):
        raise ValueError("Saved model and feature metadata have different feature orders")
    if artifact["target_columns"] != metadata.get("target_columns"):
        raise ValueError("Saved model and feature metadata have different target codes")
    if tuple(artifact["lags"]) != LAGS:
        raise ValueError("Saved model uses unsupported lag settings")
    return artifact, metadata


def load_sales_history(target_columns: list[str]) -> pd.DataFrame:
    """Read and validate the source CSV without changing it."""
    data = pd.read_csv(DATA_PATH)
    required_columns = {"datum", "Year", "Month", "Hour", "Weekday Name", *target_columns}
    missing_columns = sorted(required_columns.difference(data.columns))
    if missing_columns:
        raise ValueError(f"saleshourly.csv is missing required columns: {missing_columns}")

    data["datum"] = pd.to_datetime(data["datum"], format="%m/%d/%Y %H:%M", errors="raise")
    if data["datum"].duplicated().any():
        raise ValueError("saleshourly.csv contains duplicate timestamps")
    if data[target_columns].isna().any().any():
        raise ValueError("saleshourly.csv contains missing demand values")
    return data.sort_values("datum").reset_index(drop=True)


def build_past_only_features(data: pd.DataFrame, target_columns: list[str]) -> pd.DataFrame:
    """Recreate all v2 features using observations strictly before each row.

    ``shift(1)`` is applied before rolling statistics. Thus, at time t each
    rolling value contains only t-24 through t-1 or t-168 through t-1, never
    the observation at t or a later observation.
    """
    frame = data.copy()
    frame["weekday"] = frame["datum"].dt.dayofweek
    frame["day_of_year"] = frame["datum"].dt.dayofyear
    frame["elapsed_hours"] = ((frame["datum"] - frame["datum"].min()).dt.total_seconds() / 3600).astype(int)

    for target in target_columns:
        history = frame[target].shift(1)
        for lag in LAGS:
            frame[f"{target}_lag_{lag}"] = frame[target].shift(lag)
        frame[f"{target}_rolling_mean_24"] = history.rolling(window=24, min_periods=24).mean()
        frame[f"{target}_rolling_max_24"] = history.rolling(window=24, min_periods=24).max()
        frame[f"{target}_rolling_mean_168"] = history.rolling(window=168, min_periods=168).mean()
    return frame


def validate_latest_feature_values(data: pd.DataFrame, features: pd.Series, target_columns: list[str]) -> None:
    """Assert every latest feature matches direct preceding-history calculations."""
    latest_position = len(data) - 1
    for target in target_columns:
        history = data.loc[: latest_position - 1, target]
        expected = {
            f"{target}_lag_1": history.iloc[-1],
            f"{target}_lag_2": history.iloc[-2],
            f"{target}_lag_24": history.iloc[-24],
            f"{target}_lag_168": history.iloc[-168],
            f"{target}_rolling_mean_24": history.iloc[-24:].mean(),
            f"{target}_rolling_max_24": history.iloc[-24:].max(),
            f"{target}_rolling_mean_168": history.iloc[-168:].mean(),
        }
        for column, value in expected.items():
            if not np.isclose(features[column], value):
                raise ValueError(f"Past-only feature validation failed for {column}")


def predict_latest_demand(product_code: str, artifact: dict) -> dict[str, float | str]:
    """Predict next-hour demand for one supported product from the latest history."""
    target_columns = artifact["target_columns"]
    if product_code not in target_columns:
        raise ValueError(f"Unsupported product code: {product_code}")

    data = load_sales_history(target_columns)
    feature_frame = build_past_only_features(data, target_columns)
    feature_columns = artifact["feature_columns"]
    latest_features = feature_frame.loc[:, feature_columns].dropna().iloc[-1]
    if feature_frame.index[-1] != latest_features.name:
        raise ValueError("The latest historical row does not have all required past-only features")
    validate_latest_feature_values(data, latest_features, target_columns)

    prediction_vector = artifact["model"].predict(pd.DataFrame([latest_features], columns=feature_columns))[0]
    if not np.isfinite(prediction_vector).all():
        raise ValueError("Model produced a non-numeric prediction")
    product_index = target_columns.index(product_code)
    latest_row = data.iloc[-1]
    return {
        "product_code": product_code,
        "latest_timestamp": latest_row["datum"].isoformat(),
        "latest_observed_demand": float(latest_row[product_code]),
        "predicted_next_hour_demand": float(prediction_vector[product_index]),
        "features": latest_features,
    }
