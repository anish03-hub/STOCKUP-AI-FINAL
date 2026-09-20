import React from 'react';

const SummaryCards = ({ medicines = [], totalElements, summary = null, loading = false, error = null }) => {
  // If API error occurred, show placeholder dashes rather than false zero counts
  if (error) {
    return (
      <div className="summary-cards-container">
        <div className="summary-card glass-panel">
          <div className="card-header">
            <span>Total Medicines</span>
            <div className="card-icon" style={{ background: 'rgba(30, 136, 255, 0.2)', color: 'var(--color-accent)' }}>💊</div>
          </div>
          <div className="card-value" style={{ color: '#94a3b8' }}>—</div>
          <div className="card-trend trend-down"><span>Unavailable</span></div>
        </div>
        <div className="summary-card glass-panel">
          <div className="card-header">
            <span>Available Stock</span>
            <div className="card-icon" style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--color-success)' }}>📦</div>
          </div>
          <div className="card-value" style={{ color: '#94a3b8' }}>—</div>
          <div className="card-trend trend-down"><span>Unavailable</span></div>
        </div>
        <div className="summary-card glass-panel">
          <div className="card-header">
            <span>Low Stock Alerts</span>
            <div className="card-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--color-warning)' }}>⚠️</div>
          </div>
          <div className="card-value" style={{ color: '#94a3b8' }}>—</div>
          <div className="card-trend trend-down"><span>Unavailable</span></div>
        </div>
        <div className="summary-card glass-panel">
          <div className="card-header">
            <span>Expired Items</span>
            <div className="card-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)' }}>❌</div>
          </div>
          <div className="card-value" style={{ color: '#94a3b8' }}>—</div>
          <div className="card-trend trend-down"><span>Unavailable</span></div>
        </div>
      </div>
    );
  }

  const totalMedicines = summary?.totalItems != null 
    ? summary.totalItems 
    : (totalElements != null ? totalElements : medicines.length);

  const totalStock = summary?.totalStock != null
    ? summary.totalStock
    : medicines.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const lowStockCount = summary?.lowStockItemsCount != null
    ? summary.lowStockItemsCount
    : medicines.filter(item => (item.quantity || 0) <= 50).length;

  const expiredCount = summary?.criticalExpiryItemsCount != null
    ? summary.criticalExpiryItemsCount
    : medicines.filter(item => String(item.status || '').toUpperCase().includes('EXPIRED')).length;

  return (
    <div className="summary-cards-container">
      <div className="summary-card glass-panel">
        <div className="card-header">
          <span>Total Medicines</span>
          <div className="card-icon" style={{ background: 'rgba(30, 136, 255, 0.2)', color: 'var(--color-accent)' }}>
            💊
          </div>
        </div>
        <div className="card-value">{loading && !summary ? '...' : totalMedicines.toLocaleString()}</div>
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
        <div className="card-value">{loading && !summary ? '...' : totalStock.toLocaleString()}</div>
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
        <div className="card-value">{loading && !summary ? '...' : lowStockCount.toLocaleString()}</div>
        <div className="card-trend trend-down">
          <span>&lt;= 50 units</span>
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
        <div className="card-value">{loading && !summary ? '...' : expiredCount.toLocaleString()}</div>
        <div className="card-trend trend-down">
          <span>Requires</span>
          <span style={{color: 'var(--color-text-muted)'}}>attention</span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
