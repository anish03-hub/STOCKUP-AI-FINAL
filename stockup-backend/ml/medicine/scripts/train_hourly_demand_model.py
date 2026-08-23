#!/usr/bin/env python3
"""Train a standalone next-hour medicine demand forecasting experiment.

The script reads only ``data/saleshourly.csv``.  It forecasts all eight ATC
medicine-category demand series for the next observed hour using calendar and
lagged-demand features, evaluates on the final chronological 20% of records,
and writes model artifacts outside the data directory.
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
LAGS = (1, 24, 168)
TARGET_COLUMNS = ("M01AB", "M01AE", "N02BA", "N02BE", "N05B", "N05C", "R03", "R06")
SCRIPT_DIR = Path(__file__).resolve().parent
MEDICINE_DIR = SCRIPT_DIR.parent
DATA_PATH = MEDICINE_DIR / "data" / "saleshourly.csv"
MODELS_DIR = MEDICINE_DIR / "models"
MODEL_PATH = MODELS_DIR / "hourly_demand_random_forest.joblib"
METRICS_PATH = MODELS_DIR / "hourly_demand_metrics.json"
METADATA_PATH = MODELS_DIR / "hourly_demand_feature_info.json"


def load_data() -> pd.DataFrame:
    """Load and validate the immutable hourly sales source."""
    data = pd.read_csv(DATA_PATH)
    expected_columns = {"datum", "Year", "Month", "Hour", "Weekday Name", *TARGET_COLUMNS}
    missing_columns = expected_columns.difference(data.columns)
    if missing_columns:
        raise ValueError(f"saleshourly.csv is missing required columns: {sorted(missing_columns)}")

    data["datum"] = pd.to_datetime(data["datum"], format="%m/%d/%Y %H:%M", errors="raise")
    if data["datum"].duplicated().any():
        raise ValueError("saleshourly.csv contains duplicate timestamps")
    if data[list(TARGET_COLUMNS)].isna().any().any():
        raise ValueError("saleshourly.csv contains missing demand values")

    return data.sort_values("datum").reset_index(drop=True)


def create_training_frame(data: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """Build features available before the next observation and next-hour targets."""
    frame = data.copy()
    frame["weekday"] = frame["datum"].dt.dayofweek
    frame["day_of_year"] = frame["datum"].dt.dayofyear
    frame["elapsed_hours"] = ((frame["datum"] - frame["datum"].min()).dt.total_seconds() / 3600).astype(int)
    feature_columns = ["Year", "Month", "Hour", "weekday", "day_of_year", "elapsed_hours"]

    for target in TARGET_COLUMNS:
        for lag in LAGS:
            column = f"{target}_lag_{lag}"
            frame[column] = frame[target].shift(lag)
            feature_columns.append(column)
        frame[f"next_{target}"] = frame[target].shift(-1)

    return frame.dropna().reset_index(drop=True), feature_columns


def calculate_metrics(actual: np.ndarray, predicted: np.ndarray) -> dict[str, dict[str, float]]:
    """Return independently interpretable test metrics for each demand series."""
    metrics: dict[str, dict[str, float]] = {}
    for index, target in enumerate(TARGET_COLUMNS):
        y_true = actual[:, index]
        y_pred = predicted[:, index]
        metrics[target] = {
            "mae": round(float(mean_absolute_error(y_true, y_pred)), 4),
            "rmse": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 4),
            "r2": round(float(r2_score(y_true, y_pred)), 4),
        }
    return metrics


def main() -> None:
    print("StockUp AI — Hourly Medicine Demand Training")
    print(f"Source: {DATA_PATH}")
    data = load_data()
    frame, feature_columns = create_training_frame(data)
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
    predictions = model.predict(x_test)
    metrics = calculate_metrics(y_test.to_numpy(), predictions)

    print("\nChronological test metrics")
    for target, values in metrics.items():
        print(f"{target}: MAE={values['mae']:.4f}, RMSE={values['rmse']:.4f}, R²={values['r2']:.4f}")

    MODELS_DIR.mkdir(exist_ok=True)
    artifact = {
        "model": model,
        "feature_columns": feature_columns,
        "target_columns": list(TARGET_COLUMNS),
        "lags": list(LAGS),
        "prediction_horizon": "next observed hour",
    }
    joblib.dump(artifact, MODEL_PATH)

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
        "split_strategy": "chronological_80_20",
        "prediction_horizon": "next observed hour",
    }
    METRICS_PATH.write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    METADATA_PATH.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(f"\nSaved model: {MODEL_PATH}")
    print(f"Saved metrics: {METRICS_PATH}")
    print(f"Saved metadata: {METADATA_PATH}")


if __name__ == "__main__":
    main()
