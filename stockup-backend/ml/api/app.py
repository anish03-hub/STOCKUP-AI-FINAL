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
from typing import Dict, Any
import uvicorn
from ml.medicine.hourly_demand_inference import load_model_contract, predict_latest_demand

# Initialize FastAPI app
app = FastAPI(
    title="StockUp AI Demand Forecasting API",
    description="REST API for predicting product/department demand using trained ML model",
    version="1.0.0"
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


class MedicineDemandRequest(BaseModel):
    product_code: str = Field(..., min_length=1, description="One of the supported medicine product codes")

# Load model and feature columns on startup
@app.on_event("startup")
async def load_model():
    global model, feature_columns, medicine_demand_artifact, medicine_demand_load_error
    
    from pathlib import Path
    model_path = Path(__file__).resolve().parent.parent / "models" / "best_demand_forecasting_model.joblib"
    features_path = Path(__file__).resolve().parent.parent / "models" / "feature_columns.joblib"

    # Check if files exist
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")

    if not features_path.exists():
        raise FileNotFoundError(f"Feature columns file not found: {features_path}")

    # Load the model and feature columns
    model = joblib.load(model_path)
    feature_columns = joblib.load(features_path)
    
    print(f"��✅ Model loaded successfully: {type(model).__name__}")
    print(f"��✅ Feature columns loaded: {len(feature_columns)} features")
    print(f"���🔧 Features: {list(feature_columns)}")

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
