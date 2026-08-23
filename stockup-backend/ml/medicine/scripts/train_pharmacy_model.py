#!/usr/bin/env python3
"""
Pharmacy ML Training Script for StockUp AI
Trains a model to predict medicine price using real pharmacy inventory data.
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import warnings
warnings.filterwarnings('ignore')

def print_header():
    """Print the header for the pharmacy ML training."""
    print("=" * 60)
    print(" " * 16 + "STOCKUP AI - PHARMACY ML TRAINING")
    print("=" * 60)

def print_section(title):
    """Print a section header."""
    print(f"\n{title}")
    print("-" * len(title))

def main():
    """Main training function."""
    print_header()

    # Load dataset
    csv_path = "ml/medicine/data/pharmacy_inventory.csv"
    if not os.path.exists(csv_path):
        print(f"ERROR: Dataset not found at {csv_path}")
        print("Please run the extraction script first:")
        print("  python ml/medicine/scripts/extract_pharmacy_data.py")
        return

    df = pd.read_csv(csv_path)
    print_section("DATASET")
    print(f"Records: {df.shape[0]}")
    print(f"Columns: {df.shape[1]}")

    print_section("FIRST 10 RECORDS")
    print(df.head(10).to_string())

    print_section("DATA PREPROCESSING")

    # Make a copy for processing
    df_processed = df.copy()

    # Handle missing values
    # For categorical columns, fill missing with 'Unknown'
    categorical_cols = ['Category', 'Manufacturer']
    for col in categorical_cols:
        if col in df_processed.columns:
            missing_before = df_processed[col].isnull().sum()
            df_processed[col] = df_processed[col].fillna('Unknown')
            print(f"- {col}: filled {missing_before} missing values with 'Unknown'")

    # For Expiry_Date, we have missing values; we'll convert to datetime and extract features
    # For simplicity, we'll fill missing with a far future date and then extract days until expiry
    if 'Expiry_Date' in df_processed.columns:
        # Convert to datetime, errors='coerce' will turn invalid to NaT
        df_processed['Expiry_Date'] = pd.to_datetime(df_processed['Expiry_Date'], errors='coerce')
        missing_before = df_processed['Expiry_Date'].isnull().sum()
        # Fill missing with a date far in the future (e.g., 2030-12-31) so that days until expiry is large
        future_date = pd.Timestamp('2030-12-31')
        df_processed['Expiry_Date'] = df_processed['Expiry_Date'].fillna(future_date)
        # Calculate days until expiry from today (or a fixed reference date)
        # We'll use a fixed reference date to ensure reproducibility: 2023-01-01
        ref_date = pd.Timestamp('2023-01-01')
        df_processed['Days_To_Expiry'] = (df_processed['Expiry_Date'] - ref_date).dt.days
        # Drop the original Expiry_Date column as we have the derived feature
        df_processed = df_processed.drop(columns=['Expiry_Date'])
        print(f"- Expiry_Date: converted to days until expiry, filled {missing_before} missing with future date")

    # Medicine_Name: we'll keep as categorical and encode it
    if 'Medicine_Name' in df_processed.columns:
        missing_before = df_processed['Medicine_Name'].isnull().sum()
        df_processed['Medicine_Name'] = df_processed['Medicine_Name'].fillna('Unknown')
        print(f"- Medicine_Name: filled {missing_before} missing values with 'Unknown'")

    # Quantity: check if it has variance
    if 'Quantity' in df_processed.columns:
        unique_vals = df_processed['Quantity'].nunique()
        print(f"- Quantity: has {unique_vals} unique value(s) (all values: {df_processed['Quantity'].unique()})")
        # If only one unique value, it won't contribute to prediction but we'll keep it

    # Prepare features and target
    target_col = 'Medicine_Price'
    # Exclude target and any non-feature columns
    feature_cols = [col for col in df_processed.columns if col != target_col]

    print(f"- Target variable: {target_col}")
    print(f"- Features used: {feature_cols}")

    X = df_processed[feature_cols].copy()
    y = df_processed[target_col].copy()

    # Enode categorical variables
    label_encoders = {}
    categorical_features = ['Category', 'Manufacturer', 'Medicine_Name']
    for col in categorical_features:
        if col in X.columns:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            label_encoders[col] = le
            print(f"- Encoded {col} as numerical labels")

    print_section("TARGET")
    print(f"Medicine_Price")

    print_section("FEATURES")
    for col in feature_cols:
        print(f"{col}")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print_section("TRAIN / TEST SPLIT")
    print(f"Training set size: {X_train.shape}")
    print(f"Test set size: {X_test.shape}")

    print_section("MODEL TRAINING")
    print("Training Random Forest Regressor...")

    # Initialize and train model
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    print_section("EVALUATION")

    # Predict
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)

    # Calculate metrics
    train_mae = mean_absolute_error(y_train, y_pred_train)
    test_mae = mean_absolute_error(y_test, y_pred_test)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    train_r2 = r2_score(y_train, y_pred_train)
    test_r2 = r2_score(y_test, y_pred_test)

    print(f"Training Metrics:")
    print(f"  MAE:  {train_mae:.2f}")
    print(f"  RMSE: {train_rmse:.2f}")
    print(f"  R²:   {train_r2:.4f}")

    print(f"Test Metrics:")
    print(f"  MAE:  {test_mae:.2f}")
    print(f"  RMSE: {test_rmse:.2f}")
    print(f"  R²:   {test_r2:.4f}")

    # Feature importance
    if hasattr(model, 'feature_importances_'):
        print("\nFeature Importances:")
        feature_importance = pd.DataFrame({
            'feature': feature_cols,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)
        print(feature_importance.to_string(index=False))

    print_section("MODEL SAVED")

    # Ensure models directory exists
    os.makedirs("ml/medicine/models", exist_ok=True)

    # Save model and preprocessing components
    model_path = "ml/medicine/models/pharmacy_price_predictor.joblib"
    encoders_path = "ml/medicine/models/pharmacy_label_encoders.joblib"
    feature_info_path = "ml/medicine/models/pharmacy_feature_info.joblib"

    joblib.dump(model, model_path)
    joblib.dump(label_encoders, encoders_path)

    feature_info = {
        'feature_columns': feature_cols,
        'target_column': target_col,
        'preprocessing_info': {
            'missing_value_handling': {
                'Category': 'Filled missing with \"Unknown\"',
                'Manufacturer': 'Filled missing with \"Unknown\"',
                'Medicine_Name': 'Filled missing with \"Unknown\"',
                'Expiry_Date': 'Converted to days until expiry from 2023-01-01, missing filled with future date'
            },
            'encoding': 'Label encoding for categorical variables (Category, Manufacturer, Medicine_Name)',
            'notes': 'Quantity column has zero variance (all values=100) but retained'
        }
    }
    joblib.dump(feature_info, feature_info_path)

    print(f"Model saved to: {model_path}")
    print(f"Encoders saved to: {encoders_path}")
    print(f"Feature info saved to: {feature_info_path}")

    print("\n" + "=" * 60)
    print(" " * 14 + "PHARMACY ML TRAINING COMPLETED")
    print("=" * 60)

    # Important disclaimer
    print("\nIMPORTANT NOTE ABOUT THIS MODEL:")
    print("- This model predicts medicine PRICE based on other medicine attributes")
    print("- It does NOT predict medicine demand, sales, or stock levels")
    print("- The target variable is: Medicine_Price (actual price from inventory)")
    print("- The features used are: Category, Manufacturer, Medicine_Name, Quantity, and derived Expiry_Date features")
    print("- This is a legitimate supervised learning task supported by the dataset")
    print("- The dataset does NOT contain historical sales or demand data, so demand prediction is not possible")

if __name__ == "__main__":
    main()