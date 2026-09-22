# CA-3 Point 2 — Testing & Performance Validation Evidence

This document compiles the complete, verified evidence supporting **CA-3 Category 2 (Testing & Performance Validation Report — 2 Marks)** for StockUp AI.

---

## 1. Functional Testing Evidence
- **Backend Unit Tests**:
  - Framework: JUnit 5 & Mockito
  - Total Executed Tests: **87**
  - Passed: **87** | Failed: **0** | Skipped: **0**
  - Build Status: **`BUILD SUCCESS`** (5.34 seconds execution time)
  - Key Classes: `EmailNotificationServiceTest`, `InventoryHealthServiceTest`, `ForecastControllerTest`, `UserServiceTest`, `DailySalesServiceTest`, `DocumentParserServiceTest`, `ItemImportServiceTest`, `MedicineDemandPredictionServiceTest`, `PurchaseOrderServiceTest`, `SaleTransactionServiceTest`, `PasswordResetServiceTest`.
- **Frontend Code Quality & Compilation**:
  - Linter (`oxlint`): **0 Errors**, 21 Warnings across 99 source files.
  - Production Bundle (`vite build`): **SUCCESS** (`dist/` compiled cleanly in 696ms).

---

## 2. Integration & End-to-End (E2E) Testing Evidence
- **Automated Verification Suites**:
  - `verify_auth_suite.py`: Validates user login, JWT claim parsing, multi-tenant database record scoping, and 403 authorization status.
  - `verify_procurement_lifecycle.py`: Tests purchase order creation, state machine transitions (`DRAFT` -> `ORDERED` -> `RECEIVED`), and automatic stock increments.
  - `test_pos_frontend_e2e.py`: Simulates point-of-sale billing, subtotal/tax calculations, stock deduction, and sales history logging.

---

## 3. Machine Learning (ML) Validation Evidence
- **Evaluation Dataset**: **177,990 historical sales records** (Chronological holdout split: 2020–2024 training, 2025 holdout test set with 29,644 samples).
- **Primary Model**: `HistGradientBoostingRegressor` (Daily Demand Forecasting)
- **Empirical Accuracy Metrics**:
  - **MAE (Mean Absolute Error)**: **60.82** (58.97% improvement over Naive baseline)
  - **RMSE (Root Mean Square Error)**: **81.30** (76.03% improvement over Naive baseline)
  - **WAPE (Weighted Abs. Pct Error)**: **16.31%**
  - **R² (Coefficient of Determination)**: **0.9028** (90.28% variance explained)
- **Hourly Medicine Demand Model (v2)**: Macro MAE: **0.4159**, RMSE: **0.8066**, R²: **0.0925** (N02BE pain relief R²: **0.2373**).

---

## 4. Performance Testing Evidence
- **Test Target**: Local Spring Boot API & PostgreSQL Service
- **Test Scenarios**: Multi-stage read-only load testing (1, 5, and 10 concurrent users).
- **Tested Endpoints**:
  1. `GET /api/dashboard/summary` (Inventory Health Summary)
  2. `GET /api/items?page=0&size=20` (Medicine Inventory List)
  3. `GET /api/sales/summary` (Historical Sales Analytics)
  4. `GET /api/sales/filters` (Sales Filter Options)
  5. `GET /api/forecast/daily/metadata` (Daily Demand Model Metadata)

---

## 5. Concurrent Load Testing Evidence
- **Executed Requests**: **800 total HTTP API requests**
- **Failure Rate**: **0.0%** (0 failures out of 800 requests)
- **Measured Empirical Results**:
  - **1 User (50 Reqs)**: Avg: **166.88 ms** | Median: **94.72 ms** | P95: **552.90 ms** | RPS: **5.59 req/s**
  - **5 Users (250 Reqs)**: Avg: **182.56 ms** | Median: **79.47 ms** | P95: **574.96 ms** | RPS: **25.65 req/s**
  - **10 Users (500 Reqs)**: Avg: **301.67 ms** | Median: **72.55 ms** | P95: **1201.40 ms** | RPS: **31.42 req/s**

---

## 6. Evidence Artifact Files
The following files in the repository contain the full empirical raw logs, code, and documentation for CA-3 Point 2 evaluation:

1. [`TESTING_STATUS.md`](file:///Users/anishkumarsah/Desktop/STOCKUP-AI/TESTING_STATUS.md) — Comprehensive master test status document.
2. [`docs/PERFORMANCE_TESTING.md`](file:///Users/anishkumarsah/Desktop/STOCKUP-AI/docs/PERFORMANCE_TESTING.md) — Detailed performance & load testing report.
3. [`docs/CA3_POINT2_EVIDENCE.md`](file:///Users/anishkumarsah/Desktop/STOCKUP-AI/docs/CA3_POINT2_EVIDENCE.md) — CA-3 Category 2 evidence summary (this document).
4. [`performance-tests/run_load_test.py`](file:///Users/anishkumarsah/Desktop/STOCKUP-AI/performance-tests/run_load_test.py) — Multi-stage concurrent load test runner script.
5. [`performance-tests/locustfile.py`](file:///Users/anishkumarsah/Desktop/STOCKUP-AI/performance-tests/locustfile.py) — Locust user load definition script.
6. [`performance-tests/results/load_test_results.json`](file:///Users/anishkumarsah/Desktop/STOCKUP-AI/performance-tests/results/load_test_results.json) — Raw JSON empirical measurement output.
7. [`verify_auth_suite.py`](file:///Users/anishkumarsah/Desktop/STOCKUP-AI/verify_auth_suite.py) — E2E authentication & multi-tenancy verification suite.
8. [`verify_procurement_lifecycle.py`](file:///Users/anishkumarsah/Desktop/STOCKUP-AI/verify_procurement_lifecycle.py) — E2E procurement workflow script.
9. [`test_pos_frontend_e2e.py`](file:///Users/anishkumarsah/Desktop/STOCKUP-AI/test_pos_frontend_e2e.py) — E2E POS billing & inventory deduction script.
10. [`daily_demand_metadata.json`](file:///Users/anishkumarsah/Desktop/STOCKUP-AI/stockup-backend/ml/daily_demand/models/daily_demand_metadata.json) — Out-of-sample ML model holdout evaluation metrics.
