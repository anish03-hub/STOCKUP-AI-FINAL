import React from 'react';
import ForecastChart from '../../components/forecast/ForecastChart';
import '../../styles/forecast/forecast.css';

const ForecastDetails = () => {
  return (
    <div className="forecast-page">
      <div className="forecast-header">
        <h1>Forecast Details: Paracetamol 500mg</h1>
      </div>

      <div className="forecast-chart-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>AI Insights & Contributing Factors</h3>
        <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '20px' }}>
          <li><strong>Seasonal Trend:</strong> Historic data shows a 15% increase in Paracetamol consumption during the upcoming flu season months (Oct-Nov).</li>
          <li><strong>Current Stock:</strong> 1,100 units currently available, which will safely cover ~5 days of predicted demand.</li>
          <li><strong>Supplier Lead Time:</strong> Standard lead time is 3 days. A reorder is recommended within 2 days to prevent stockouts.</li>
          <li><strong>Model Confidence:</strong> High (92%). The model has accurately predicted demand for this item within a 3% margin of error over the past 6 months.</li>
        </ul>
      </div>

      <div className="forecast-grid" style={{ gridTemplateColumns: '1fr' }}>
        <ForecastChart />
      </div>
    </div>
  );
};

export default ForecastDetails;
