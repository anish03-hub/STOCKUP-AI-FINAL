import React from 'react';

const SummaryCards = ({ medicines = [] }) => {
  const totalMedicines = medicines.length;
  const totalStock = medicines.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const lowStockCount = medicines.filter(item => (item.quantity || 0) <= 20).length;
  const expiredCount = medicines.filter(item => item.status?.toLowerCase() === 'expired').length;

  return (
    <div className="summary-cards-container">
      <div className="summary-card glass-panel">
        <div className="card-header">
          <span>Total Medicines</span>
          <div className="card-icon" style={{ background: 'rgba(30, 136, 255, 0.2)', color: 'var(--color-accent)' }}>
            💊
          </div>
        </div>
        <div className="card-value">{totalMedicines.toLocaleString()}</div>
        <div className="card-trend trend-up">
          <span>Active</span>
          <span style={{color: 'var(--color-text-muted)'}}>catalog items</span>
        </div>
      </div>
      <div className="summary-card glass-panel">
        <div className="card-header">
          <span>Available Stock</span>
          <div className="card-icon" style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--color-success)' }}>
            📦
          </div>
        </div>
        <div className="card-value">{totalStock.toLocaleString()}</div>
        <div className="card-trend trend-up">
          <span>Units</span>
          <span style={{color: 'var(--color-text-muted)'}}>in warehouse</span>
        </div>
      </div>
      <div className="summary-card glass-panel">
        <div className="card-header">
          <span>Low Stock Alerts</span>
          <div className="card-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--color-warning)' }}>
            ⚠️
          </div>
        </div>
        <div className="card-value">{lowStockCount.toLocaleString()}</div>
        <div className="card-trend trend-down">
          <span>&lt;= 20 units</span>
          <span style={{color: 'var(--color-text-muted)'}}>threshold</span>
        </div>
      </div>
      <div className="summary-card glass-panel">
        <div className="card-header">
          <span>Expired Items</span>
          <div className="card-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)' }}>
            ❌
          </div>
        </div>
        <div className="card-value">{expiredCount.toLocaleString()}</div>
        <div className="card-trend trend-down">
          <span>Requires</span>
          <span style={{color: 'var(--color-text-muted)'}}>disposal</span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
