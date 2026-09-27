import React, { useState, useEffect, useCallback } from 'react';
import {
  FiActivity,
  FiAlertCircle,
  FiDatabase,
  FiTrendingUp,
  FiZap,
  FiCalendar,
  FiBarChart2,
  FiRefreshCw,
  FiChevronDown,
  FiShield,
  FiInfo,
  FiArrowRight,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { dailyForecastApi } from '../../services/api';
import '../../styles/prediction/medicineDemand.css';

// Weekly forecast horizon is fixed at 7 days.
const FORECAST_DAYS = 7;

// Popular medicines available in the historical sales dataset.
const MEDICINES = [
  'Paracetamol',
  'Amoxicillin',
  'Azithromycin',
  'Ibuprofen',
  'Amlodipine',
  'Metformin',
];

const getFriendlyError = (error) => {
  const msg = (error?.message || '').toLowerCase();
  if (msg.includes('timed out') || msg.includes('timeout')) {
    return 'The forecast request timed out. The ML forecasting service may be starting up or is temporarily unavailable. Please try again in a moment.';
  }
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('connect') || msg.includes('network')) {
    return 'Unable to reach the forecasting service. Please ensure the backend services are running and try again.';
  }
  if (msg.includes('unavailable')) {
    return 'The demand forecasting service is temporarily unavailable. Please try again shortly.';
  }
  return error?.message || 'Unable to generate the weekly demand forecast right now. Please try again.';
};

const formatUnits = (value, decimals = 0) => {
  if (typeof value !== 'number' || isNaN(value)) return '—';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

const MedicineDemandPrediction = () => {
  const [medicine, setMedicine] = useState('Paracetamol');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState(null);

  // Load model metadata once on mount (non-blocking; failures are ignored).
  useEffect(() => {
    let active = true;
    dailyForecastApi.metadata()
      .then((data) => { if (active) setMetadata(data); })
      .catch((err) => console.warn('Could not load forecast metadata:', err));
    return () => { active = false; };
  }, []);

  const generateForecast = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dailyForecastApi.predict(medicine, FORECAST_DAYS);
      setPrediction(res);
    } catch (err) {
      setError(getFriendlyError(err));
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  }, [medicine]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    generateForecast();
  };

  const forecast = prediction?.forecast || [];
  const hasForecast = forecast.length > 0;
  const noHistoricalData = prediction && prediction.hasHistoricalData === false;

  // Peak / lowest days are derived from the real API forecast points — never fabricated.
  const peakPoint = hasForecast
    ? forecast.reduce((a, b) => (b.predictedDemand > a.predictedDemand ? b : a))
    : null;
  const lowPoint = hasForecast
    ? forecast.reduce((a, b) => (b.predictedDemand < a.predictedDemand ? b : a))
    : null;
  const totalUnits = typeof prediction?.totalPredictedUnits === 'number'
    ? prediction.totalPredictedUnits
    : forecast.reduce((sum, p) => sum + (p.predictedDemand || 0), 0);
  const avgDaily = typeof prediction?.averageDailyDemand === 'number'
    ? prediction.averageDailyDemand
    : (hasForecast ? totalUnits / forecast.length : 0);

  return (
    <div className="md-page">
      <header className="md-header">
        <div className="md-header-left">
          <span className="md-eyebrow">
            <FiZap className="md-eyebrow-icon" />
            AI Demand Forecasting · Multi-Tenant ML Engine
          </span>
          <h1 className="md-title">
            <FiActivity className="md-title-icon" />
            Medicine Demand Forecasting
          </h1>
          <p className="md-subtitle">
            Forecast the expected demand for the selected medicine over the next 7 days using historical sales data.
          </p>
        </div>
        <div className="md-pipeline-badge">
          <FiDatabase className="md-pipeline-icon" />
          <span>PostgreSQL → Spring Boot → FastAPI → ML Models</span>
        </div>
      </header>
      {error && (
        <div className="md-alert" role="alert">
          <FiAlertCircle className="md-alert-icon" />
          <span>{error}</span>
          <button className="md-alert-dismiss" onClick={() => setError('')}>×</button>
        </div>
      )}

      {noHistoricalData && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #fef3c7', borderRadius: '16px', padding: '24px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <FiInfo size={24} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#92400e', margin: '0 0 6px 0' }}>
              No Historical Sales Data Available for Your Company
            </h3>
            <p style={{ fontSize: '14px', color: '#b45309', margin: '0 0 12px 0', lineHeight: 1.5 }}>
              {prediction.message || 'Your company account currently has 0 historical sales records. Import your historical sales data to activate weekly demand forecasting.'}
            </p>
            <a href="/sales-analytics" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#ffffff', background: '#d97706', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}>
              View Sales Analytics & Data Guidelines <FiArrowRight />
            </a>
          </div>
        </div>
      )}

      <div className="md-grid">
        {/* Left Panel: Configuration Form */}
        <form className="md-panel md-form-panel" onSubmit={handleSubmit}>
          <div className="md-panel-header">
            <FiBarChart2 className="md-panel-icon" />
            <div>
              <h2 className="md-panel-title">Weekly Demand Forecast</h2>
              <p className="md-panel-desc">Forecast the expected demand for the next 7 days.</p>
            </div>
          </div>

          {/* Medicine Selector */}
          <div className="md-field">
            <label htmlFor="med-select" className="md-field-label">Target Medicine</label>
            <div className="md-select-wrapper">
              <select
                id="med-select"
                className="md-select"
                value={medicine}
                onChange={(e) => setMedicine(e.target.value)}
                disabled={loading}
              >
                {MEDICINES.map((med) => (
                  <option key={med} value={med}>{med}</option>
                ))}
              </select>
              <FiChevronDown className="md-select-chevron" />
            </div>
          </div>
          {/* Popular Medicines */}
          <div style={{ marginTop: '-4px', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              Popular Medicines:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {MEDICINES.map((med) => (
                <button
                  key={med}
                  type="button"
                  onClick={() => setMedicine(med)}
                  disabled={loading}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    border: medicine === med ? '1px solid #2563eb' : '1px solid #e2e8f0',
                    background: medicine === med ? '#eff6ff' : '#f8fafc',
                    color: medicine === med ? '#1d4ed8' : '#475569',
                  }}
                >
                  {med}
                </button>
              ))}
            </div>
          </div>

          {/* Forecast Period (fixed at 7 days) */}
          <div className="md-field">
            <label className="md-field-label">Forecast Period</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', border: '2px solid #2563eb', background: '#eff6ff', color: '#1d4ed8', fontWeight: '600', fontSize: '13px' }}>
              <FiCalendar size={16} />
              Next 7 Days
            </div>
          </div>

          {/* Model Info Card */}
          {metadata && metadata.metrics && metadata.metrics.ml_model && (
            <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiShield style={{ color: '#2563eb' }} /> Model: {metadata.model_name} v{metadata.version}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span>Holdout MAE: <strong>{metadata.metrics.ml_model.mae}</strong></span>
                <span>WAPE: <strong>{metadata.metrics.ml_model.wape_pct}%</strong></span>
                <span>R²: <strong>{metadata.metrics.ml_model.r2}</strong></span>
              </div>
            </div>
          )}

          <button type="submit" className="md-submit-btn" disabled={loading} style={{ marginTop: '16px' }}>
            {loading ? (
              <>
                <FiRefreshCw className="animate-spin" />
                Generating weekly demand forecast...
              </>
            ) : (
              <>
                <FiActivity />
                Generate Weekly Forecast
              </>
            )}
          </button>
        </form>
        {/* Right Panel: Results */}
        <div className="md-panel md-result-panel">
          <div className="md-panel-header">
            <FiTrendingUp className="md-panel-icon" />
            <div>
              <h2 className="md-panel-title">{medicine} — 7-Day Weekly Forecast</h2>
              <p className="md-panel-desc">Projected daily demand for the next 7 days.</p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <FiRefreshCw className="animate-spin" size={32} style={{ color: '#2563eb', marginBottom: '12px' }} />
              <p style={{ margin: 0 }}>Generating weekly demand forecast...</p>
            </div>
          ) : hasForecast ? (
            <>
              {/* Summary tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--surface-muted)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>TOTAL WEEKLY DEMAND</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{formatUnits(totalUnits, 0)} units</div>
                </div>
                <div style={{ background: 'var(--surface-muted)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>AVG DAILY DEMAND</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>{formatUnits(avgDaily, 1)} <span style={{ fontSize: '12px' }}>/day</span></div>
                </div>
                <div style={{ background: 'var(--surface-muted)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>PEAK DAY</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#059669', marginTop: '2px' }}>{peakPoint?.dayOfWeek || '—'} <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>({formatUnits(peakPoint?.predictedDemand, 0)} units)</span></div>
                </div>
                <div style={{ background: 'var(--surface-muted)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>LOWEST DAY</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#7c3aed', marginTop: '2px' }}>{lowPoint?.dayOfWeek || '—'} <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>({formatUnits(lowPoint?.predictedDemand, 0)} units)</span></div>
                </div>
              </div>
              {/* Forecast Chart */}
              <div style={{ height: '240px', width: '100%', marginBottom: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
                            <div style={{ fontWeight: '700', marginBottom: '4px' }}>{label} ({d.dayOfWeek})</div>
                            <div style={{ color: '#60a5fa' }}>Predicted: <strong>{formatUnits(d.predictedDemand, 0)} units</strong></div>
                            {d.lowerBound != null && d.upperBound != null && (
                              <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>Bounds: [{formatUnits(d.lowerBound, 0)} – {formatUnits(d.upperBound, 0)}]</div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Area type="monotone" dataKey="predictedDemand" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#forecastGrad)" name="Predicted Demand" />
                    <Line type="monotone" dataKey="upperBound" stroke="#93c5fd" strokeDasharray="4 4" strokeWidth={1} dot={false} name="Upper Bound" />
                    <Line type="monotone" dataKey="lowerBound" stroke="#93c5fd" strokeDasharray="4 4" strokeWidth={1} dot={false} name="Lower Bound" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Day-by-day weekly forecast table (Day 1 … Day 7) */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-muted)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '8px 12px' }}>Day</th>
                      <th style={{ padding: '8px 12px' }}>Date</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Forecast Demand</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Confidence Interval</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.map((pt, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: '700', color: 'var(--text-primary)' }}>Day {idx + 1}</td>
                        <td style={{ padding: '8px 12px', color: pt.isWeekend ? '#d97706' : 'var(--text-secondary)' }}>
                          {pt.date} · {pt.dayOfWeek}{pt.isWeekend ? ' (Weekend)' : ''}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', color: '#2563eb' }}>
                          {formatUnits(pt.predictedDemand, 0)} units
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {pt.lowerBound != null && pt.upperBound != null ? `[${formatUnits(pt.lowerBound, 0)} – ${formatUnits(pt.upperBound, 0)}]` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <FiActivity size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <p style={{ margin: 0 }}>Select a medicine and generate a weekly forecast to view projected demand.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicineDemandPrediction;
