import React from 'react';
import { TbRobot } from 'react-icons/tb';
import { FiClock, FiCpu, FiInfo } from 'react-icons/fi';
import '../../styles/forecast/forecast.css';

const formatTimestamp = (ts) => {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString(undefined, {
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

const formatDemandValue = (val) => {
  if (val == null || val === '') return '—';
  if (typeof val === 'number') {
    if (isNaN(val)) return '—';
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });
  }
  return String(val);
};

const PredictionCard = ({
  medicineName = '—',
  predictedDemand = null,
  forecastDate = null,
  model = '—',
}) => {
  const formattedDemand = formatDemandValue(predictedDemand);
  const formattedTargetDate = formatTimestamp(forecastDate);

  return (
    <div className="prediction-card">
      <div className="prediction-header">
        <h2>{medicineName}</h2>
        <div className="ai-icon-wrapper" aria-hidden="true">
          <TbRobot />
        </div>
      </div>

      <div className="prediction-body">
        <span className="prediction-label">Predicted Next-Hour Demand</span>
        <div className="prediction-value">
          {formattedDemand} {formattedDemand !== '—' && <span style={{ fontSize: '16px', color: '#64748b' }}>units</span>}
        </div>
      </div>

      <div className="confidence-section">
        <div className="confidence-info" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiClock style={{ color: '#2563eb' }} /> Forecast Target
            </span>
            <strong style={{ fontSize: '14px' }}>{formattedTargetDate}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiCpu style={{ color: '#8b5cf6' }} /> Model
            </span>
            <strong style={{ fontSize: '14px' }}>{model || '—'}</strong>
          </div>
        </div>
      </div>

      <div className="reorder-suggestion" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
        <FiInfo className="reorder-icon" style={{ color: '#2563eb' }} />
        <div className="reorder-text">
          <h4 style={{ color: '#1e293b' }}>Forecast Horizon</h4>
          <p style={{ color: '#64748b' }}>
            Generated next-hour prediction from {model && model !== '—' ? model : 'the demand forecasting pipeline'}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PredictionCard;
