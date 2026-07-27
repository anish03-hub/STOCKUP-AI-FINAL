import React from 'react';
import '../../styles/inventory/inventory.css';

const StockLevelBar = ({ current, max, unit = '' }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  
  let statusClass = 'good';
  if (percentage < 30) {
    statusClass = 'low';
  } else if (percentage <= 60) {
    statusClass = 'medium';
  }

  return (
    <div className="stock-level-bar">
      <div className="stock-level-track">
        <div 
          className={`stock-level-fill ${statusClass}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <span className="stock-level-label">
        {Math.round(percentage)}%
      </span>
    </div>
  );
};

export default StockLevelBar;
