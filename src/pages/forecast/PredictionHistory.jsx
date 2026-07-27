import React from 'react';
import '../../styles/forecast/forecast.css';

const predictionData = [
  { id: 1, date: '2023-10-01', medicine: 'Paracetamol 500mg', predicted: 1200, actual: 1180, accuracy: 98.3, model: 'v2.4.1' },
  { id: 2, date: '2023-10-01', medicine: 'Amoxicillin 250mg', predicted: 450, actual: 420, accuracy: 93.3, model: 'v2.4.1' },
  { id: 3, date: '2023-09-24', medicine: 'Ibuprofen 400mg', predicted: 800, actual: 650, accuracy: 81.2, model: 'v2.4.0' },
  { id: 4, date: '2023-09-24', medicine: 'Omeprazole 20mg', predicted: 300, actual: 310, accuracy: 96.6, model: 'v2.4.0' },
  { id: 5, date: '2023-09-17', medicine: 'Cetirizine 10mg', predicted: 500, actual: 320, accuracy: 64.0, model: 'v2.3.9' },
  { id: 6, date: '2023-09-17', medicine: 'Vitamin C 1000mg', predicted: 900, actual: 880, accuracy: 97.7, model: 'v2.3.9' },
];

const getAccuracyBadge = (accuracy) => {
  if (accuracy >= 90) return <span className="accuracy-badge high">{accuracy}%</span>;
  if (accuracy >= 70) return <span className="accuracy-badge medium">{accuracy}%</span>;
  return <span className="accuracy-badge low">{accuracy}%</span>;
};

const PredictionHistory = () => {
  return (
    <div className="forecast-page">
      <div className="forecast-header">
        <h1>Prediction History & Accuracy</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Review past AI predictions vs actual consumption</p>
      </div>

      <div className="prediction-history-card">
        <table className="prediction-history-table">
          <thead>
            <tr>
              <th>Prediction Date</th>
              <th>Medicine</th>
              <th>Predicted Demand</th>
              <th>Actual Demand</th>
              <th>Accuracy</th>
              <th>Model Version</th>
            </tr>
          </thead>
          <tbody>
            {predictionData.map((row) => (
              <tr key={row.id}>
                <td>{row.date}</td>
                <td style={{ fontWeight: 500, color: '#0f172a' }}>{row.medicine}</td>
                <td>{row.predicted}</td>
                <td>{row.actual}</td>
                <td>{getAccuracyBadge(row.accuracy)}</td>
                <td style={{ color: '#64748b', fontSize: '12px' }}>{row.model}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PredictionHistory;
