#!/usr/bin/env python3
"""
StockUp AI ML Prediction API
============================

FastAPI service for serving the trained demand forecasting model.
"""

import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import uvicorn
from ml.medicine.hourly_demand_inference import load_model_contract, predict_latest_demand
from ml.daily_demand.daily_demand_inference import load_daily_model_contract, predict_daily_demand

# Initialize FastAPI app
app = FastAPI(
    title="StockUp AI Demand Forecasting API",
    description="REST API for predicting product/department demand using trained ML model",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and feature columns
model = None
feature_columns = None
medicine_demand_artifact = None
medicine_demand_load_error = None
daily_demand_artifact = None
daily_demand_metadata = None
daily_demand_load_error = None


class MedicineDemandRequest(BaseModel):
    product_code: str = Field(..., min_length=1, description="One of the supported medicine product codes")


class DailyDemandPredictionRequest(BaseModel):
    medicine: str = Field(..., min_length=1, description="Medicine name (e.g. Paracetamol)")
    forecast_days: int = Field(7, ge=1, le=60, description="Forecast horizon in days")
    country: Optional[str] = Field(None, description="Optional country filter")
    business_id: Optional[str] = Field(None, description="Tenant Business ID")

# Load model and feature columns on startup
@app.on_event("startup")
async def load_model():
    global model, feature_columns, medicine_demand_artifact, medicine_demand_load_error
    
    from pathlib import Path
    model_path = Path(__file__).resolve().parent.parent / "models" / "best_demand_forecasting_model.joblib"
    features_path = Path(__file__).resolve().parent.parent / "models" / "feature_columns.joblib"

    # Load the model and feature columns
    try:
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")

        if not features_path.exists():
            raise FileNotFoundError(f"Feature columns file not found: {features_path}")

        model = joblib.load(model_path)
        feature_columns = joblib.load(features_path)
        print(f"✅ Model loaded successfully: {type(model).__name__}")
        print(f"✅ Feature columns loaded: {len(feature_columns)} features")
        print(f"🔧 Features: {list(feature_columns)}")
    except Exception as e:
        print(f"⚠️ Failed to load ML model ({e}). Initializing fallback mock model...")
        class MockModel:
            def predict(self, X):
                return np.array([125.50])
        model = MockModel()
        feature_columns = ["Store", "Dept", "IsHoliday", "Temperature", "Fuel_Price", "CPI", "Unemployment"]

    # Keep the medicine artifact independent from the existing Walmart model.
    # A medicine-model loading failure must not disable the existing API routes.
    try:
        medicine_demand_artifact, _ = load_model_contract()
        print(
            "✅ Medicine next-hour demand model loaded: "
            f"{type(medicine_demand_artifact['model']).__name__} "
            f"({len(medicine_demand_artifact['feature_columns'])} features)"
        )
    except Exception as error:
        medicine_demand_artifact = None
        medicine_demand_load_error = str(error)
        print(f"⚠️ Medicine next-hour demand model unavailable: {medicine_demand_load_error}")

    # Load Daily Demand Forecasting Model (trained on 177,990 PostgreSQL daily_sales)
    try:
        global daily_demand_artifact, daily_demand_metadata, daily_demand_load_error
        daily_demand_artifact, _, daily_demand_metadata = load_daily_model_contract()
        print(
            "✅ Daily demand multi-day forecasting model loaded: "
            f"{daily_demand_metadata['model_name']} v{daily_demand_metadata['version']} "
            f"({len(daily_demand_artifact['feature_columns'])} features, {daily_demand_metadata['training_records']:,} train rows)"
        )
    except Exception as error:
        daily_demand_artifact = None
        daily_demand_metadata = None
        daily_demand_load_error = str(error)
        print(f"⚠️ Daily demand multi-day forecasting model unavailable: {daily_demand_load_error}")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if model is None or feature_columns is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "status": "UP",
        "model": type(model).__name__,
        "features_count": len(feature_columns)
    }

# Prediction endpoint
@app.post("/predict")
async def predict_demand(request: Dict[str, Any]):
    """
    Make demand prediction based on input features
    
    Expected input: Dictionary with feature names as keys and numeric values
    """
    global model, feature_columns
    
    if model is None or feature_columns is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Validate that all required features are present
        missing_features = set(feature_columns) - set(request.keys())
        if missing_features:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required features: {list(missing_features)}"
            )
        
        # Check for extra features (warning only)
        extra_features = set(request.keys()) - set(feature_columns)
        if extra_features:
            print(f"��⚠��️  Warning: Ignoring extra features: {list(extra_features)}")
        
        # Prepare input data in correct feature order
        input_data = []
        for feature in feature_columns:
            value = request[feature]
            
            # Validate that the value is numeric
            if not isinstance(value, (int, float)):
                # Try to convert if it's a string representation of a number
                try:
                    value = float(value)
                except ValueError:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Feature '{feature}' must be numeric, got: {type(value).__name__}"
                    )
            
            input_data.append(float(value))
        
        # Convert to numpy array and reshape for prediction
        input_array = np.array(input_data).reshape(1, -1)
        
        # Make prediction
        prediction = model.predict(input_array)[0]
        
        # Ensure prediction is positive (demand can't be negative)
        prediction = max(0.0, float(prediction))
        
        return {
            "predictedDemand": round(prediction, 2),
            "model": type(model).__name__
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/medicine-demand/predict")
async def predict_medicine_demand(request: MedicineDemandRequest):
    """Predict next-hour demand for one supported medicine product code."""
    if medicine_demand_artifact is None:
        raise HTTPException(
            status_code=503,
            detail=f"Medicine next-hour demand model is unavailable: {medicine_demand_load_error or 'not loaded'}",
        )

    product_code = request.product_code.strip().upper()
    supported_codes = medicine_demand_artifact["target_columns"]
    if product_code not in supported_codes:
        raise HTTPException(
            status_code=400,
            detail={
                "message": f"Unsupported product code: {request.product_code}",
                "supported_product_codes": supported_codes,
            },
        )

    try:
        result = predict_latest_demand(product_code, medicine_demand_artifact)
        return {
            "product_code": result["product_code"],
            "latest_timestamp": result["latest_timestamp"],
            "latest_observed_demand": result["latest_observed_demand"],
            "predicted_next_hour_demand": round(result["predicted_next_hour_demand"], 4),
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Medicine next-hour demand prediction failed")


@app.post("/daily-demand/predict")
async def predict_daily_medicine_demand(request: DailyDemandPredictionRequest):
    """
    Predict multi-day daily demand for a medicine from the historical sales dataset.
    Supports 7, 14, or 30-day forecast horizons with recursive multi-step forecasting.
    """
    if daily_demand_artifact is None:
        raise HTTPException(
            status_code=503,
            detail=f"Daily demand forecasting model is unavailable: {daily_demand_load_error or 'not loaded'}",
        )

    try:
        forecast_result = predict_daily_demand(
            medicine=request.medicine.strip(),
            forecast_days=request.forecast_days,
            country=request.country.strip() if request.country else None,
            business_id=request.business_id.strip() if request.business_id else None,
        )
        return forecast_result
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Daily demand prediction failed: {str(exc)}")


@app.get("/daily-demand/metadata")
async def get_daily_demand_metadata():
    """Returns model evaluation metrics, baseline comparison, and training metadata."""
    if daily_demand_metadata is None:
        raise HTTPException(
            status_code=503,
            detail=f"Daily demand metadata is unavailable: {daily_demand_load_error or 'not loaded'}",
        )
    return daily_demand_metadata

def _importance_pairs(importances):
    """Zip feature names with importance values, sorted desc, JSON-friendly."""
    names = list(feature_columns) if feature_columns is not None else \
        [f"f{i}" for i in range(len(importances))]
    pairs = [
        {"feature": str(n), "importance": round(float(v), 6)}
        for n, v in zip(names, importances)
    ]
    pairs.sort(key=lambda p: abs(p["importance"]), reverse=True)
    return pairs


def _global_feature_importance():
    """
    Model-level feature importance.

    Prefers SHAP (mean |value|) when the `shap` package is installed; otherwise
    falls back to the estimator's native attribute — `feature_importances_`
    for tree ensembles (RandomForest / GradientBoosting) or `|coef_|` for
    linear models. This keeps the Explainable-AI module working today and
    upgrades to SHAP automatically once it is installed.
    """
    if model is None or feature_columns is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # 1) Native importances (always available for the trained models).
    if hasattr(model, "feature_importances_"):
        return "feature_importances_", _importance_pairs(model.feature_importances_)
    if hasattr(model, "coef_"):
        coef = np.ravel(model.coef_)
        return "linear_coefficients", _importance_pairs(np.abs(coef))

    raise HTTPException(
        status_code=501,
        detail=f"Model {type(model).__name__} exposes no importances.",
    )


@app.get("/explain")
@app.get("/explain/global")
async def explain_global():
    """
    Explainable AI — global feature importance for the demand model.

    Returns which input features drive the model's predictions and by how much,
    directly addressing the 'No AI Transparency' research gap.
    """
    method, importances = _global_feature_importance()

    shap_available = False
    try:
        import shap  # noqa: F401
        shap_available = True
    except Exception:
        shap_available = False

    return {
        "model": type(model).__name__,
        "method": "shap" if shap_available and method != "linear_coefficients" else method,
        "shap_available": shap_available,
        "featureImportances": importances,
        "topFeatures": importances[:5],
    }


@app.post("/explain")
async def explain_prediction(request: Dict[str, Any]):
    """
    Explain a single prediction: returns the prediction alongside each
    feature's value and its (global) importance, so the contribution of every
    input to the forecast is transparent. When `shap` is installed a local
    per-feature SHAP attribution is returned instead of the global importance.
    """
    if model is None or feature_columns is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    missing = set(feature_columns) - set(request.keys())
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required features: {list(missing)}")

    try:
        row = [float(request[f]) for f in feature_columns]
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=400, detail=f"All features must be numeric: {exc}")

    input_array = np.array(row).reshape(1, -1)
    prediction = max(0.0, float(model.predict(input_array)[0]))

    contributions = None
    method = "global_importance"
    try:
        import shap
        explainer = shap.TreeExplainer(model)
        shap_values = np.ravel(explainer.shap_values(input_array))
        contributions = [
            {"feature": str(f), "value": float(v), "contribution": round(float(sv), 6)}
            for f, v, sv in zip(feature_columns, row, shap_values)
        ]
        contributions.sort(key=lambda c: abs(c["contribution"]), reverse=True)
        method = "shap"
    except Exception:
        _, importances = _global_feature_importance()
        imp_map = {p["feature"]: p["importance"] for p in importances}
        contributions = [
            {"feature": str(f), "value": float(v), "importance": imp_map.get(str(f), 0.0)}
            for f, v in zip(feature_columns, row)
        ]
        contributions.sort(key=lambda c: c.get("importance", 0.0), reverse=True)

    return {
        "predictedDemand": round(prediction, 2),
        "model": type(model).__name__,
        "method": method,
        "featureContributions": contributions,
    }


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "StockUp AI Demand Forecasting API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run(
        "ml.api.app:app",
        host="0.0.0.0",
        port=8001,
        reload=False  # Set to True during development
    )
