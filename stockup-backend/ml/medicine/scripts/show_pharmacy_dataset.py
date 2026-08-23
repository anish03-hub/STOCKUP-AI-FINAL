#!/usr/bin/env python3
"""
Pharmacy Inventory Dataset Inspection Script for StockUp AI
Loads the real pharmacy inventory dataset and displays it in the terminal.
"""

import os
import pandas as pd
import numpy as np

def print_header():
    """Print the header for the pharmacy inventory display."""
    print("=" * 80)
    print(" " * 24 + "STOCKUP AI - PHARMACY INVENTORY")
    print("=" * 80)

def print_section(title):
    """Print a section header."""
    print(f"\n{title}")
    print("-" * len(title))

def main():
    """Main display function."""
    print_header()

    # Load the pharmacy inventory CSV
    csv_path = "ml/medicine/data/pharmacy_inventory.csv"

    if not os.path.exists(csv_path):
        print(f"ERROR: Dataset not found at {csv_path}")
        print("Please run the extraction script first:")
        print("  python ml/medicine/scripts/extract_pharmacy_data.py")
        return

    df = pd.read_csv(csv_path)

    # 1. FIRST 10 RECORDS
    print_section("FIRST 10 RECORDS")

    # Create a formatted display of the first 10 records
    # We'll align the columns nicely
    display_df = df.head(10).copy()

    # Format the dataframe for better display
    # Ensure all columns are string type for consistent display
    for col in display_df.columns:
        display_df[col] = display_df[col].astype(str)

    # Print the header with proper spacing
    headers = [
        "Medicine_Name",
        "Category",
        "Manufacturer",
        "Medicine_Price",
        "Expiry_Date",
        "Quantity"
    ]

    # Format strings for column alignment
    col_widths = [20, 25, 20, 12, 12, 10]
    format_str = "".join([f"{{:<{w}}}" for w in col_widths])

    # Print header
    print(format_str.format(*headers))
    print("-" * 80)

    # Print each record
    for _, row in display_df.iterrows():
        values = [str(row[col]) for col in headers]
        print(format_str.format(*values))

    # 2. DATASET INFORMATION
    print_section("DATASET INFORMATION")
    print(f"Total Records : {df.shape[0]}")
    print(f"Total Columns : {df.shape[1]}")

    # 3. COLUMN NAMES
    print_section("COLUMN NAMES")
    for col in df.columns:
        print(col)

    # 4. DATA TYPES
    print_section("DATA TYPES")
    for col, dtype in df.dtypes.items():
        print(f"{col}: {dtype}")

    # 5. MISSING VALUES
    print_section("MISSING VALUES")
    missing = df.isnull().sum()
    if missing.any():
        for col, count in missing.items():
            if count > 0:
                print(f"{col}: {count}")
    else:
        print("No missing values")

    # 6. BASIC STATISTICS
    print_section("BASIC STATISTICS")
    # Only show statistics for numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    if len(numeric_cols) > 0:
        stats = df[numeric_cols].describe()
        print(stats.to_string())
    else:
        print("No numeric columns for statistics")

    print("\n" + "=" * 80)
    print(" " * 18 + "REAL PHARMACY DATASET INSPECTION COMPLETED")
    print("=" * 80)

if __name__ == "__main__":
    main()