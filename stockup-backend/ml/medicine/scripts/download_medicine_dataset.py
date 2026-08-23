#!/usr/bin/env python3
"""
Download the real kaysss/Medicines dataset from Hugging Face
and save it as a CSV file.
"""

import os
import pandas as pd
from datasets import load_dataset

def download_and_save_dataset():
    """Download the Medicine dataset and save as CSV."""
    print("Loading kaysss/Medicines dataset from Hugging Face...")
    
    # Load the dataset
    dataset = load_dataset("kaysss/Medicines")
    
    # Convert to pandas DataFrame
    df = dataset['train'].to_pandas()
    
    # Ensure data directory exists
    os.makedirs("ml/medicine/data", exist_ok=True)
    
    # Save as CSV
    csv_path = "ml/medicine/data/medicines.csv"
    df.to_csv(csv_path, index=False)
    
    print(f"Dataset saved to: {csv_path}")
    print(f"Shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    
    return csv_path

if __name__ == "__main__":
    download_and_save_dataset()
