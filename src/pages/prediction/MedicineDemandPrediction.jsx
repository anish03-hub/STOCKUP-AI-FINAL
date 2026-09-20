import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
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
  FiSearch,
  FiPackage,
  FiChevronDown,
  FiX,
  FiLayers,
  FiShield,
  FiInfo,
  FiArrowRight,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { predictionApi, forecastApi, dailyForecastApi, itemApi, itemsApi } from '../../services/api';
import '../../styles/prediction/medicineDemand.css';

// ── Friendly error messages ───────────────────────────────────────────────────
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
  return msg || 'Unable to predict medicine demand right now. Please try again.';
};

const formatUnits = (value, decimals = 2) => {
  if (typeof value !== 'number' || isNaN(value)) return '—';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

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

const HISTORICAL_MEDICINES = [
  'Paracetamol',
  'Amoxicillin',
  'Azithromycin',
  'Ibuprofen',
  'Amlodipine',
  'Metformin',
  'Cetirizine',
  'Vitamin C',
  'Cough Syrup',
  'Multivitamin',
];

const MedicineDemandPrediction = () => {
  // Mode: 'daily' (Multi-day from 177K dataset) vs 'hourly' (Next-hour RF v2)
  const [activeMode, setActiveMode] = useState('daily');

  // ── Daily Multi-Day State ──────────────────────────────────────────────────
  const [dailyMedicine, setDailyMedicine] = useState('Paracetamol');
  const [dailyHorizon, setDailyHorizon] = useState(7);
  const [dailyPrediction, setDailyPrediction] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState('');
  const [dailyMetadata, setDailyMetadata] = useState(null);

  // ── Hourly State ───────────────────────────────────────────────────────────
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [quickMedicines, setQuickMedicines] = useState([]);
  const [hourlyPrediction, setHourlyPrediction] = useState(null);
  const [hourlyLoading, setHourlyLoading] = useState(false);
  const [hourlyError, setHourlyError] = useState('');
  const [saveWarning, setSaveWarning] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const dropdownRef = useRef(null);
  const api = itemApi || itemsApi;

  // Fetch model metadata on initial mount
  useEffect(() => {
    dailyForecastApi.metadata()
      .then((data) => setDailyMetadata(data))
      .catch((err) => console.warn('Could not load daily forecast metadata:', err));
  }, []);

  // Trigger initial daily forecast for default medicine
  useEffect(() => {
    let isMounted = true;
    const loadInitialForecast = async () => {
      setDailyLoading(true);
      setDailyError('');
      try {
        const res = await dailyForecastApi.predict(dailyMedicine, dailyHorizon);
        if (isMounted) {
          setDailyPrediction(res);
        }
      } catch (err) {
        if (isMounted) setDailyError(getFriendlyError(err));
      } finally {
        if (isMounted) setDailyLoading(false);
      }
    };
    loadInitialForecast();
    return () => { isMounted = false; };
  }, [dailyMedicine, dailyHorizon]);

  // Hourly search autocomplete
  const searchMedicines = useCallback(async (query = '') => {
    try {
      setIsSearching(true);
      const res = await api.getItems(0, 10, query);
      const items = res?.content || (Array.isArray(res) ? res : []);
      setSearchResults(items);
    } catch (err) {
      console.error('Failed to search medicines:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [api]);

  useEffect(() => {
    const initMedicines = async () => {
      try {
        const res = await api.getItems(0, 8, '');
        const items = res?.content || (Array.isArray(res) ? res : []);
        setQuickMedicines(items);
        if (items.length > 0 && !selectedMedicine) {
          setSelectedMedicine(items[0]);
          setSearchTerm(`${items[0].name} (${items[0].code})`);
        }
      } catch (err) {
        console.error('Failed to load initial medicines:', err);
      }
    };
    initMedicines();
  }, [api]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const timer = setTimeout(() => {
      searchMedicines(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, isDropdownOpen, searchMedicines]);

  const handleSelectMedicine = (item) => {
    setSelectedMedicine(item);
    setSearchTerm(`${item.name} (${item.code})`);
    setIsDropdownOpen(false);
    setHourlyPrediction(null);
    setHourlyError('');
    setSaveWarning('');
    setSaveSuccess(false);
  };

  const handleDailySubmit = async (e) => {
    e.preventDefault();
    if (dailyLoading) return;
    setDailyLoading(true);
    setDailyError('');
    try {
      const res = await dailyForecastApi.predict(dailyMedicine, dailyHorizon);
      setDailyPrediction(res);
    } catch (err) {
      setDailyError(getFriendlyError(err));
    } finally {
      setDailyLoading(false);
    }
  };

  const handleHourlySubmit = async (event) => {
    event.preventDefault();
    if (hourlyLoading) return;

    if (!selectedMedicine || !selectedMedicine.code) {
      setHourlyError('Please select a valid medicine from the database.');
      return;
    }

    setHourlyLoading(true);
    setHourlyError('');
    setSaveWarning('');
    setSaveSuccess(false);
    setHourlyPrediction(null);

    const productCode = selectedMedicine.code;

    try {
      const response = await predictionApi.medicineDemand(productCode);
      setHourlyPrediction(response);

      try {
        const forecastDate = new Date(Date.now() + 3600 * 1000).toISOString();
        await forecastApi.save({
          productCode: selectedMedicine.code,
          productName: selectedMedicine.name,
          forecastDate,
          predictedDemand: response.predictedNextHourDemand,
          model: 'RandomForest v2',
          confidence: null,
        });
        setSaveSuccess(true);
      } catch (saveErr) {
        console.warn('Failed to save forecast history:', saveErr);
        setSaveWarning('Prediction succeeded, but could not be saved to forecast history.');
      }
    } catch (err) {
      setHourlyError(getFriendlyError(err));
    } finally {
      setHourlyLoading(false);
    }
  };

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
            Leverage Machine Learning models trained on <strong>177,990 historical transactions</strong> to forecast multi-day patient demand, optimize safety buffers, and prevent stockouts.
          </p>
        </div>
        <div className="md-pipeline-badge">
          <FiDatabase className="md-pipeline-icon" />
          <span>PostgreSQL → Spring Boot → FastAPI → ML Models</span>
        </div>
      </header>

      {/* Model Mode Tab Selector */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setActiveMode('daily')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: activeMode === 'daily' ? '2px solid #2563eb' : '1.5px solid #cbd5e1',
            background: activeMode === 'daily' ? '#eff6ff' : '#ffffff',
            color: activeMode === 'daily' ? '#1d4ed8' : '#64748b',
            boxShadow: activeMode === 'daily' ? '0 4px 12px rgba(37,99,235,0.15)' : 'none',
          }}
        >
          <FiCalendar size={16} />
          Multi-Day Daily Demand (Historical Dataset)
          <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
            177K Dataset
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('hourly')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: activeMode === 'hourly' ? '2px solid #2563eb' : '1.5px solid #cbd5e1',
            background: activeMode === 'hourly' ? '#eff6ff' : '#ffffff',
            color: activeMode === 'hourly' ? '#1d4ed8' : '#64748b',
            boxShadow: activeMode === 'hourly' ? '0 4px 12px rgba(37,99,235,0.15)' : 'none',
          }}
        >
          <FiClock size={16} />
          Next-Hour Demand (Hourly RF v2)
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODE 1: MULTI-DAY DAILY DEMAND FORECASTING                          */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeMode === 'daily' && (
        <>
          {dailyError && (
            <div className="md-alert" role="alert">
              <FiAlertCircle className="md-alert-icon" />
              <span>{dailyError}</span>
              <button className="md-alert-dismiss" onClick={() => setDailyError('')}>×</button>
            </div>
          )}

          {dailyPrediction && dailyPrediction.hasHistoricalData === false && (
            <div style={{
              background: '#fffbeb',
              border: '1.5px solid #fef3c7',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start'
            }}>
              <FiInfo size={24} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#92400e', margin: '0 0 6px 0' }}>
                  No Historical Sales Data Available for Your Company
                </h3>
                <p style={{ fontSize: '14px', color: '#b45309', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                  {dailyPrediction.message || 'Your company account currently has 0 historical sales records. To activate multi-day daily demand predictions, import your historical sales CSV into PostgreSQL.'}
                </p>
                <a
                  href="/sales-analytics"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#ffffff',
                    background: '#d97706',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none'
                  }}
                >
                  View Sales Analytics & Data Guidelines <FiArrowRight />
                </a>
              </div>
            </div>
          )}

          <div className="md-grid">
            {/* Left Panel: Configuration Form */}
            <form className="md-panel md-form-panel" onSubmit={handleDailySubmit}>
              <div className="md-panel-header">
                <FiBarChart2 className="md-panel-icon" />
                <div>
                  <h2 className="md-panel-title">Forecast Parameters</h2>
                  <p className="md-panel-desc">
                    Select target medicine and forecast horizon.
                  </p>
                </div>
              </div>

              {/* Medicine Selector */}
              <div className="md-field">
                <label htmlFor="daily-med-select" className="md-field-label">Target Medicine</label>
                <div className="md-select-wrapper">
                  <select
                    id="daily-med-select"
                    className="md-select"
                    value={dailyMedicine}
                    onChange={(e) => setDailyMedicine(e.target.value)}
                    disabled={dailyLoading}
                  >
                    {HISTORICAL_MEDICINES.map((med) => (
                      <option key={med} value={med}>{med}</option>
                    ))}
                  </select>
                  <FiChevronDown className="md-select-chevron" />
                </div>
              </div>

              {/* Quick-Pick Pills */}
              <div style={{ marginTop: '-4px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                  Popular Dataset Medicines:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {HISTORICAL_MEDICINES.slice(0, 6).map((med) => (
                    <button
                      key={med}
                      type="button"
                      onClick={() => setDailyMedicine(med)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        border: dailyMedicine === med ? '1px solid #2563eb' : '1px solid #e2e8f0',
                        background: dailyMedicine === med ? '#eff6ff' : '#f8fafc',
                        color: dailyMedicine === med ? '#1d4ed8' : '#475569',
                      }}
                    >
                      {med}
                    </button>
                  ))}
                </div>
              </div>

              {/* Forecast Horizon Selector */}
              <div className="md-field">
                <label className="md-field-label">Forecast Horizon</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDailyHorizon(days)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        border: dailyHorizon === days ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                        background: dailyHorizon === days ? '#eff6ff' : '#ffffff',
                        color: dailyHorizon === days ? '#1d4ed8' : '#64748b',
                      }}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Info Card */}
              {dailyMetadata && dailyMetadata.metrics && (
                <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiShield style={{ color: '#2563eb' }} /> Model: {dailyMetadata.model_name} v{dailyMetadata.version}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span>Holdout MAE: <strong>{dailyMetadata.metrics.ml_model?.mae}</strong></span>
                    <span>WAPE: <strong>{dailyMetadata.metrics.ml_model?.wape_pct}%</strong></span>
                    <span>R²: <strong>{dailyMetadata.metrics.ml_model?.r2}</strong></span>
                  </div>
                  <div style={{ marginTop: '6px', color: '#059669', fontWeight: '600' }}>
                    ⚡ {dailyMetadata.metrics.mae_improvement_vs_naive_pct}% accuracy gain vs Naive Baseline
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="md-submit-btn"
                disabled={dailyLoading}
                style={{ marginTop: '16px' }}
              >
                {dailyLoading ? (
                  <>
                    <FiRefreshCw className="animate-spin" />
                    Calculating Multi-Step Forecast...
                  </>
                ) : (
                  <>
                    <FiActivity />
                    Generate {dailyHorizon}-Day Forecast
                  </>
                )}
              </button>
            </form>

            {/* Right Panel: Results & Chart */}
            <div className="md-panel md-result-panel">
              <div className="md-panel-header">
                <FiTrendingUp className="md-panel-icon" />
                <div>
                  <h2 className="md-panel-title">
                    {dailyMedicine} — {dailyHorizon}-Day Projected Demand
                  </h2>
                  <p className="md-panel-desc">
                    Recursive multi-step time series forecast with uncertainty intervals.
                  </p>
                </div>
              </div>

              {dailyPrediction && dailyPrediction.forecast && dailyPrediction.forecast.length > 0 ? (
                <>
                  {/* KPI Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: 'var(--surface-muted)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>TOTAL UNITS</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {formatUnits(dailyPrediction.totalPredictedUnits, 0)}
                      </div>
                    </div>
                    <div style={{ background: 'var(--surface-muted)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>DAILY AVG</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>
                        {formatUnits(dailyPrediction.averageDailyDemand, 1)} <span style={{ fontSize: '12px' }}>units/day</span>
                      </div>
                    </div>
                    <div style={{ background: 'var(--surface-muted)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>CATEGORY</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#059669', marginTop: '2px' }}>
                        {dailyPrediction.category || 'Therapeutic'}
                      </div>
                    </div>
                    <div style={{ background: 'var(--surface-muted)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>MODEL MAE</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#7c3aed' }}>
                        ±{dailyPrediction.metrics?.mae || '60.82'}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Forecast Chart */}
                  <div style={{ height: '260px', width: '100%', marginBottom: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyPrediction.forecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
                                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>{label} ({d.dayOfWeek})</div>
                                  <div style={{ color: '#60a5fa' }}>Predicted: <strong>{d.predictedDemand} units</strong></div>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                                    Bounds: [{d.lowerBound} - {d.upperBound}]
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area type="monotone" dataKey="predictedDemand" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#forecastGrad)" name="Predicted Demand" />
                        <Line type="monotone" dataKey="upperBound" stroke="#93c5fd" strokeDasharray="4 4" strokeWidth={1} dot={false} name="Upper Bound" />
                        <Line type="monotone" dataKey="lowerBound" stroke="#93c5fd" strokeDasharray="4 4" strokeWidth={1} dot={false} name="Lower Bound" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Daily Schedule Table */}
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-muted)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '8px 12px' }}>Date</th>
                          <th style={{ padding: '8px 12px' }}>Day</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Forecast Demand</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Confidence Interval</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyPrediction.forecast.map((pt, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 12px', fontWeight: '600', color: 'var(--text-primary)' }}>{pt.date}</td>
                            <td style={{ padding: '8px 12px', color: pt.isWeekend ? '#d97706' : 'var(--text-secondary)' }}>
                              {pt.dayOfWeek} {pt.isWeekend && '(Weekend)'}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', color: '#2563eb' }}>
                              {pt.predictedDemand} units
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                              [{pt.lowerBound} – {pt.upperBound}]
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <FiActivity size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                  <p style={{ margin: 0 }}>Select a medicine and click <strong>Generate Forecast</strong> to view ML demand projections.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODE 2: HOURLY DEMAND FORECASTING (EXISTING RF v2 MODEL)             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeMode === 'hourly' && (
        <>
          {hourlyError && (
            <div className="md-alert" role="alert">
              <FiAlertCircle className="md-alert-icon" />
              <span>{hourlyError}</span>
              <button className="md-alert-dismiss" onClick={() => setHourlyError('')}>×</button>
            </div>
          )}

          {saveWarning && (
            <div className="md-alert" role="alert" style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
              <FiAlertCircle className="md-alert-icon" style={{ color: '#d97706' }} />
              <span>{saveWarning}</span>
              <button className="md-alert-dismiss" onClick={() => setSaveWarning('')} style={{ color: '#92400e' }}>×</button>
            </div>
          )}

          <div className="md-grid">
            <form className="md-panel md-form-panel" onSubmit={handleHourlySubmit} noValidate>
              <div className="md-panel-header">
                <FiBarChart2 className="md-panel-icon" />
                <div>
                  <h2 className="md-panel-title">Select Live Medicine</h2>
                  <p className="md-panel-desc">
                    Search the live database by brand name, active ingredient, or NDC code.
                  </p>
                </div>
              </div>

              {/* Searchable Autocomplete */}
              <div className="md-field" ref={dropdownRef} style={{ position: 'relative' }}>
                <span className="md-field-label">Search Medicine</span>
                <div className="md-select-wrapper" style={{ position: 'relative' }}>
                  <FiSearch style={{ position: 'absolute', left: '14px', color: '#94a3b8', zIndex: 2, pointerEvents: 'none' }} />
                  <input
                    type="text"
                    className="md-select"
                    style={{ paddingLeft: '40px', paddingRight: '40px', fontWeight: '500', fontSize: '14px' }}
                    placeholder="Type to search (e.g., Humulin, Aspirin)..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setIsDropdownOpen(true);
                      if (searchResults.length === 0) searchMedicines(searchTerm);
                    }}
                    disabled={hourlyLoading}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => { setSearchTerm(''); searchMedicines(''); setIsDropdownOpen(true); }}
                      style={{ position: 'absolute', right: '32px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                      title="Clear search"
                    >
                      <FiX size={14} />
                    </button>
                  )}
                  <FiChevronDown className="md-select-chevron" />
                </div>

                {isDropdownOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: '4px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', maxHeight: '280px', overflowY: 'auto' }}>
                    {isSearching ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        <FiRefreshCw className="animate-spin" /> Searching...
                      </div>
                    ) : (
                      searchResults.map((item) => (
                        <div
                          key={item.id || item.code}
                          onClick={() => handleSelectMedicine(item)}
                          style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.code} · {item.category}</div>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#059669', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                            {item.quantity} in stock
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Quick-Pick DB Medicines */}
              <div style={{ marginTop: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                  Quick Pick Popular Medicines:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {quickMedicines.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleSelectMedicine(item)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        border: selectedMedicine?.code === item.code ? '1px solid #2563eb' : '1px solid var(--border)',
                        background: selectedMedicine?.code === item.code ? 'rgba(37, 99, 235, 0.15)' : 'var(--surface-muted)',
                        color: selectedMedicine?.code === item.code ? 'var(--primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="md-submit-btn" disabled={hourlyLoading}>
                {hourlyLoading ? (
                  <>
                    <FiRefreshCw className="animate-spin" />
                    Predicting Next-Hour Demand...
                  </>
                ) : (
                  <>
                    <FiActivity />
                    Predict Next-Hour Demand
                  </>
                )}
              </button>
            </form>

            {/* Results Panel */}
            <div className="md-panel md-result-panel">
              <div className="md-panel-header">
                <FiTrendingUp className="md-panel-icon" />
                <div>
                  <h2 className="md-panel-title">Prediction Output</h2>
                  <p className="md-panel-desc">
                    Next-hour demand prediction from Random Forest v2 ML model.
                  </p>
                </div>
              </div>

              {hourlyPrediction ? (
                <div>
                  <div className="md-stat-card md-stat-primary" style={{ marginBottom: '16px' }}>
                    <div className="md-stat-label">PREDICTED NEXT-HOUR DEMAND</div>
                    <div className="md-stat-value" style={{ fontSize: '32px', color: '#2563eb', fontWeight: '700' }}>
                      {formatUnits(hourlyPrediction.predictedNextHourDemand, 4)}
                      <span className="md-stat-unit"> units / hr</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div style={{ background: 'var(--surface-muted)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PRODUCT CODE</div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{hourlyPrediction.productCode}</div>
                    </div>
                    <div style={{ background: 'var(--surface-muted)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>LATEST OBSERVED</div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{hourlyPrediction.latestObservedDemand} units</div>
                    </div>
                  </div>

                  {saveSuccess && (
                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '13px', fontWeight: '500' }}>
                      <FiCheckCircle /> Recorded to forecast history timeline.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <FiClock size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                  <p style={{ margin: 0 }}>Select a medicine and click <strong>Predict Next-Hour Demand</strong>.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MedicineDemandPrediction;
