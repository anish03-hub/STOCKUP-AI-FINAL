import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiAlertCircle } from 'react-icons/fi';
import { TbRobot } from 'react-icons/tb';
import '../../styles/forecast/forecast.css';

const ConfidenceRing = ({ score }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <svg className="confidence-ring" viewBox="0 0 50 50">
      <circle
        className="confidence-ring-bg"
        cx="25"
        cy="25"
        r={radius}
      />
      <circle
        className="confidence-ring-fill"
        cx="25"
        cy="25"
        r={radius}
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: strokeDashoffset
        }}
      />
      <text className="confidence-text" x="25" y="25">
        {score}%
      </text>
    </svg>
  );
};

const PredictionCard = ({ 
  medicineName = "Paracetamol 500mg", 
  predictedDemand = 1250, 
  confidenceScore = 92, 
  reorderSuggestion = "Reorder 500 units by next Tuesday to maintain optimal safety stock.",
  trend = "up",
  trendValue = "+12%"
}) => {
  return (
    <div className="prediction-card">
      <div className="prediction-header">
        <h2>{medicineName}</h2>
        <div className="ai-icon-wrapper">
          <TbRobot />
        </div>
      </div>

      <div className="prediction-body">
        <span className="prediction-label">7-Day Forecast Demand</span>
        <div className="prediction-value">{predictedDemand} <span style={{fontSize:'16px', color:'#64748b'}}>units</span></div>
        <div className={`prediction-trend ${trend}`}>
          {trend === 'up' ? <FiTrendingUp /> : <FiTrendingDown />}
          <span>{trendValue} vs last week</span>
        </div>
      </div>

      <div className="confidence-section">
        <div className="confidence-info">
          <span>AI Model Confidence</span>
          <strong>High Reliability</strong>
        </div>
        <ConfidenceRing score={confidenceScore} />
      </div>

      <div className="reorder-suggestion">
        <FiAlertCircle className="reorder-icon" />
        <div className="reorder-text">
          <h4>Action Required</h4>
          <p>{reorderSuggestion}</p>
        </div>
      </div>
    </div>
  );
};

export default PredictionCard;
