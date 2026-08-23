#!/usr/bin/env python3
"""
Combined Medicine Dataset Display and Search Script for StockUp AI
First displays the complete pharmacy inventory dataset as a formatted table, then enables medicine search with AI price prediction.
"""

import os
import pandas as pd
import numpy as np
import joblib
from datetime import datetime

def print_header():
    """Print the header for the medicine display."""
    print("=" * 80)
    print(" " * 24 + "STOCKUP AI - PHARMACY INVENTORY")
    print("=" * 80)

def print_search_header():
    """Print the header for the medicine search section."""
    print("=" * 80)
    print(" " * 18 + "STOCKUP AI - MEDICINE SEARCH")
    print("=" * 80)

def truncate_text(text, width):
    """Truncate text to specified width and add ellipsis if needed."""
    if pd.isna(text) or text is None:
        return "N/A"
    text = str(text)
    if len(text) <= width:
        return text
    return text[:width-1] + "…"

def format_price(price):
    """Format price as ₹ followed by integer value."""
    if pd.isna(price):
        return "N/A"
    try:
        return f"���₹{int(price)}"
    except (ValueError, TypeError):
        return "N/A"

def format_expiry(expiry):
    """Format expiry date or show N/A if missing."""
    if pd.isna(expiry) or expiry is None:
        return "N/A"
    expiry_str = str(expiry).strip()
    if expiry_str.lower() in ['nan', 'nat', 'none', '']:
        return "N/A"
    return expiry_str

def print_table_header(widths, headers):
    """Print table header with borders."""
    # Top border
    border = "+" + "+".join(["-" * (w + 2) for w in widths]) + "+"
    print(border)

    # Header row
    header_row = "|"
    for header, w in zip(headers, widths):
        header_row += f" {header:<{w}} |"
    print(header_row)

    # Separator
    print(border)

def print_table_row(values, widths):
    """Print a table row with borders."""
    row = "|"
    for value, w in zip(values, widths):
        row += f" {value:<{w}} |"
    print(row)

def print_table_footer(widths):
    """Print table footer with borders."""
    border = "+" + "+".join(["-" * (w + 2) for w in widths]) + "+"
    print(border)

def print_complete_dataset(df):
    """Print the complete dataset as a formatted table."""
    print("\nCOMPLETE DATASET (ALL RECORDS):")
    print("-" * 40)

    # Define column specifications for full table (with ID)
    headers = ["ID", "Medicine Name", "Category", "Manufacturer", "Price", "Expiry", "Quantity"]
    widths = [4, 40, 22, 25, 8, 12, 9]  # ID, Medicine Name, Category, Manufacturer, Price, Expiry, Quantity

    # Print table header
    print_table_header(widths, headers)

    # Print each row
    for idx, row in df.iterrows():
        # Prepare values for each column
        values = [
            str(idx + 1),  # ID (1-indexed)
            truncate_text(row['Medicine_Name'], 40),
            truncate_text(row['Category'], 22),
            truncate_text(row['Manufacturer'] if pd.notna(row['Manufacturer']) else "N/A", 25),
            format_price(row['Medicine_Price']),
            format_expiry(row['Expiry_Date']),
            str(int(row['Quantity'])) if pd.notna(row['Quantity']) else "N/A"
        ]
        print_table_row(values, widths)

    # Print table footer
    print_table_footer(widths)

def print_dataset_info(df):
    """Print dataset information."""
    print("\n" + "=" * 80)
    print("DATASET INFORMATION")
    print("=" * 80)
    print(f"Total Records : {df.shape[0]}")
    print(f"Total Columns : {df.shape[1]}")

    print("\nCOLUMN NAMES")
    print("-" * 15)
    for col in df.columns:
        print(col)

    print("\nMISSING VALUES")
    print("-" * 16)
    missing = df.isnull().sum()
    if missing.any():
        for col, count in missing.items():
            if count > 0:
                print(f"{col} : {count}")
    else:
        print("No missing values")

def load_ai_model():
    """Load the trained AI model and preprocessing objects."""
    model_path = "ml/medicine/models/pharmacy_price_predictor.joblib"
    encoders_path = "ml/medicine/models/pharmacy_label_encoders.joblib"
    feature_info_path = "ml/medicine/models/pharmacy_feature_info.joblib"

    if not all(os.path.exists(p) for p in [model_path, encoders_path, feature_info_path]):
        print("ERROR: AI model files not found. Please train the model first.")
        print("Run: python ml/medicine/scripts/train_pharmacy_model.py")
        return None, None, None

    try:
        model = joblib.load(model_path)
        encoders = joblib.load(encoders_path)
        feature_info = joblib.load(feature_info_path)
        return model, encoders, feature_info
    except Exception as e:
        print(f"ERROR loading AI model: {e}")
        return None, None, None

def print_model_loaded():
    """Print AI model loaded banner."""
    print("\n" + "=" * 80)
    print("              AI MODEL LOADED")
    print("=" * 80)
    print("Model: Random Forest Regressor")
    print("Purpose: Medicine Price Prediction")
    print("=" * 80)

def preprocess_for_prediction(df_row, encoders, feature_info):
    """Preprocess a single row for prediction using the same logic as training."""
    # Make a copy to avoid modifying original
    df = df_row.copy()

    # Handle missing values for categorical columns
    categorical_cols = ['Category', 'Manufacturer', 'Medicine_Name']
    for col in categorical_cols:
        if col in df.columns:
            df[col] = df[col].fillna('Unknown')

    # Handle Expiry_Date: convert to datetime, fill missing with future date, compute days until expiry
    if 'Expiry_Date' in df.columns:
        # Convert to datetime, errors='coerce' will turn invalid to NaT
        df['Expiry_Date'] = pd.to_datetime(df['Expiry_Date'], errors='coerce')
        # Fill missing with a date far in the future (e.g., 2030-12-31)
        future_date = pd.Timestamp('2030-12-31')
        df['Expiry_Date'] = df['Expiry_Date'].fillna(future_date)
        # Calculate days until expiry from reference date: 2023-01-01
        ref_date = pd.Timestamp('2023-01-01')
        df['Days_To_Expiry'] = (df['Expiry_Date'] - ref_date).dt.days
        # Drop the original Expiry_Date column
        df = df.drop(columns=['Expiry_Date'])

    # Ensure Medicine_Name is filled (if not already handled)
    if 'Medicine_Name' in df.columns:
        df['Medicine_Name'] = df['Medicine_Name'].fillna('Unknown')

    # Encode categorical variables using the loaded label encoders
    label_encoders = encoders
    categorical_features = ['Category', 'Manufacturer', 'Medicine_Name']
    for col in categorical_features:
        if col in df.columns and col in label_encoders:
            # Transform using the fitted encoder
            try:
                df[col] = label_encoders[col].transform(df[col].astype(str))
            except ValueError:
                # Handle unseen labels by mapping to a known class (e.g., first class)
                # For simplicity, we'll map to the first class of the encoder
                df[col] = 0  # Assuming first class is index 0; safer would be to check encoder classes_

    # Get the feature columns in the exact order used during training
    # feature_info is expected to have a key 'feature_columns' (list)
    if feature_info and 'feature_columns' in feature_info:
        ordered_features = feature_info['feature_columns']
    else:
        # Fallback: derive from processed dataframe excluding target
        target_col = 'Medicine_Price'
        ordered_features = [col for col in df.columns if col != target_col]

    # Ensure we have all required features; if any missing, add with default values
    for feat in ordered_features:
        if feat not in df.columns:
            # Default values: 0 for numeric, 'Unknown' for categorical? but we already encoded.
            # Since we already encoded categoricals, missing ones would be numeric features like Quantity or Days_To_Expiry.
            df[feat] = 0

    # Select and order features exactly as used in training
    X = df[ordered_features].copy()

    return X

def print_prediction_result(actual_price, predicted_price):
    """Print AI price prediction result."""
    print("\n" + "=" * 80)
    print("                 AI PRICE PREDICTION")
    print("=" * 80)
    print(f"Model          : Random Forest Regressor")
    print(f"Actual Price   : {format_price(actual_price)}")
    print(f"Predicted Price: {format_price(predicted_price)}")
    print("=" * 80)

def print_prediction_explanation():
    """Print explanation of the prediction."""
    print("\nPrediction generated by the trained Random Forest model using")
    print("the medicine's actual dataset attributes.")
    print("")
    print("Target:")
    print("Medicine_Price")
    print("")
    print("Features:")
    print("Medicine_Name")
    print("Category")
    print("Manufacturer")
    print("Quantity")
    print("Days_To_Expiry")
    print("")
    print("IMPORTANT: This is PRICE prediction, not demand or stock prediction.")

def print_search_results(results_df):
    """Print search results in table format."""
    print("\n" + "=" * 80)
    print("SEARCH RESULT")
    print("=" * 80)

    # Define column specifications for search table (without ID)
    headers = ["Medicine Name", "Category", "Manufacturer", "Price", "Expiry", "Quantity"]
    widths = [40, 22, 25, 8, 12, 9]  # Medicine Name, Category, Manufacturer, Price, Expiry, Quantity

    # Print table header
    print_table_header(widths, headers)

    # Print each row
    for _, row in results_df.iterrows():
        values = [
            truncate_text(row['Medicine_Name'], 40),
            truncate_text(row['Category'], 22),
            truncate_text(row['Manufacturer'] if pd.notna(row['Manufacturer']) else "N/A", 25),
            format_price(row['Medicine_Price']),
            format_expiry(row['Expiry_Date']),
            str(int(row['Quantity'])) if pd.notna(row['Quantity']) else "N/A"
        ]
        print_table_row(values, widths)

    # Print table footer
    print_table_footer(widths)

def print_no_results(search_term):
    """Print message when no medicine is found in table format."""
    print("\n" + "=" * 80)
    print("NO MEDICINE FOUND")
    print("=" * 80)

    # Define column specifications for search table (without ID)
    headers = ["Medicine Name", "Category", "Manufacturer", "Price", "Expiry", "Quantity"]
    widths = [40, 22, 25, 8, 12, 9]

    # Print table header
    print_table_header(widths, headers)

    # Print message row spanning all columns
    message = f'No medicine matching "{search_term}" was found.'
    # We'll create a row with the message centered in the total width
    total_width = sum(widths) + len(widths) * 3  # Each column has 2 spaces and 1 border on each side? Actually, our format adds 2 spaces per column
    print("|" + "-" * (total_width + 1) + "|")  # Top border of the message cell
    print("|" + f" {message:<{total_width}} " + "|")  # Message
    print("|" + "-" * (total_width + 1) + "|")  # Bottom border of the message cell

    # Print table footer
    print_table_footer(widths)

def main():
    """Main function - first display dataset, then enable search with AI prediction."""
    print_header()

    # Load the pharmacy inventory CSV
    csv_path = "ml/medicine/data/pharmacy_inventory.csv"

    if not os.path.exists(csv_path):
        print(f"ERROR: Dataset not found at {csv_path}")
        print("Please run the extraction script first:")
        print("  python ml/medicine/scripts/extract_pharmacy_data.py")
        return

    df = pd.read_csv(csv_path)

    # Ensure required columns exist
    required_columns = ['Medicine_Name', 'Category', 'Manufacturer', 'Medicine_Price', 'Expiry_Date', 'Quantity']
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        print(f"ERROR: Missing columns in dataset: {missing_columns}")
        return

    # STEP 1: DISPLAY COMPLETE DATASET
    print_complete_dataset(df)

    # STEP 2: DATASET INFORMATION
    print_dataset_info(df)

    # STEP 3: LOAD THE TRAINED AI MODEL
    model, encoders, feature_info = load_ai_model()
    if model is None:
        # If model not loaded, we can still search but without prediction
        print("\nWARNING: AI model not available. Running in search-only mode.")
    else:
        print_model_loaded()

    # STEP 4: MEDICINE SEARCH WITH AI PREDICTION
    print_search_header()

    while True:
        # Get search term from user
        print("\nEnter medicine name to search:")
        search_term = input().strip()

        if not search_term:
            print("Please enter a medicine name.")
            continue

        # Perform case-insensitive partial search
        mask = df['Medicine_Name'].str.lower().str.contains(search_term.lower(), na=False)
        results = df[mask]

        if len(results) == 0:
            print_no_results(search_term)
        else:
            # Display search result
            print_search_results(results)

            # If we have a model, perform prediction for the first matching medicine
            if model is not None and encoders is not None and feature_info is not None:
                # Take the first matching row
                medicine_row = results.iloc[[0]]  # DataFrame with one row

                # Preprocess for prediction
                try:
                    X_processed = preprocess_for_prediction(medicine_row, encoders, feature_info)
                    # Make prediction
                    predicted_price = model.predict(X_processed)[0]
                    actual_price = medicine_row['Medicine_Price'].iloc[0]

                    # Display prediction result
                    print_prediction_result(actual_price, predicted_price)
                    print_prediction_explanation()
                except Exception as e:
                    print(f"\nERROR during prediction: {e}")
                    print("Prediction could not be completed.")

        # Ask if user wants to search again
        print("\nSearch another medicine? (y/n):")
        choice = input().strip().lower()

        if choice != 'y' and choice != 'yes':
            break

    print("\n" + "=" * 80)
    print("           STOCKUP AI - DEMONSTRATION COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    main()