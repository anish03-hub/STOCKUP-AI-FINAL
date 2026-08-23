import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiActivity,
  FiDollarSign,
  FiAlertTriangle,
  FiPackage,
  FiAlertCircle,
  FiRefreshCw,
  FiArrowRightCircle,
  FiCheckCircle
} from 'react-icons/fi';
import '../../styles/dashboard/dashboard.css';
import { getDashboardSummary } from '../../services/api';

const InventoryHealthDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getDashboardSummary();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-spinner"></div>
          <h2>Loading Health Dashboard...</h2>
          <p>Aggregating global inventory metrics</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <FiAlertCircle size={24} />
          <span>{error}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', color: 'inherit', cursor: 'pointer' }} onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1><FiActivity /> Global Inventory Health</h1>
          <p className="page-description">
            AI-powered master control center. Monitors total financial value, stock-out risks, and expiration spoilage.
          </p>
        </div>
        <button className="expiry-refresh-btn" onClick={fetchData} disabled={loading} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiRefreshCw className={loading ? 'spinning' : ''} /> Refresh
        </button>
      </div>

      <div className="dashboard-kpi-grid">
        <div className="dashboard-kpi-card blue">
          <div className="kpi-header">
            <div className="kpi-icon"><FiDollarSign /></div>
            <div className="kpi-title">Total Inventory Value</div>
          </div>
          <div className="kpi-value">₹{data.totalInventoryValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <div className="kpi-subtitle">Across {data.totalItems} mapped items</div>
        </div>

        <div className="dashboard-kpi-card yellow">
          <div className="kpi-header">
            <div className="kpi-icon"><FiPackage /></div>
            <div className="kpi-title">Critically Low Stock</div>
          </div>
          <div className="kpi-value">{data.lowStockItemsCount} Items</div>
          <div className="kpi-subtitle">Items requiring immediate reorder</div>
        </div>

        <div className="dashboard-kpi-card red">
          <div className="kpi-header">
            <div className="kpi-icon"><FiAlertTriangle /></div>
            <div className="kpi-title">Spoilage Risk</div>
          </div>
          <div className="kpi-value">₹{data.spoilageRiskValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <div className="kpi-subtitle">{data.criticalExpiryItemsCount} items expiring &lt; 30 days</div>
        </div>
      </div>

      <div className="dashboard-actions-section">
        <h2><FiAlertCircle /> AI Recommended Actions</h2>
        <div className="action-item-list">
          {data.actionItems.map((action, index) => (
            <Link to={action.link} className={`action-item ${action.type}`} key={index}>
              <div className="action-icon">
                {action.type === 'URGENT' ? <FiAlertTriangle /> : 
                 action.type === 'WARNING' ? <FiAlertCircle /> : <FiCheckCircle />}
              </div>
              <div className="action-content" style={{ flex: 1 }}>
                <h3>{action.type === 'URGENT' ? 'Urgent Action Required' : action.type === 'WARNING' ? 'Attention Needed' : 'All Clear'}</h3>
                <p>{action.message}</p>
              </div>
              <FiArrowRightCircle size={24} color="#cbd5e1" style={{ alignSelf: 'center' }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryHealthDashboard;
