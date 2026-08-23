import React, { useState } from 'react';
import {
  FiAlertTriangle,
  FiAlertCircle,
  FiCheckCircle,
  FiShield,
  FiPackage,
  FiTrendingUp,
  FiInfo,
  FiHash,
  FiPercent,
  FiMessageSquare,
} from 'react-icons/fi';
import '../../styles/stockout/stockout.css';
import { predictStockout } from '../../services/api';

const StockoutPrediction = () => {
  const [medicineName, setMedicineName] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [predictedDemand, setPredictedDemand] = useState('');

  const [state, setState] = useState('idle'); // idle, loading, success, error
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const resetForm = () => {
    setMedicineName('');
    setCurrentQuantity('');
    setPredictedDemand('');
    setResult(null);
    setErrorMessage('');
    setState('idle');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    if (!currentQuantity || !predictedDemand) {
      setErrorMessage('Please fill in all required fields (Current Quantity and Predicted Demand).');
      setState('error');
      return;
    }

    const qty = parseInt(currentQuantity, 10);
    const demand = parseInt(predictedDemand, 10);

    if (isNaN(qty) || qty < 0) {
      setErrorMessage('Current Quantity must be a number >= 0.');
      setState('error');
      return;
    }

    if (isNaN(demand) || demand <= 0) {
      setErrorMessage('Predicted Demand must be a number > 0.');
      setState('error');
      return;
    }

    setState('loading');

    try {
      const data = await predictStockout({
        medicineName: medicineName.trim() || 'N/A',
        currentQuantity: qty,
        predictedDemand: demand,
      });

      setResult(data);
      setState('success');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to analyze stock-out risk. Please try again.');
      setState('error');
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'HIGH':
        return <FiAlertTriangle />;
      case 'MEDIUM':
        return <FiAlertCircle />;
      case 'LOW':
        return <FiCheckCircle />;
      default:
        return <FiInfo />;
    }
  };

  return (
    <div className="stockout-page">
      {/* Header */}
      <div className="stockout-header">
        <h1>
          <FiShield /> Stock-out Prediction
        </h1>
        <p className="page-description">
          Analyze stock-out risk by comparing current inventory levels against predicted demand.
          Enter your stock data below to receive a risk assessment and reorder recommendation.
        </p>
      </div>

      {/* Error Alert */}
      {state === 'error' && errorMessage && (
        <div className="stockout-alert stockout-alert-error">
          <FiAlertCircle />
          <span>{errorMessage}</span>
          <button
            className="retry-btn"
            onClick={() => { setErrorMessage(''); setState('idle'); }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Form */}
      <div className="stockout-form-card">
        <h2>
          <FiPackage /> Input Parameters
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="stockout-form-grid">
            <div className="stockout-form-group">
              <label htmlFor="stockout-medicine-name">
                Medicine Name
              </label>
              <input
                type="text"
                id="stockout-medicine-name"
                placeholder="e.g. Paracetamol"
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
              />
              <span className="field-hint">Optional — for labeling the result</span>
            </div>

            <div className="stockout-form-group">
              <label htmlFor="stockout-current-qty">
                Current Quantity <span className="required">*</span>
              </label>
              <input
                type="number"
                id="stockout-current-qty"
                placeholder="e.g. 25"
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(e.target.value)}
                min="0"
                required
              />
              <span className="field-hint">Units currently in stock</span>
            </div>

            <div className="stockout-form-group">
              <label htmlFor="stockout-predicted-demand">
                Predicted Demand <span className="required">*</span>
              </label>
              <input
                type="number"
                id="stockout-predicted-demand"
                placeholder="e.g. 40"
                value={predictedDemand}
                onChange={(e) => setPredictedDemand(e.target.value)}
                min="1"
                required
              />
              <span className="field-hint">Expected demand from forecast model</span>
            </div>
          </div>

          <div className="stockout-form-actions">
            <button
              type="submit"
              className="stockout-btn stockout-btn-primary"
              disabled={state === 'loading'}
            >
              {state === 'loading' ? (
                <>
                  <span className="stockout-spinner" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FiShield /> Analyze Stock-out Risk
                </>
              )}
            </button>
            <button
              type="button"
              className="stockout-btn stockout-btn-outline"
              onClick={resetForm}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Loading */}
      {state === 'loading' && (
        <div className="stockout-loading">
          <span className="stockout-spinner" />
          <span>Analyzing stock-out risk...</span>
        </div>
      )}

      {/* Result */}
      {state === 'success' && result && (
        <div className="stockout-result">
          <StockoutResult result={result} getRiskIcon={getRiskIcon} />
        </div>
      )}
    </div>
  );
};

/* ── Result Sub-component ──────────────────────────── */
function StockoutResult({ result, getRiskIcon }) {
  const riskClass = `risk-${result.riskLevel.toLowerCase()}`;
  const badgeClass = `badge-${result.riskLevel.toLowerCase()}`;
  const shortage = result.expectedShortage;

  return (
    <div className={`stockout-risk-card ${riskClass}`}>
      {/* Header */}
      <div className="stockout-risk-header">
        <div className="stockout-risk-title">
          {getRiskIcon(result.riskLevel)}
          <h2>Stock-out Analysis</h2>
        </div>
        <span className={`stockout-risk-badge ${badgeClass}`}>
          {result.riskLevel} RISK
        </span>
      </div>

      {/* Medicine Name */}
      {result.medicineName && result.medicineName !== 'N/A' && (
        <div className="stockout-medicine-name">
          <span>Medicine</span>
          <h3>{result.medicineName}</h3>
        </div>
      )}

      {/* Metrics */}
      <div className="stockout-metrics">
        <div className="stockout-metric">
          <div className="stockout-metric-label">
            <FiPackage /> Current Stock
          </div>
          <div className="stockout-metric-value">
            {result.currentStock.toLocaleString()} <small>units</small>
          </div>
        </div>

        <div className="stockout-metric">
          <div className="stockout-metric-label">
            <FiTrendingUp /> Predicted Demand
          </div>
          <div className="stockout-metric-value">
            {result.predictedDemand.toLocaleString()} <small>units</small>
          </div>
        </div>

        <div className="stockout-metric">
          <div className="stockout-metric-label">
            <FiHash /> {shortage >= 0 ? 'Surplus' : 'Shortage'}
          </div>
          <div className={`stockout-metric-value ${shortage >= 0 ? 'positive' : 'negative'}`}>
            {shortage >= 0 ? '+' : ''}{shortage.toLocaleString()} <small>units</small>
          </div>
        </div>

        <div className="stockout-metric">
          <div className="stockout-metric-label">
            <FiPercent /> Coverage Ratio
          </div>
          <div className="stockout-metric-value">
            {(result.stockCoverageRatio * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="stockout-recommendation">
        <div className="stockout-recommendation-title">
          <FiMessageSquare /> Recommendation
        </div>
        <p>{result.recommendation}</p>
      </div>
    </div>
  );
}

export default StockoutPrediction;
