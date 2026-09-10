import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiInbox } from 'react-icons/fi';
import '../../styles/forecast/forecast.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p className="label">{label}</p>
        <div className="tooltip-data">
          <p style={{ color: '#8b5cf6' }}>
            <span>Predicted Demand:</span>
            <strong>{payload[0].value} units</strong>
          </p>
          <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
            <span>Model:</span>
            <strong>{item.model || '—'}</strong>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const ForecastChart = ({ data = [] }) => {
  const chartData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    return data
      .filter((item) => item && item.predictedDemand != null && !isNaN(Number(item.predictedDemand)))
      .map((item) => {
        const dateObj = item.forecastDate
          ? new Date(item.forecastDate)
          : (item.createdAt ? new Date(item.createdAt) : null);

        const formattedDate = dateObj && !isNaN(dateObj.getTime())
          ? dateObj.toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : (item.forecastDate || '—');

        return {
          rawDate: dateObj && !isNaN(dateObj.getTime()) ? dateObj.getTime() : 0,
          date: formattedDate,
          demand: Number(item.predictedDemand),
          model: item.model || '—',
          productName: item.productName || item.productCode || 'Medicine',
          productCode: item.productCode || '',
        };
      })
      .sort((a, b) => a.rawDate - b.rawDate);
  }, [data]);

  return (
    <div className="forecast-chart-card">
      <div className="chart-header">
        <h3>Predicted Demand History</h3>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#8b5cf6' }}></div>
            <span>Predicted Demand</span>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '340px',
            color: '#64748b',
            textAlign: 'center',
            padding: '24px',
          }}
        >
          <FiInbox style={{ fontSize: '36px', color: '#94a3b8', marginBottom: '12px' }} />
          <p style={{ fontWeight: 600, color: '#334155', margin: '0 0 6px' }}>
            No forecast history available for this medicine.
          </p>
          <p style={{ fontSize: '13px', margin: 0, color: '#64748b' }}>
            Run a demand prediction to generate forecast history.
          </p>
        </div>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="demand"
                name="Predicted Demand"
                stroke="#8b5cf6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorDemand)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ForecastChart;
