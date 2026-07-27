import React from 'react';

const SummaryCards = () => {
  return (
    <div className="summary-cards-container">
      <div className="summary-card glass-panel">
        <div className="card-header">
          <span>Total Medicines</span>
          <div className="card-icon" style={{ background: 'rgba(30, 136, 255, 0.2)', color: 'var(--color-accent)' }}>
            💊
          </div>
        </div>
        <div className="card-value">1,245</div>
        <div className="card-trend trend-up">
          <span>↑ 12%</span>
          <span style={{color: 'var(--color-text-muted)'}}>vs last month</span>
        </div>
      </div>
      <div className="summary-card glass-panel">
        <div className="card-header">
          <span>Available Stock</span>
          <div className="card-icon" style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--color-success)' }}>
            📦
          </div>
        </div>
        <div className="card-value">15,420</div>
        <div className="card-trend trend-up">
          <span>↑ 5%</span>
          <span style={{color: 'var(--color-text-muted)'}}>vs last month</span>
        </div>
      </div>
      <div className="summary-card glass-panel">
        <div className="card-header">
          <span>Low Stock Alerts</span>
          <div className="card-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--color-warning)' }}>
            ⚠️
          </div>
        </div>
        <div className="card-value">34</div>
        <div className="card-trend trend-down">
          <span>↓ 2%</span>
          <span style={{color: 'var(--color-text-muted)'}}>vs last month</span>
        </div>
      </div>
      <div className="summary-card glass-panel">
        <div className="card-header">
          <span>Expired Items</span>
          <div className="card-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)' }}>
            ❌
          </div>
        </div>
        <div className="card-value">12</div>
        <div className="card-trend trend-down">
          <span>↑ 1%</span>
          <span style={{color: 'var(--color-text-muted)'}}>vs last month</span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
