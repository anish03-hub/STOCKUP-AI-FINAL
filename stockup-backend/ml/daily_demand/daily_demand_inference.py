"""
StockUp AI — Daily Medicine Demand Inference Engine
===================================================

Performs recursive multi-step daily demand forecasting for any medicine in the historical dataset.
Uses past-only features (lags, rolling statistics, calendar properties) and propagates predictions
forward across the requested forecast horizon (7, 14, or 30 days).
"""

from __future__ import annotations
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
import pandas as pd
import psycopg2

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "daily_demand_model.joblib"
PREPROCESSOR_PATH = MODELS_DIR / "daily_demand_preprocessor.joblib"
METADATA_PATH = MODELS_DIR / "daily_demand_metadata.json"


def connect_postgres():
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME", "stockup_ai"),
        user=os.getenv("DB_USER", "anishkumarsah"),
        password=os.getenv("DB_PASSWORD", ""),
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
    )


def load_daily_model_contract() -> tuple[dict, Any, dict]:
    """Load the trained model artifact, ordinal encoder preprocessor, and metadata."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Daily demand model artifact not found: {MODEL_PATH}")
    if not PREPROCESSOR_PATH.exists():
        raise FileNotFoundError(f"Daily demand preprocessor not found: {PREPROCESSOR_PATH}")
    if not METADATA_PATH.exists():
        raise FileNotFoundError(f"Daily demand metadata not found: {METADATA_PATH}")

    artifact = joblib.load(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)
    return artifact, preprocessor, metadata


def fetch_medicine_recent_sales(medicine: str, country: Optional[str] = None, limit_days: int = 60, business_id: Optional[str] = None) -> pd.DataFrame:
    """Query recent daily sales observations from PostgreSQL."""
    conn = connect_postgres()
    params = [medicine]
    tenant_clause = ""
    if business_id:
        tenant_clause = "AND business_id = %s"
        params.append(business_id)

    country_clause = ""
    if country:
        country_clause = "AND country = %s"
        params.append(country)

    query = f"""
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
        WHERE LOWER(medicine) = LOWER(%s)
        {tenant_clause}
        {country_clause}
        ORDER BY date DESC
        LIMIT %s
    """
    params.append(limit_days * 10)  # Account for multi-row per date
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    return df


def predict_daily_demand(
    medicine: str,
    forecast_days: int = 7,
    country: Optional[str] = None,
    business_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate recursive multi-day demand predictions for a medicine.
    
    Args:
        medicine: Name of the medicine (e.g. 'Paracetamol')
        forecast_days: Number of days to forecast (e.g. 7, 14, 30)
        country: Optional country filter
        business_id: Optional business isolation id
    """
    artifact, preprocessor, metadata = load_daily_model_contract()
    model = artifact["model"]
    feature_cols = artifact["feature_columns"]
    cat_cols = artifact["categorical_columns"]
    
    # 1. Fetch recent history from PostgreSQL
    df_raw = fetch_medicine_recent_sales(medicine, country=country, limit_days=60, business_id=business_id)
    if df_raw.empty:
        # Check if the medicine exists at all in the database
        conn = connect_postgres()
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM daily_sales WHERE LOWER(medicine) = LOWER(%s)", (medicine,))
        exists_count = cur.fetchone()[0]
        conn.close()
        
        if exists_count == 0:
            raise ValueError(f"Medicine '{medicine}' not found in historical sales dataset.")
        else:
            return {
                "medicine": medicine,
                "hasHistoricalData": False,
                "message": f"No historical sales data available for company on medicine '{medicine}'.",
                "forecast": [],
            }

    df_raw["date"] = pd.to_datetime(df_raw["date"])
    
    # Aggregate daily observations for forecasting
    daily_history = (
        df_raw.groupby("date")
        .agg({
            "medicine": "first",
            "country": "first",
            "region": "first",
            "category": "first",
            "age_group": "first",
            "units_sold": "sum",
            "unit_price": "mean",
            "stock_level": "mean",
            "expiry_days_remaining": "mean",
            "covid_flag": "max",
        })
        .reset_index()
        .sort_values("date")
        .reset_index(drop=True)
    )

    if len(daily_history) < 28:
        raise ValueError(f"Insufficient history ({len(daily_history)} days) to construct 28-day lag features.")

    latest_date = daily_history["date"].max()
    historical_units = list(daily_history["units_sold"].values)
    latest_price = float(daily_history["unit_price"].iloc[-1])
    latest_stock = float(daily_history["stock_level"].iloc[-1])
    latest_expiry = float(daily_history["expiry_days_remaining"].iloc[-1])
    medicine_name = str(daily_history["medicine"].iloc[-1])
    country_name = str(daily_history["country"].iloc[-1])
    region_name = str(daily_history["region"].iloc[-1])
    category_name = str(daily_history["category"].iloc[-1])
    age_group_name = str(daily_history["age_group"].iloc[-1])

    forecast_points = []
    rmse = metadata["metrics"]["ml_model"]["rmse"]
    
    current_units_series = list(historical_units)
    
    # 2. Recursive Multi-step Daily Forecast
    for step in range(1, forecast_days + 1):
        target_date = latest_date + timedelta(days=step)
        
        # Calculate lag features from known + predicted history
        lag_1 = current_units_series[-1]
        lag_7 = current_units_series[-7] if len(current_units_series) >= 7 else current_units_series[-1]
        lag_14 = current_units_series[-14] if len(current_units_series) >= 14 else current_units_series[-1]
        lag_28 = current_units_series[-28] if len(current_units_series) >= 28 else current_units_series[-1]
        
        # Rolling statistics strictly from past
        rolling_7 = float(np.mean(current_units_series[-7:]))
        rolling_14 = float(np.mean(current_units_series[-14:]))
        rolling_28 = float(np.mean(current_units_series[-28:]))
        rolling_std_7 = float(np.std(current_units_series[-7:])) if len(current_units_series) >= 7 else 0.0
        rolling_std_28 = float(np.std(current_units_series[-28:])) if len(current_units_series) >= 28 else 0.0
        
        # Calendar properties
        year_val = target_date.year
        month_val = target_date.month
        day_val = target_date.day
        dow_val = target_date.weekday()
        doy_val = target_date.timetuple().tm_yday
        quarter_val = (month_val - 1) // 3 + 1
        is_weekend_val = 1 if dow_val in (5, 6) else 0
        covid_val = 0  # Future is post-covid baseline
        
        # Encode categoricals
        cat_df = pd.DataFrame([[medicine_name, country_name, region_name, category_name, age_group_name]], columns=cat_cols)
        cat_encoded = preprocessor.transform(cat_df)[0]
        
        feature_dict = {
            "medicine": cat_encoded[0],
            "country": cat_encoded[1],
            "region": cat_encoded[2],
            "category": cat_encoded[3],
            "age_group": cat_encoded[4],
            "year": year_val,
            "month": month_val,
            "day": day_val,
            "day_of_week": dow_val,
            "day_of_year": doy_val,
            "quarter": quarter_val,
            "is_weekend": is_weekend_val,
            "lag_1": lag_1,
            "lag_7": lag_7,
            "lag_14": lag_14,
            "lag_28": lag_28,
            "rolling_mean_7": rolling_7,
            "rolling_mean_14": rolling_14,
            "rolling_mean_28": rolling_28,
            "rolling_std_7": rolling_std_7,
            "rolling_std_28": rolling_std_28,
            "unit_price": latest_price,
            "stock_level": latest_stock,
            "expiry_days_remaining": max(0, latest_expiry - step),
            "covid_flag": covid_val,
        }
        
        row_vector = [feature_dict[col] for col in feature_cols]
        row_df = pd.DataFrame([row_vector], columns=feature_cols)
        pred_val = float(model.predict(row_df)[0])
        pred_val = max(0.0, round(pred_val, 2))
        
        # Uncertainty bounds expanding with horizon (sqrt(step) * rmse * 0.3)
        margin = round(rmse * 0.3 * np.sqrt(step), 2)
        lower_bound = max(0.0, round(pred_val - margin, 2))
        upper_bound = round(pred_val + margin, 2)
        
        forecast_points.append({
            "date": target_date.strftime("%Y-%m-%d"),
            "predictedDemand": pred_val,
            "lowerBound": lower_bound,
            "upperBound": upper_bound,
            "dayOfWeek": target_date.strftime("%A"),
            "isWeekend": bool(is_weekend_val),
        })
        
        # Append to recursive history
        current_units_series.append(pred_val)

    total_forecasted = round(sum(p["predictedDemand"] for p in forecast_points), 2)
    avg_daily_demand = round(total_forecasted / forecast_days, 2)
    
    return {
        "medicine": medicine_name,
        "hasHistoricalData": True,
        "category": category_name,
        "forecastHorizonDays": forecast_days,
        "latestHistoricalDate": latest_date.strftime("%Y-%m-%d"),
        "totalPredictedUnits": total_forecasted,
        "averageDailyDemand": avg_daily_demand,
        "model": metadata["model_name"],
        "modelVersion": metadata["version"],
        "modelType": metadata["model_type"],
        "metrics": metadata["metrics"]["ml_model"],
        "forecast": forecast_points,
    }
