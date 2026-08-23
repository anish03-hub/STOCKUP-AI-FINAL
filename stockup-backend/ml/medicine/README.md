# Medicine ML Demonstration

This directory contains a machine learning demonstration using the real **kaysss/Medicines** dataset from Hugging Face.

## Dataset Source
- **Source**: [kaysss/Medicines](https://huggingface.co/datasets/kaysss/Medicines)
- **Records**: 23,939 real medicine records
- **No synthetic data**: All data is genuine from the Hugging Face dataset

## Directory Structure
```
ml/medicine/
├── data/
│   └── medicines.csv              # Raw dataset from Hugging Face
├── models/
│   ├── medicine_price_predictor.joblib    # Trained ML model
│   ├── label_encoders.joblib              # Fitted label encoders
│   └── feature_info.joblib                # Feature and preprocessing info
├── scripts/
│   ├── download_medicine_dataset.py       # Download script (run once)
│   └── train_medicine_model.py            # Training script with terminal output
�└── README.md                              # This file
```

## Important Notes

### What This Model DOES
- Predicts medicine **FINAL PRICE** based on other medicine attributes
- Uses supervised learning with a real target variable (`final_price`)
- Processes real categorical and numerical features from the dataset
- Provides genuine ML training with actual metrics

### What This Model does NOT DO
- �� ❌ Does NOT predict medicine demand
- �� ❌ Does NOT predict sales volume
- �� ❌ Does NOT predict stock levels or availability
- �� ❌ Does NOT use or modify the existing Walmart demand forecasting model
- �� ❌ Does NOT fabricate or invent any data

## Usage

### 1. Download the Dataset (First Time Only)
```bash
python ml/medicine/scripts/download_medicine_dataset.py
```

### 2. Run the Medicine ML Training
```bash
python ml/medicine/scripts/train_medicine_model.py
```

This will display the complete training process in the terminal, including:
- Dataset information and statistics
- First 10 records from the real dataset
- Data types and missing values
- Preprocessing steps
- Feature preparation
- Model training progress
- Actual training/test metrics
- Model saving confirmation

## Target Variable & Features

**Target Variable**: `final_price_numeric` (cleaned numeric final price)

**Features Used**:
- `disease_name`: Disease the medicine treats
- `prescription_required`: Prescription status (Rx required/OTC)
- `drug_varient`: Drug formulation (e.g., "10 Tablet(s) in a Strip")
- `drug_manufacturer`: Manufacturing company
- `drug_manufacturer_origin`: Country of origin
- `generic_name`: Generic drug name
- `price_numeric`: Cleaned current price (extracted from price column)

## Model Algorithm
- **Algorithm**: Random Forest Regressor
- **Parameters**: 
  - n_estimators=100
  - max_depth=10
  - min_samples_split=5
  - min_samples_leaf=2
  - random_state=42
- **Evaluation Metrics**: MAE, RMSE, R² (both training and test sets)

## Files Generated
After running the training script, the following files are created in `ml/medicine/models/`:
1. `medicine_price_predictor.joblib` - The trained Random Forest model
2. `label_encoders.joblib` - Fitted label encoders for categorical variables
3. `feature_info.joblib` - Metadata about features and preprocessing

## Reproducibility
- Uses `random_state=42` for train/test split
- Uses `random_state=42` for Random Forest
- Results will be consistent across runs with the same environment

## Ethical Use
This demonstration is for educational purposes only. The price prediction model should not be used for actual pricing decisions without proper validation, domain expertise, and consideration of regulatory factors.