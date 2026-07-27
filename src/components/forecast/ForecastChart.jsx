import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import '../../styles/forecast/forecast.css';

const data = [
  // Past 7 days (Historical)
  { date: 'Oct 1', actual: 110, forecast: 115, upper: 125, lower: 105 },
  { date: 'Oct 2', actual: 130, forecast: 125, upper: 135, lower: 115 },
  { date: 'Oct 3', actual: 125, forecast: 130, upper: 140, lower: 120 },
  { date: 'Oct 4', actual: 145, forecast: 140, upper: 155, lower: 125 },
  { date: 'Oct 5', actual: 140, forecast: 145, upper: 160, lower: 130 },
  { date: 'Oct 6', actual: 155, forecast: 150, upper: 165, lower: 135 },
  { date: 'Oct 7', actual: 160, forecast: 155, upper: 170, lower: 140 },
  // Future 7 days (Forecast)
  { date: 'Oct 8', forecast: 165, upper: 180, lower: 150, isFuture: true },
  { date: 'Oct 9', forecast: 172, upper: 190, lower: 155, isFuture: true },
  { date: 'Oct 10', forecast: 168, upper: 185, lower: 150, isFuture: true },
  { date: 'Oct 11', forecast: 180, upper: 200, lower: 160, isFuture: true },
  { date: 'Oct 12', forecast: 185, upper: 205, lower: 165, isFuture: true },
  { date: 'Oct 13', forecast: 175, upper: 195, lower: 155, isFuture: true },
  { date: 'Oct 14', forecast: 190, upper: 215, lower: 165, isFuture: true },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const isFuture = payload[0].payload.isFuture;
    return (
      <div className="custom-tooltip">
        <p className="label">{label} {isFuture ? '(Predicted)' : '(Actual)'}</p>
        <div className="tooltip-data">
          {payload.map((entry, index) => {
            // Hide confidence bands from tooltip unless explicitly needed
            if (entry.dataKey === 'upper' || entry.dataKey === 'lower') return null;
            return (
              <p key={index} style={{ color: entry.color }}>
                <span>{entry.name}:</span>
                <strong>{entry.value} units</strong>
              </p>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const ForecastChart = () => {
  return (
    <div className="forecast-chart-card">
      <div className="chart-header">
        <h3>Demand Forecast Analysis</h3>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color historical"></div>
            <span>Historical Actuals</span>
          </div>
          <div className="legend-item">
            <div className="legend-color forecast"></div>
            <span>AI Forecast (Dashed)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{background: '#ede9fe'}}></div>
            <span>Confidence Interval</span>
          </div>
        </div>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x="Oct 7" stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: '#64748b', fontSize: 12 }} />
            
            {/* Confidence Band (Upper - Lower) */}
            <Area type="monotone" dataKey="upper" stroke="none" fill="#ede9fe" />
            <Area type="monotone" dataKey="lower" stroke="none" fill="#ffffff" />
            
            {/* Main Lines */}
            <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
            <Area type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForecast)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ForecastChart;
