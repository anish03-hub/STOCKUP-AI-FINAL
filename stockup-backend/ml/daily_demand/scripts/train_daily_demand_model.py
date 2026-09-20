#!/usr/bin/env python3
"""
StockUp AI — Daily Medicine Demand Model Training Pipeline
=========================================================

Reads historical sales data directly from PostgreSQL (`daily_sales` table: 177,990 rows).
Applies strict chronological feature engineering (shift(1) past-only) to eliminate target leakage.
Trains and evaluates Baseline vs ML model (Random Forest / Gradient Boosting) on holdout year 2025.
Saves model artifact and comprehensive metadata for production inference.
"""

from __future__ import annotations
import json
import os
import sys
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import psycopg2
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import OrdinalEncoder

# Directory paths
ML_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = ML_DIR / "models"
MODEL_PATH = MODELS_DIR / "daily_demand_model.joblib"
METADATA_PATH = MODELS_DIR / "daily_demand_metadata.json"
PREPROCESSOR_PATH = MODELS_DIR / "daily_demand_preprocessor.joblib"

RANDOM_STATE = 42
LAGS = (1, 7, 14, 28)
ROLLING_WINDOWS = (7, 14, 28)


def connect_postgres():
    """Connect to the StockUp AI PostgreSQL database."""
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME", "stockup_ai"),
        user=os.getenv("DB_USER", "anishkumarsah"),
        password=os.getenv("DB_PASSWORD", ""),
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
    )


def load_data_from_postgres() -> pd.DataFrame:
    """Extract full daily sales dataset from PostgreSQL daily_sales table."""
    conn = connect_postgres()
    query = """
        SELECT 
            date,
            medicine,
            country,
            region,
            category,
            age_group,
            units_sold,
            unit_price,
            stock_level,
            expiry_days_remaining,
            covid_flag
        FROM daily_sales
        ORDER BY medicine, country, date
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df


def validate_data_quality(df: pd.DataFrame) -> dict:
    """Perform data quality checks before feature engineering."""
    total_rows = len(df)
    null_counts = df.isnull().sum().to_dict()
    dup_rows = int(df.duplicated(subset=["date", "medicine", "country", "category", "age_group"]).sum())
    negative_units = int((df["units_sold"] < 0).sum())
    invalid_prices = int((df["unit_price"] <= 0).sum())
    
    medicines = sorted(df["medicine"].unique().tolist())
    countries = sorted(df["country"].unique().tolist())
    regions = sorted(df["region"].unique().tolist())
    categories = sorted(df["category"].unique().tolist())
    
    min_date = str(df["date"].min())
    max_date = str(df["date"].max())
    
    report = {
        "total_rows": total_rows,
        "valid_rows": total_rows - negative_units - invalid_prices,
        "rejected_rows": 0,
        "null_counts": {k: int(v) for k, v in null_counts.items() if v > 0},
        "duplicate_key_rows": dup_rows,
        "negative_units_count": negative_units,
        "invalid_prices_count": invalid_prices,
        "min_date": min_date,
        "max_date": max_date,
        "distinct_medicines_count": len(medicines),
        "medicines": medicines,
        "distinct_countries_count": len(countries),
        "countries": countries,
        "distinct_regions_count": len(regions),
        "regions": regions,
        "distinct_categories_count": len(categories),
        "categories": categories,
    }
    return report


def build_past_only_features(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str], OrdinalEncoder]:
    """Generate past-only lag and rolling statistics with no target leakage."""
    data = df.copy()
    data["date"] = pd.to_datetime(data["date"])
    data = data.sort_values(["medicine", "country", "date"]).reset_index(drop=True)
    
    # 1. Past-only lag features
    for lag in LAGS:
        data[f"lag_{lag}"] = data.groupby(["medicine", "country"])["units_sold"].shift(lag)
    
    # 2. Past-only rolling features (shift(1) ensures current day is never in the rolling window)
    history = data.groupby(["medicine", "country"])["units_sold"].shift(1)
    for window in ROLLING_WINDOWS:
        data[f"rolling_mean_{window}"] = history.rolling(window=window, min_periods=window).mean()
        if window in (7, 28):
            data[f"rolling_std_{window}"] = history.rolling(window=window, min_periods=window).std().fillna(0)
    
    # 3. Calendar & Date features
    data["year"] = data["date"].dt.year
    data["month"] = data["date"].dt.month
    data["day"] = data["date"].dt.day
    data["day_of_week"] = data["date"].dt.dayofweek
    data["day_of_year"] = data["date"].dt.dayofyear
    data["quarter"] = data["date"].dt.quarter
    data["is_weekend"] = data["day_of_week"].isin([5, 6]).astype(int)
    data["covid_flag"] = data["covid_flag"].astype(int)
    
    # 4. Categorical Encoding
    cat_columns = ["medicine", "country", "region", "category", "age_group"]
    encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    data[cat_columns] = encoder.fit_transform(data[cat_columns])
    
    feature_columns = [
        "medicine", "country", "region", "category", "age_group",
        "year", "month", "day", "day_of_week", "day_of_year", "quarter", "is_weekend",
        "lag_1", "lag_7", "lag_14", "lag_28",
        "rolling_mean_7", "rolling_mean_14", "rolling_mean_28",
        "rolling_std_7", "rolling_std_28",
        "unit_price", "stock_level", "expiry_days_remaining", "covid_flag"
    ]
    
    clean_data = data.dropna().reset_index(drop=True)
    return clean_data, feature_columns, encoder


def evaluate_forecast(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    """Calculate MAE, RMSE, WAPE, and R²."""
    y_pred_clipped = np.clip(y_pred, a_min=0, a_max=None)
    mae = float(mean_absolute_error(y_true, y_pred_clipped))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred_clipped)))
    sum_true = float(np.sum(y_true))
    wape = float(np.sum(np.abs(y_true - y_pred_clipped)) / sum_true * 100) if sum_true > 0 else 0.0
    r2 = float(r2_score(y_true, y_pred_clipped))
    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "wape_pct": round(wape, 2),
        "r2": round(r2, 4),
    }


def main():
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    print("=" * 60)
    print(" STOCKUP AI — DAILY DEMAND FORECASTING MODEL TRAINING ")
    print("=" * 60)
    
    print("\n[1] Extracting data from PostgreSQL (daily_sales table)...")
    raw_df = load_data_from_postgres()
    print(f"    Loaded {len(raw_df):,} records.")
    
    print("\n[2] Running data quality check...")
    quality_report = validate_data_quality(raw_df)
    print(f"    Total rows: {quality_report['total_rows']:,}")
    print(f"    Date range: {quality_report['min_date']} to {quality_report['max_date']}")
    print(f"    Medicines ({quality_report['distinct_medicines_count']}): {', '.join(quality_report['medicines'][:5])}...")
    print(f"    Countries ({quality_report['distinct_countries_count']}), Regions ({quality_report['distinct_regions_count']})")
    
    print("\n[3] Generating past-only features (zero target leakage)...")
    df_clean, feature_cols, encoder = build_past_only_features(raw_df)
    print(f"    Usable supervised samples: {len(df_clean):,}")
    print(f"    Feature count: {len(feature_cols)}")
    
    # Chronological Split: 2020-2024 Train, 2025 Test holdout
    train_mask = df_clean["year"] < 2025
    test_mask = df_clean["year"] == 2025
    
    train_df = df_clean[train_mask]
    test_df = df_clean[test_mask]
    
    x_train, y_train = train_df[feature_cols], train_df["units_sold"].values
    x_test, y_test = test_df[feature_cols], test_df["units_sold"].values
    
    print(f"\n[4] Chronological Split:")
    print(f"    Training set: {len(train_df):,} rows ({train_df['date'].min().date()} to {train_df['date'].max().date()})")
    print(f"    Testing set:  {len(test_df):,} rows ({test_df['date'].min().date()} to {test_df['date'].max().date()})")
    
    print("\n[5] Calculating Baselines on Test Set (2025 holdout)...")
    # Baseline 1: Naive Previous Day (lag_1)
    baseline_naive = evaluate_forecast(y_test, test_df["lag_1"].values)
    # Baseline 2: 7-Day Moving Average (rolling_mean_7)
    baseline_ma7 = evaluate_forecast(y_test, test_df["rolling_mean_7"].values)
    
    print(f"    Baseline 1 (Naive Previous Day): MAE={baseline_naive['mae']}, RMSE={baseline_naive['rmse']}, WAPE={baseline_naive['wape_pct']}%")
    print(f"    Baseline 2 (7-Day Moving Avg):   MAE={baseline_ma7['mae']}, RMSE={baseline_ma7['rmse']}, WAPE={baseline_ma7['wape_pct']}%")
    
    print("\n[6] Training ML Demand Forecasting Model (HistGradientBoosting / RandomForest)...")
    model = HistGradientBoostingRegressor(
        max_iter=250,
        learning_rate=0.08,
        min_samples_leaf=20,
        random_state=RANDOM_STATE,
    )
    model.fit(x_train, y_train)
    
    print("\n[7] Evaluating ML Model on 2025 holdout set...")
    test_preds = model.predict(x_test)
    ml_metrics = evaluate_forecast(y_test, test_preds)
    
    improvement_vs_naive_mae = round((baseline_naive["mae"] - ml_metrics["mae"]) / baseline_naive["mae"] * 100, 2)
    improvement_vs_ma7_mae = round((baseline_ma7["mae"] - ml_metrics["mae"]) / baseline_ma7["mae"] * 100, 2)
    
    print(f"    ML Model (HistGradientBoosting):")
    print(f"    -> MAE:      {ml_metrics['mae']}")
    print(f"    -> RMSE:     {ml_metrics['rmse']}")
    print(f"    -> WAPE:     {ml_metrics['wape_pct']}%")
    print(f"    -> R² Score: {ml_metrics['r2']}")
    print(f"    -> MAE Improvement vs Naive:  {improvement_vs_naive_mae}%")
    print(f"    -> MAE Improvement vs 7-d MA: {improvement_vs_ma7_mae}%")
    
    print("\n[8] Saving Model, Preprocessor, and Metadata Artifacts...")
    model_artifact = {
        "model": model,
        "feature_columns": feature_cols,
        "categorical_columns": ["medicine", "country", "region", "category", "age_group"],
        "lags": list(LAGS),
        "rolling_windows": list(ROLLING_WINDOWS),
        "model_type": "HistGradientBoostingRegressor",
        "version": "1.0",
    }
    joblib.dump(model_artifact, MODEL_PATH)
    joblib.dump(encoder, PREPROCESSOR_PATH)
    
    metadata = {
        "model_name": "DailyDemandForecastingModel",
        "version": "1.0",
        "model_type": "HistGradientBoostingRegressor",
        "source": "PostgreSQL daily_sales",
        "total_records": quality_report["total_rows"],
        "training_records": len(train_df),
        "test_records": len(test_df),
        "training_date_range": [str(train_df["date"].min().date()), str(train_df["date"].max().date())],
        "test_date_range": [str(test_df["date"].min().date()), str(test_df["date"].max().date())],
        "feature_count": len(feature_cols),
        "features": feature_cols,
        "target": "units_sold",
        "split_strategy": "Chronological (2020-2024 Train, 2025 Test holdout)",
        "leakage_prevention": "Strict shift(1) before all lag and rolling calculations",
        "metrics": {
            "ml_model": ml_metrics,
            "baseline_naive_previous_day": baseline_naive,
            "baseline_7_day_moving_average": baseline_ma7,
            "mae_improvement_vs_naive_pct": improvement_vs_naive_mae,
            "mae_improvement_vs_7day_ma_pct": improvement_vs_ma7_mae,
        },
        "supported_medicines": quality_report["medicines"],
        "supported_countries": quality_report["countries"],
        "supported_regions": quality_report["regions"],
        "supported_categories": quality_report["categories"],
    }
    
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"    Saved model to:        {MODEL_PATH}")
    print(f"    Saved preprocessor to: {PREPROCESSOR_PATH}")
    print(f"    Saved metadata to:     {METADATA_PATH}")
    print("\n" + "=" * 60)
    print(" DAILY DEMAND MODEL TRAINING COMPLETED SUCCESSFULLY! ")
    print("=" * 60)


if __name__ == "__main__":
    main()
