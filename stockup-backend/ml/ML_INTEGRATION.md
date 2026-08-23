# StockUp AI ML Integration Documentation

## Architecture Overview

The StockUp AI demand forecasting system uses a microservices architecture where the Machine Learning model is served as a separate Python API, and the Spring Boot backend communicates with it via HTTP requests.

```
React Frontend
      ��� � � ↓
Spring Boot Backend (Port 8080)
      ��� � � ↓ HTTP (REST)
Python ML API (Port 8001)
      ��� � � ↓
Trained ML Model (Random Forest Regressor)
      ��� � � ↓
Demand Prediction
      ��� � � ↓
Spring Boot Backend
      ��� � � ↓
React Frontend
```

## Components

### 1. Python ML API (FastAPI)
- **Location**: `ml/api/app.py`
- **Port**: 8001
- **Model**: Random Forest Regressor (loaded from `ml/models/best_demand_forecasting_model.joblib`)
- **Features**: Uses the exact same features as during training (see `ml/models/feature_columns.joblib`)
- **Endpoints**:
  - `GET /health` - Returns API status and model information
  - `POST /predict` - Accepts feature inputs and returns demand prediction

### 2. Spring Boot Backend
- **Location**: Standard Spring Boot structure
- **Port**: 8080 (default)
- **ML Integration**: 
  - `PredictionController` (`src/main/java/com/stockup/backend/controller/PredictionController.java`)
  - `PredictionService` interface and implementation (`src/main/java/com/stockup/backend/service/PredictionService.java` and `src/main/java/com/stockup/backend/service/impl/PredictionServiceImpl.java`)
  - DTOs: `PredictionRequest` and `PredictionResponse` (`src/main/java/com/stockup/backend/dto/`)

### 3. Trained Model
- **Location**: `ml/models/best_demand_forecasting_model.joblib` (~2.8 GB)
- **Features**: `ml/models/feature_columns.joblib`
- **Type**: Random Forest Regressor
- **Training RMSE**: 9570.32

## Communication Flow

1. **Frontend Request**: React frontend sends POST request to `/api/predictions/demand` on Spring Boot
2. **Spring Boot Processing**: 
   - `PredictionController` receives the request and validates it
   - Calls `PredictionService.predictDemand()`
   - `PredictionServiceImpl` makes HTTP POST request to Python ML API (`http://localhost:8001/predict`)
   - Includes all required features in the request body
3. **Python API Processing**:
   - Receives request at `/predict` endpoint
   - Validates that all required features are present
   - Prepares input data in the exact same feature order used during training
   - Makes prediction using the pre-loaded Random Forest model
   - Returns JSON with predicted demand and model name
4. **Response Path**: 
   - Python API → Spring Boot → Frontend

## Configuration

### Python ML API
- Runs on `http://localhost:8001`
- Configured in `ml/api/app.py`
- Model loaded once at startup via `@app.on_event("startup")`

### Spring Boot
- ML API URL configured in `src/main/resources/application.properties`:
  ```
  ml.api.url=http://localhost:8001
  ```
- Uses Spring's `RestTemplate` for HTTP communication
- Configured via `RestTemplateConfig` (`src/main/java/com/stockup/backend/config/RestTemplateConfig.java`)

## Data Flow Details

### Prediction Request
The Spring Boot `PredictionRequest` DTO contains exactly 20 features matching the trained model:
- Store, Dept, IsHoliday
- Temperature, Fuel_Price
- MarkDown1, MarkDown2, MarkDown3, MarkDown4, MarkDown5
- CPI, Unemployment
- Size
- Year, Month, Week, Day, Quarter
- Type_B, Type_C (one-hot encoded store types)

### Prediction Response
Both APIs return a simple JSON structure:
```json
{
  "predictedDemand": 5234.67,
  "model": "RandomForestRegressor"
}
```

## Error Handling

### Python ML API
- Returns 503 if model not loaded
- Returns 400 for missing or invalid features
- Returns 500 for prediction errors

### Spring Boot
- Wraps Python API errors in service exceptions
- Returns appropriate HTTP error codes to frontend
- Integrated with existing `GlobalExceptionHandler`

## Deployment Instructions

### Prerequisites
1. Trained model files must exist in `ml/models/`:
   - `best_demand_forecasting_model.joblib`
   - `feature_columns.joblib`
2. Python 3.x with required packages installed

### Starting Services

#### 1. Start Python ML API
```bash
# Install dependencies (if not already installed)
pip install -r ml/api/requirements.txt

# Start the API
python -m uvicorn ml.api.app:app --host 0.0.0.0 --port 8001
```

#### 2. Start Spring Boot Backend
```bash
# From project root
mvn spring-boot:run
```

## Verification Steps

### 1. Check Python ML API Health
```bash
curl http://localhost:8001/health
# Expected response:
# {"status":"UP","model":"RandomForestRegressor","features_count":20}
```

### 2. Test Prediction Endpoint
```bash
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
# Expected response:
# {"predictedDemand":5234.67,"model":"RandomForestRegressor"}
```

### 3. Check Spring Boot Health
```bash
curl http://localhost:8080/actuator/health
# Should show "UP" status
```

### 4. Test Spring Boot Prediction Endpoint
```bash
curl -X POST http://localhost:8080/api/predictions/demand \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
# Should return prediction from Python ML API
```

## Security & Performance Considerations

### Model Loading
- The ML model is loaded once at Python API startup, not per request
- This provides optimal performance for multiple prediction requests

### CORS
- Spring Boot maintains its existing CORS configuration
- Python API includes CORS middleware to allow frontend communication
- In production, restrict origins to specific domains

### Error Handling
- Graceful degradation if Python API is unavailable
- Clear error messages returned to frontend
- No exposure of internal implementation details

### Scalability
- Python API can be scaled horizontally behind a load balancer
- Spring Boot remains stateless regarding ML predictions
- Model files shared via network storage if needed

## Troubleshooting

### Common Issues

1. **"Connection refused" to Python API**
   - Verify Python API is running on port 8001
   - Check if service started successfully
   - Verify `ml.api.url` in application.properties

2. **"Model not loaded" error**
   - Check that model files exist in `ml/models/`
   - Verify file permissions allow reading
   - Check Python API startup logs for loading errors

3. **Feature validation errors**
   - Ensure all 20 features are provided in request
   - Check that feature names match exactly
   - Verify data types are numeric

4. **Performance issues**
   - Model loading happens only once at startup
   - Subsequent requests are fast (mainly network overhead)
   - Consider caching frequently used predictions if needed

## Files Modified/Added

### In ml/ Directory
- Added: `ml/api/app.py` (FastAPI application)
- Added: `ml/api/requirements.txt` (API dependencies)
- Updated: `ml/README.md` (added API documentation)
- Added: `ml/ML_INTEGRATION.md` (this file)

### In Spring Boot Backend
- Added: `src/main/java/com/stockup/backend/config/RestTemplateConfig.java`
- Added: `src/main/java/com/stockup/backend/controller/PredictionController.java`
- Added: `src/main/java/com/stockup/backend/dto/PredictionRequest.java`
- Added: `src/main/java/com/stockup/backend/dto/PredictionResponse.java`
- Added: `src/main/java/com/stockup/backend/service/PredictionService.java`
- Added: `src/main/java/com/stockup/backend/service/impl/PredictionServiceImpl.java`
- Updated: `src/main/resources/application.properties` (added ml.api.url)
- Updated: `src/main/java/com/stockup/backend/config/WebConfig.java` (no changes needed)

### Root Directory
- Added: `.gitignore` (to prevent committing large model files)
