import React, { useEffect, useMemo, useState } from 'react';
import PredictionCard from '../../components/forecast/PredictionCard';
import ForecastChart from '../../components/forecast/ForecastChart';
import DataTable from '../../components/common/DataTable';
import { FiDownload, FiCpu, FiCalendar, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { forecastApi } from '../../services/api';
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

const formatUnits = (value, decimals = 4) => {
  if (typeof value !== 'number' || isNaN(value)) return '—';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

const ForecastDashboard = () => {
  const [forecasts, setForecasts] = useState([]);
  const [selectedCode, setSelectedCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await forecastApi.history();
        if (isMounted) {
          const list = Array.isArray(data) ? data : [];
          setForecasts(list);
          if (list.length > 0) {
            setSelectedCode((prev) => {
              if (prev && list.some((item) => item.productCode === prev)) {
                return prev;
              }
              return list[0].productCode || '';
            });
          } else {
            setSelectedCode('');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to fetch forecast history');
          setForecasts([]);
          setSelectedCode('');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  const medicineOptions = useMemo(() => {
    const map = new Map();
    forecasts.forEach((f) => {
      if (f.productCode && !map.has(f.productCode)) {
        map.set(f.productCode, {
          code: f.productCode,
          name: f.productName ? `${f.productName} (${f.productCode})` : f.productCode,
        });
      }
    });
    return Array.from(map.values());
  }, [forecasts]);

  const selectedForecast = useMemo(() => {
    if (!selectedCode || forecasts.length === 0) return null;
    return forecasts.find((f) => f.productCode === selectedCode) || null;
  }, [forecasts, selectedCode]);

  const selectedForecastHistory = useMemo(() => {
    if (!selectedCode || forecasts.length === 0) return [];
    return forecasts
      .filter((f) => f.productCode === selectedCode)
      .slice()
      .sort((a, b) => {
        const timeA = new Date(a.forecastDate || a.createdAt || 0).getTime();
        const timeB = new Date(b.forecastDate || b.createdAt || 0).getTime();
        return timeA - timeB;
      });
  }, [forecasts, selectedCode]);

  const columns = useMemo(
    () => [
      { key: 'id', title: 'Forecast ID', accessor: 'id', sortable: true },
      { key: 'name', title: 'Medicine', accessor: 'name', sortable: true },
      { key: 'code', title: 'Product Code', accessor: 'code', sortable: true },
      { key: 'forecastDate', title: 'Forecast Target', accessor: 'forecastDate', sortable: true },
      { key: 'demand', title: 'Predicted Demand', accessor: 'demand', sortable: true },
      { key: 'model', title: 'Model', accessor: 'model', sortable: true },
      { key: 'confidence', title: 'Confidence', accessor: 'confidence', sortable: true },
      { key: 'createdAt', title: 'Recorded At', accessor: 'createdAt', sortable: true },
    ],
    []
  );

  const forecastRows = useMemo(() => {
    return forecasts.map((f) => ({
      id: f.id ? (f.id.length > 8 ? `${f.id.substring(0, 8)}…` : f.id) : '—',
      fullId: f.id || '',
      name: f.productName || '—',
      code: f.productCode || '—',
      forecastDate: formatTimestamp(f.forecastDate),
      demand: typeof f.predictedDemand === 'number' ? `${formatUnits(f.predictedDemand, 4)} units` : '—',
      model: f.model || '—',
      confidence: f.confidence != null ? `${f.confidence}%` : '—',
      createdAt: formatTimestamp(f.createdAt),
    }));
  }, [forecasts]);

  return (
    <div className="forecast-page">
      <div className="forecast-header">
        <h1>Demand Forecasting</h1>
        <button className="btn-export" type="button">
          <FiDownload /> Export Report
        </button>
      </div>

      {error && (
        <div
          className="alert alert-error"
          role="alert"
          style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
          }}
        >
          <FiAlertCircle />
          <span>Error loading forecast history: {error}</span>
        </div>
      )}

      <div className="medicine-selector">
        <label htmlFor="medicine-select" style={{ fontWeight: 500, color: '#475569' }}>
          Select Item:
        </label>
        <select
          id="medicine-select"
          value={selectedCode}
          onChange={(e) => setSelectedCode(e.target.value)}
          disabled={loading || medicineOptions.length === 0}
        >
          {medicineOptions.length > 0 ? (
            medicineOptions.map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))
          ) : (
            <option value="">{loading ? 'Loading forecast medicines…' : 'No forecast records available'}</option>
          )}
        </select>
      </div>

      <div className="metrics-row">
        <div className="forecast-metric">
          <div className="metric-icon blue">
            <FiTrendingUp />
          </div>
          <div className="metric-content">
            <span>Predicted Next-Hour Demand</span>
            <strong>{selectedForecast ? `${formatUnits(selectedForecast.predictedDemand, 4)} Units` : '—'}</strong>
          </div>
        </div>
        <div className="forecast-metric">
          <div className="metric-icon green">
            <FiCalendar />
          </div>
          <div className="metric-content">
            <span>Forecast Target</span>
            <strong>{selectedForecast ? formatTimestamp(selectedForecast.forecastDate) : '—'}</strong>
          </div>
        </div>
        <div className="forecast-metric">
          <div className="metric-icon purple">
            <FiCpu />
          </div>
          <div className="metric-content">
            <span>Model</span>
            <strong>{selectedForecast?.model || '—'}</strong>
          </div>
        </div>
      </div>

      <div className="forecast-grid">
        <PredictionCard
          medicineName={
            selectedForecast
              ? (selectedForecast.productName ? `${selectedForecast.productName} (${selectedForecast.productCode})` : selectedForecast.productCode)
              : '—'
          }
          predictedDemand={selectedForecast?.predictedDemand}
          forecastDate={selectedForecast?.forecastDate}
          model={selectedForecast?.model}
        />
        <ForecastChart data={selectedForecastHistory} />
      </div>

      <DataTable
        data={forecastRows}
        columns={columns}
        title="Forecast History"
        subtitle="Review real demand planning outcomes and forecast logs from Spring Boot"
        searchPlaceholder="Search forecast history…"
        searchable
        pageSize={8}
        loading={loading}
        emptyMessage="No forecast history found. Run a prediction from the Medicine Demand page to record forecasts."
      />
    </div>
  );
};

export default ForecastDashboard;
