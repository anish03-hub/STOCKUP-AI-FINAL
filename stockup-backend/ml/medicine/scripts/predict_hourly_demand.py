#!/usr/bin/env python3
"""Run standalone, past-only inference with the saved hourly demand v2 model.

Usage:
    python ml/medicine/scripts/predict_hourly_demand.py N02BE
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from hourly_demand_inference import load_model_contract, predict_latest_demand


def print_prediction(product_code: str, result: dict) -> None:
    """Display the selected product's real history-derived features and prediction."""
    print("=" * 60)
    print("       STOCKUP AI - MEDICINE DEMAND PREDICTION")
    print("=" * 60)
    print("\nPRODUCT")
    print("-" * 60)
    print(f"Product Code: {product_code}")
    print("\nLATEST HISTORICAL DATA")
    print("-" * 60)
    print(f"Latest Timestamp: {result['latest_timestamp'].replace('T', ' ')}")
    print(f"Latest Observed Demand: {result['latest_observed_demand']:.4f}")
    print("\nFEATURES USED")
    print("-" * 60)
    features = result["features"]
    print(f"Lag 1: {features[f'{product_code}_lag_1']:.4f}")
    print(f"Lag 2: {features[f'{product_code}_lag_2']:.4f}")
    print(f"Lag 24: {features[f'{product_code}_lag_24']:.4f}")
    print(f"Lag 168: {features[f'{product_code}_lag_168']:.4f}")
    print(f"Rolling 24h Mean: {features[f'{product_code}_rolling_mean_24']:.4f}")
    print(f"Rolling 24h Max: {features[f'{product_code}_rolling_max_24']:.4f}")
    print(f"Rolling 168h Mean: {features[f'{product_code}_rolling_mean_168']:.4f}")
    print("\nPREDICTION")
    print("-" * 60)
    print(f"Predicted Next-Hour Demand: {result['predicted_next_hour_demand']:.4f} units")
    print("\n" + "=" * 60)


def main() -> None:
    artifact, _ = load_model_contract()
    target_columns = artifact["target_columns"]
    parser = argparse.ArgumentParser(description="Predict next-hour demand from saved v2 model")
    parser.add_argument("product_code", choices=target_columns, help="Product code to display")
    args = parser.parse_args()

    result = predict_latest_demand(args.product_code, artifact)
    print_prediction(args.product_code, result)


if __name__ == "__main__":
    main()
