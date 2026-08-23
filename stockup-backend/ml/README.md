# StockUp AI Machine Learning Module

## Overview
This module contains the machine learning components for the StockUp AI demand forecasting system. It is designed to work with the real Walmart Retail Sales dataset for predicting future product/department demand from historical sales data.

## Dataset Source
**Walmart Recruiting - Store Sales Forecasting** (Kaggle competition dataset)

To obtain the dataset:
1. Go to: https://www.kaggle.com/competitions/walmart-recruiting-store-sales-forecasting/data
2. Download the following files:
   - `train.csv` - Historical sales data
   - `features.csv` - Supplementary data (temperature, fuel prices, markdowns, CPI, unemployment)
   - `stores.csv` - Store information

3. Place the files in the `ml/data/raw/` directory:
   - `ml/data/raw/train.csv`
   - `ml/data/raw/features.csv` 
   - `ml/data/raw/stores.csv`

## Important Notes
- This is a **real dataset** from Walmart containing actual sales records
- The dataset includes: Store, Department, Date, Weekly_Sales, IsHoliday, Temperature, Fuel_Price, MarkDown1-5, CPI, Unemployment
- **NO synthetic or fake data is used** - all values come from the actual Walmart dataset
- The dataset must be manually downloaded due to Kaggle's authentication requirements

## Project Structure
```
ml/
├── data/
│   ├── raw/           # Original dataset files (place downloaded files here)
│   └── processed/     # Cleaned and processed data
├── models/            # Trained model artifacts
├── api/               # Python ML API (FastAPI)
├── scripts/           # Training and inference scripts
├── requirements.txt   # Python dependencies
�└── README.md          # This file
```

## How to Run Training
1. Download the Walmart dataset from Kaggle as described above
2. Place files in `ml/data/raw/`
3. Install dependencies: `pip install -r requirements.txt`
4. Run training: `python ml/scripts/train_model.py`

## Expected Output
When run with the real dataset, the script will display:
- Dataset loading confirmation
- Actual dataset shape and dimensions
- Real column names from the dataset
- First 10 actual records
- Actual missing values count
- Preprocessing steps performed
- Training/test split sizes (chronological)
- Model training progress for multiple algorithms
- Actual evaluation metrics (MAE, RMSE, R²)
- Best model selection justification
- Actual vs predicted sales examples
- Model saving confirmation

## Models Trained
- Linear Regression (baseline)
- Random Forest Regressor
- Gradient Boosting Regressor
- (XGBoost added only if beneficial and dependencies allow)

## Evaluation Metrics
All metrics are calculated from actual predictions on real test data:
- MAE (Mean Absolute Error)
- RMSE (Root Mean Squared Error)
- R² (Coefficient of Determination)

## Preprocessing Steps
When the real dataset is loaded, the script will:
- Handle missing values appropriately
- Convert Date column to temporal features (year, month, week, day, quarter)
- Encode categorical variables (Store, Dept)
- Prepare features for modeling
- Perform chronological train/test split (no random shuffling)

## Python ML API
After training the model, you can serve it using the FastAPI service:

### How to Start the ML API
1. Install API dependencies: `pip install -r ml/api/requirements.txt`
2. Start the API: `python -m uvicorn ml.api.app:app --host 0.0.0.0 --port 8001`

### API Endpoints
- **GET /health** - Check if the API is running and model is loaded
- **POST /predict** - Make a demand prediction

### Example Request
```json
{
  "store": 1,
  "dept": 1,
  "isHoliday": 0,
  "temperature": 65.0,
  "fuelPrice": 3.5,
  "markDown1": 0.0,
  "markDown2": 0.0,
  "markDown3": 0.0,
  "markDown4": 0.0,
  "markDown5": 0.0,
  "cpi": 200.0,
  "unemployment": 5.0,
  "size": 50000.0,
  "year": 2023,
  "month": 1,
  "week": 1,
  "day": 1,
  "quarter": 1,
  "typeB": 0,
  "typeC": 0
}
```

### Example Response
```json
{
  "predictedDemand": 5234.67,
  "model": "RandomForestRegressor"
}
```

## Integration with Spring Boot Backend
The StockUp backend includes a PredictionService that communicates with this Python ML API:

1. Spring Boot exposes `/api/predictions/demand` endpoint
2. When called, it makes an HTTP request to the Python ML API at `http://localhost:8001/predict`
3. The Python API loads the trained model once at startup and uses it for all predictions
4. Predictions are returned to Spring Boot and then to the frontend

### Architecture
```
React Frontend
      � ↓
Spring Boot Backend (localhost:8080)
      � ↓ HTTP request
Python ML API (localhost:8001)
      � ↓
best_demand_forecasting_model.joblib (Random Forest Regressor)
      � ↓
Demand prediction
      � ↓
Spring Boot
      � ↓
React Frontend
```

## Notes
- The trained model is approximately 2.8 GB and remains in `ml/models/`
- Model files are not copied into the Spring Boot application
- The Python API loads the model once at startup for efficiency
- Both services can run independently on different ports
