#!/usr/bin/env python3
"""Train and compare a past-only, hourly medicine demand forecasting model.

This v2 experiment reads only ``data/saleshourly.csv``. Every demand feature is
shifted before it is used, so the next-hour target and all rolling statistics
are separated from future observations.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


RANDOM_STATE = 42
TEST_FRACTION = 0.20
LAGS = (1, 2, 24, 168)
TARGET_COLUMNS = ("M01AB", "M01AE", "N02BA", "N02BE", "N05B", "N05C", "R03", "R06")
SCRIPT_DIR = Path(__file__).resolve().parent
MEDICINE_DIR = SCRIPT_DIR.parent
DATA_PATH = MEDICINE_DIR / "data" / "saleshourly.csv"
MODELS_DIR = MEDICINE_DIR / "models"
BASELINE_METRICS_PATH = MODELS_DIR / "hourly_demand_metrics.json"
MODEL_PATH = MODELS_DIR / "hourly_demand_random_forest_v2.joblib"
METRICS_PATH = MODELS_DIR / "hourly_demand_metrics_v2.json"
METADATA_PATH = MODELS_DIR / "hourly_demand_feature_info_v2.json"


def load_data() -> pd.DataFrame:
    """Load the immutable source and enforce the expected time-series contract."""
    data = pd.read_csv(DATA_PATH)
    required = {"datum", "Year", "Month", "Hour", "Weekday Name", *TARGET_COLUMNS}
    missing_columns = sorted(required.difference(data.columns))
    if missing_columns:
        raise ValueError(f"saleshourly.csv is missing required columns: {missing_columns}")

    data["datum"] = pd.to_datetime(data["datum"], format="%m/%d/%Y %H:%M", errors="raise")
    if data["datum"].duplicated().any():
        raise ValueError("saleshourly.csv contains duplicate timestamps")
    if data[list(TARGET_COLUMNS)].isna().any().any():
        raise ValueError("saleshourly.csv contains missing demand values")
    return data.sort_values("datum").reset_index(drop=True)


def add_past_only_features(data: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """Create calendar, lag, and rolling features with no target leakage.

    For a row at time t, ``shift(1)`` removes the t observation before a
    rolling window is calculated. The resulting 24-hour statistic therefore
    contains t-24 through t-1 only; the 168-hour statistic contains t-168
    through t-1 only.
    """
    frame = data.copy()
    frame["weekday"] = frame["datum"].dt.dayofweek
    frame["day_of_year"] = frame["datum"].dt.dayofyear
    frame["elapsed_hours"] = ((frame["datum"] - frame["datum"].min()).dt.total_seconds() / 3600).astype(int)
    feature_columns = ["Year", "Month", "Hour", "weekday", "day_of_year", "elapsed_hours"]

    for target in TARGET_COLUMNS:
        history = frame[target].shift(1)
        for lag in LAGS:
            column = f"{target}_lag_{lag}"
            frame[column] = frame[target].shift(lag)
            feature_columns.append(column)

        rolling_features = {
            f"{target}_rolling_mean_24": history.rolling(window=24, min_periods=24).mean(),
            f"{target}_rolling_max_24": history.rolling(window=24, min_periods=24).max(),
            f"{target}_rolling_mean_168": history.rolling(window=168, min_periods=168).mean(),
        }
        for column, values in rolling_features.items():
            frame[column] = values
            feature_columns.append(column)

        frame[f"next_{target}"] = frame[target].shift(-1)

    return frame.dropna().reset_index(drop=True), feature_columns


def calculate_metrics(actual: np.ndarray, predicted: np.ndarray) -> dict[str, dict[str, float]]:
    """Calculate metrics independently for every product code."""
    metrics: dict[str, dict[str, float]] = {}
    for index, target in enumerate(TARGET_COLUMNS):
        y_true, y_pred = actual[:, index], predicted[:, index]
        metrics[target] = {
            "mae": round(float(mean_absolute_error(y_true, y_pred)), 4),
            "rmse": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 4),
            "r2": round(float(r2_score(y_true, y_pred)), 4),
        }
    return metrics


def macro_average(metrics: dict[str, dict[str, float]]) -> dict[str, float]:
    """Give every product code equal weight in the top-level comparison."""
    return {
        metric: round(float(np.mean([values[metric] for values in metrics.values()])), 4)
        for metric in ("mae", "rmse", "r2")
    }


def print_comparison(baseline: dict[str, dict[str, float]], improved: dict[str, dict[str, float]]) -> None:
    """Print the requested baseline and improved per-code metric comparison."""
    print("\nBASELINE MODEL")
    print("Code     MAE      RMSE     R²")
    for target in TARGET_COLUMNS:
        values = baseline[target]
        print(f"{target:<7} {values['mae']:<8.4f} {values['rmse']:<8.4f} {values['r2']:.4f}")
    print(f"MACRO   {macro_average(baseline)['mae']:<8.4f} {macro_average(baseline)['rmse']:<8.4f} {macro_average(baseline)['r2']:.4f}")

    print("\nIMPROVED MODEL")
    print("Code     MAE      RMSE     R²")
    for target in TARGET_COLUMNS:
        values = improved[target]
        print(f"{target:<7} {values['mae']:<8.4f} {values['rmse']:<8.4f} {values['r2']:.4f}")
    print(f"MACRO   {macro_average(improved)['mae']:<8.4f} {macro_average(improved)['rmse']:<8.4f} {macro_average(improved)['r2']:.4f}")


def main() -> None:
    if not BASELINE_METRICS_PATH.exists():
        raise FileNotFoundError(f"Baseline metrics not found: {BASELINE_METRICS_PATH}")
    baseline_metrics = json.loads(BASELINE_METRICS_PATH.read_text(encoding="utf-8"))
    if set(baseline_metrics) != set(TARGET_COLUMNS):
        raise ValueError("Baseline metrics do not match the expected product codes")

    print("StockUp AI — Hourly Medicine Demand Training v2")
    print(f"Source: {DATA_PATH}")
    data = load_data()
    frame, feature_columns = add_past_only_features(data)
    target_columns = [f"next_{target}" for target in TARGET_COLUMNS]

    split_index = int(len(frame) * (1 - TEST_FRACTION))
    train, test = frame.iloc[:split_index], frame.iloc[split_index:]
    x_train, y_train = train[feature_columns], train[target_columns]
    x_test, y_test = test[feature_columns], test[target_columns]

    print(f"Records read: {len(data)}")
    print(f"Usable supervised records: {len(frame)}")
    print(f"Training period: {train['datum'].min()} to {train['datum'].max()}")
    print(f"Test period: {test['datum'].min()} to {test['datum'].max()}")
    print(f"Features: {len(feature_columns)} | Targets: {len(target_columns)}")

    model = RandomForestRegressor(
        n_estimators=150,
        min_samples_leaf=2,
        max_features=0.8,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    model.fit(x_train, y_train)
    improved_metrics = calculate_metrics(y_test.to_numpy(), model.predict(x_test))
    print_comparison(baseline_metrics, improved_metrics)

    MODELS_DIR.mkdir(exist_ok=True)
    joblib.dump(
        {
            "model": model,
            "feature_columns": feature_columns,
            "target_columns": list(TARGET_COLUMNS),
            "lags": list(LAGS),
            "rolling_features": ["mean_24", "max_24", "mean_168"],
            "prediction_horizon": "next observed hour",
        },
        MODEL_PATH,
    )

    comparison = {
        "baseline_model": baseline_metrics,
        "improved_model": improved_metrics,
        "baseline_macro_average": macro_average(baseline_metrics),
        "improved_macro_average": macro_average(improved_metrics),
    }
    metadata = {
        "source_file": DATA_PATH.name,
        "records_read": len(data),
        "usable_supervised_records": len(frame),
        "train_records": len(train),
        "test_records": len(test),
        "train_period": [str(train["datum"].min()), str(train["datum"].max())],
        "test_period": [str(test["datum"].min()), str(test["datum"].max())],
        "feature_columns": feature_columns,
        "target_columns": list(TARGET_COLUMNS),
        "lags": list(LAGS),
        "rolling_features": {
            "rolling_mean_24": "mean of t-24 through t-1",
            "rolling_max_24": "maximum of t-24 through t-1",
            "rolling_mean_168": "mean of t-168 through t-1",
        },
        "split_strategy": "chronological_80_20",
        "prediction_horizon": "next observed hour",
        "leakage_control": "All lag and rolling features are built from shift(1) or earlier observations.",
    }
    METRICS_PATH.write_text(json.dumps(comparison, indent=2) + "\n", encoding="utf-8")
    METADATA_PATH.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(f"\nSaved model: {MODEL_PATH}")
    print(f"Saved metrics: {METRICS_PATH}")
    print(f"Saved metadata: {METADATA_PATH}")


if __name__ == "__main__":
    main()
