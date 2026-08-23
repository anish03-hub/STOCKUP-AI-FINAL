import React, { useMemo, useState } from 'react';
import {
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiDatabase,
  FiTrendingUp,
  FiZap,
  FiCalendar,
  FiBarChart2,
  FiRefreshCw,
} from 'react-icons/fi';
import { predictionApi } from '../../services/api';
import '../../styles/prediction/medicineDemand.css';

// ── Real product codes from saleshourly.csv dataset ───────────────────────────
const PRODUCTS = [
  { code: 'M01AB', name: 'Diclofenac' },
  { code: 'M01AE', name: 'Ibuprofen' },
  { code: 'N02BA', name: 'Aspirin' },
  { code: 'N02BE', name: 'Paracetamol' },
  { code: 'N05B',  name: 'Diazepam' },
  { code: 'N05C',  name: 'Nitrazepam' },
  { code: 'R03',   name: 'Salbutamol' },
  { code: 'R06',   name: 'Loratadine' },
];

// ── Friendly error messages — never expose Java stack traces ──────────────────
const getFriendlyError = (error) => {
  const msg = error?.message || '';
  if (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('network')
  ) {
    return 'Unable to reach the prediction service. Please make sure Spring Boot (:8080) and FastAPI (:8001) are running.';
  }
  if (msg.toLowerCase().includes('unavailable')) {
    return 'Medicine demand prediction service is temporarily unavailable. Please try again shortly.';
  }
  if (msg.toLowerCase().includes('unsupported product code')) {
    return msg;
  }
  return msg || 'Unable to predict medicine demand right now. Please try again.';
};

// ── Format numeric units ──────────────────────────────────────────────────────
const formatUnits = (value, decimals = 4) => {
  if (typeof value !== 'number' || isNaN(value)) return '—';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

// ── Format ISO timestamp ──────────────────────────────────────────────────────
const formatTimestamp = (ts) => {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
const MedicineDemandPrediction = () => {
  const [selectedCode, setSelectedCode] = useState('N02BE');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const predictedDisplay = useMemo(
    () => formatUnits(prediction?.predictedNextHourDemand, 4),
    [prediction]
  );
  const observedDisplay = useMemo(
    () => formatUnits(prediction?.latestObservedDemand, 2),
    [prediction]
  );
  const timestampDisplay = useMemo(
    () => formatTimestamp(prediction?.latestTimestamp),
    [prediction]
  );

  const handleReset = () => {
    setPrediction(null);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    setPrediction(null);
    try {
      const response = await predictionApi.medicineDemand(selectedCode);
      setPrediction(response);
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="md-page">
      <header className="md-header">
        <div className="md-header-left">
          <span className="md-eyebrow">
            <FiZap className="md-eyebrow-icon" />
            AI Forecasting · Random Forest v2
          </span>
          <h1 className="md-title">
            <FiActivity className="md-title-icon" />
            Medicine Demand Prediction
          </h1>
          <p className="md-subtitle">
            Select a medicine from the real <code>saleshourly.csv</code> dataset
            and predict the next-hour demand via the Spring Boot prediction pipeline.
          </p>
        </div>
        <div className="md-pipeline-badge">
          <FiDatabase className="md-pipeline-icon" />
          <span>React → Spring Boot → FastAPI → ML Model</span>
        </div>
      </header>

      {error && (
        <div className="md-alert" role="alert" aria-live="assertive">
          <FiAlertCircle className="md-alert-icon" />
          <span>{error}</span>
          <button
            className="md-alert-dismiss"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <div className="md-grid">
        <form className="md-panel md-form-panel" onSubmit={handleSubmit} noValidate>
          <div className="md-panel-header">
            <FiBarChart2 className="md-panel-icon" />
            <div>
              <h2 className="md-panel-title">Select Medicine / Product</h2>
              <p className="md-panel-desc">
                Choose one of the 8 supported product codes from the hourly sales dataset.
              </p>
            </div>
          </div>

          <label className="md-field" htmlFor="md-product-select">
            <span className="md-field-label">Medicine Name</span>
            <div className="md-select-wrapper">
              <select
                id="md-product-select"
                className="md-select"
                value={selectedCode}
                onChange={(e) => {
                  setSelectedCode(e.target.value);
                  setError('');
                  handleReset();
                }}
                disabled={loading}
                aria-label="Select medicine"
              >
                {PRODUCTS.map(({ code, name }) => (
                  <option key={code} value={code}>{name} ({code})</option>
                ))}
              </select>
              <FiTrendingUp className="md-select-chevron" />
            </div>
            <span className="md-field-hint">
              Medicines from saleshourly.csv dataset
            </span>
          </label>

          <button
            id="md-predict-btn"
            className={`md-btn-predict${loading ? ' loading' : ''}`}
            type="submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <FiRefreshCw className="md-spinner-icon" />
                Predicting demand…
              </>
            ) : (
              <>
                <FiTrendingUp />
                Predict Demand
              </>
            )}
          </button>

          <div className="md-codes-grid" aria-label="Supported medicines">
            {PRODUCTS.map(({ code, name }) => (
              <button
                key={code}
                type="button"
                className={`md-code-pill${selectedCode === code ? ' active' : ''}`}
                onClick={() => {
                  setSelectedCode(code);
                  setError('');
                  handleReset();
                }}
                disabled={loading}
                title={code}
              >
                {name}
              </button>
            ))}
          </div>
        </form>

        <section
          className={`md-panel md-result-panel${prediction ? ' has-result' : ''}${loading ? ' is-loading' : ''}`}
          aria-live="polite"
          aria-label="Prediction result"
        >
          {loading && (
            <div className="md-loading-state">
              <div className="md-pulse-ring" />
              <div className="md-pulse-ring delay-1" />
              <div className="md-pulse-ring delay-2" />
              <FiActivity className="md-loading-icon" />
              <h2 className="md-loading-title">Running Prediction…</h2>
              <p className="md-loading-desc">
                Querying Spring Boot → FastAPI → Random Forest model for{' '}
                <strong>{PRODUCTS.find(p => p.code === selectedCode)?.name || selectedCode}</strong>
              </p>
            </div>
          )}

          {!loading && prediction && (
            <div className="md-result-content">
              <div className="md-result-badge">
                <FiCheckCircle className="md-result-badge-icon" />
                <span>Prediction complete</span>
              </div>

              <div className="md-hero-result">
                <span className="md-hero-label">Predicted Next-Hour Demand</span>
                <div className="md-hero-value" aria-live="polite">
                  <strong>{predictedDisplay}</strong>
                  <span className="md-hero-unit">units</span>
                </div>
                <span className="md-hero-horizon">Forecast Horizon: Next Hour</span>
              </div>

              <div className="md-detail-grid">
                <div className="md-detail-card">
                  <span className="md-detail-label">
                    <FiBarChart2 className="md-detail-icon" />
                    Medicine / Product
                  </span>
                  <strong className="md-detail-value">
                    {PRODUCTS.find(p => p.code === prediction.productCode)?.name || prediction.productCode}
                    <span style={{fontSize:'0.75em', color:'#94a3b8', marginLeft:'6px'}}>({prediction.productCode})</span>
                  </strong>
                </div>
                <div className="md-detail-card">
                  <span className="md-detail-label">
                    <FiCalendar className="md-detail-icon" />
                    Latest Timestamp
                  </span>
                  <strong className="md-detail-value">{timestampDisplay}</strong>
                </div>
                <div className="md-detail-card">
                  <span className="md-detail-label">
                    <FiActivity className="md-detail-icon" />
                    Latest Observed Demand
                  </span>
                  <strong className="md-detail-value">{observedDisplay} units</strong>
                </div>
                <div className="md-detail-card accent">
                  <span className="md-detail-label">
                    <FiZap className="md-detail-icon" />
                    Prediction Horizon
                  </span>
                  <strong className="md-detail-value">Next Hour</strong>
                </div>
              </div>
            </div>
          )}

          {!loading && !prediction && (
            <div className="md-empty-state">
              <div className="md-empty-icon-wrap">
                <FiClock className="md-empty-icon" />
              </div>
              <h2 className="md-empty-title">Awaiting Prediction</h2>
              <p className="md-empty-desc">
                Select a product code and click <strong>Predict Demand</strong> to view
                the next-hour forecast from the Random Forest v2 model.
              </p>
              <div className="md-empty-pipeline">
                <div className="md-pipeline-step"><span className="md-step-num">1</span><span>Select code</span></div>
                <div className="md-pipeline-arrow">→</div>
                <div className="md-pipeline-step"><span className="md-step-num">2</span><span>Spring Boot</span></div>
                <div className="md-pipeline-arrow">→</div>
                <div className="md-pipeline-step"><span className="md-step-num">3</span><span>FastAPI</span></div>
                <div className="md-pipeline-arrow">→</div>
                <div className="md-pipeline-step"><span className="md-step-num">4</span><span>ML Result</span></div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MedicineDemandPrediction;
