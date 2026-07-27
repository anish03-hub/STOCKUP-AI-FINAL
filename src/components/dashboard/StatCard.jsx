import React from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import '../../styles/dashboard/dashboard.css';

const StatCard = ({ title, value, icon, trend, trendLabel, color, bgColor }) => {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <div className="stat-card" style={{ '--stat-color': color, '--stat-bg': bgColor }}>
      <div className="stat-card-icon">
        {icon}
      </div>
      <div className="stat-card-content">
        <div className="stat-card-label">{title}</div>
        <div className="stat-card-value">{value}</div>
        <div className={`stat-card-trend ${isPositive ? 'trend-up' : isNegative ? 'trend-down' : 'trend-neutral'}`}>
          {isPositive && <FiArrowUp />}
          {isNegative && <FiArrowDown />}
          <span>{Math.abs(trend)}% {trendLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
