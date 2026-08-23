import React, { useState, useEffect } from 'react';
import {
  FiAlertTriangle,
  FiClock,
  FiShield,
  FiDollarSign,
  FiRefreshCw,
  FiAlertCircle,
  FiPackage
} from 'react-icons/fi';
import '../../styles/expiry/expiry.css';
import { getExpiryAlerts } from '../../services/api';

const ExpiryAlerts = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getExpiryAlerts();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load expiry alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) {
    return (
      <div className="expiry-page">
        <div className="expiry-loading">
          <div className="expiry-spinner"></div>
          <h2>Analyzing Inventory...</h2>
          <p>Checking expiry dates for all stock</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="expiry-page">
        <div className="expiry-error">
          <FiAlertCircle size={24} />
          <span>{error}</span>
          <button className="expiry-refresh-btn" onClick={fetchData}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="expiry-page">
      <div className="expiry-header">
        <div>
          <h1><FiAlertTriangle /> Expiry Alerts & Spoilage Risk</h1>
          <p className="page-description">
            Monitor inventory approaching expiration. Items expiring within 30 days are critical.
          </p>
        </div>
        <button className="expiry-refresh-btn" onClick={fetchData} disabled={loading}>
          <FiRefreshCw className={loading ? 'spinning' : ''} /> Refresh
        </button>
      </div>

      <div className="expiry-summary-grid">
        <div className="expiry-summary-card critical">
          <div className="expiry-summary-icon"><FiAlertTriangle /></div>
          <div className="expiry-summary-label">Critical (&lt; 30 Days)</div>
          <div className="expiry-summary-value">{data.totalCriticalItems}</div>
        </div>
        <div className="expiry-summary-card warning">
          <div className="expiry-summary-icon"><FiClock /></div>
          <div className="expiry-summary-label">Warning (31-90 Days)</div>
          <div className="expiry-summary-value">{data.totalWarningItems}</div>
        </div>
        <div className="expiry-summary-card safe">
          <div className="expiry-summary-icon"><FiShield /></div>
          <div className="expiry-summary-label">Safe Stock</div>
          <div className="expiry-summary-value">{data.totalSafeItems}</div>
        </div>
        <div className="expiry-summary-card financial">
          <div className="expiry-summary-icon"><FiDollarSign /></div>
          <div className="expiry-summary-label">At-Risk Financial Value</div>
          <div className="expiry-summary-value">
            ₹{data.totalAtRiskValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
        </div>
      </div>

      <div className="expiry-table-container">
        <div className="expiry-table-header">
          <h2>At-Risk Inventory ({data.atRiskItems.length} Items)</h2>
        </div>
        {data.atRiskItems.length === 0 ? (
          <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>
            <FiShield size={48} color="#10b981" style={{marginBottom: '16px'}} />
            <h3>All Clear!</h3>
            <p>No inventory items are expiring within the next 90 days.</p>
          </div>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table className="expiry-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Expiry Date</th>
                  <th>Risk Level</th>
                  <th>Financial Risk</th>
                </tr>
              </thead>
              <tbody>
                {data.atRiskItems.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <span className="expiry-item-name">{item.medicineName}</span>
                      <span className="expiry-item-category">{item.manufacturer}</span>
                    </td>
                    <td><FiPackage style={{marginRight:'6px', color:'#94a3b8'}}/>{item.quantity}</td>
                    <td>₹{item.price.toFixed(2)}</td>
                    <td>
                      <div style={{fontWeight: '600'}}>{item.expiryDate}</div>
                      <div style={{fontSize: '12px', color: '#64748b'}}>{item.daysUntilExpiry} days left</div>
                    </td>
                    <td>
                      <span className={`expiry-badge ${item.riskLevel}`}>
                        {item.riskLevel === 'CRITICAL' ? <FiAlertTriangle /> : <FiClock />}
                        {item.riskLevel}
                      </span>
                    </td>
                    <td style={{fontWeight: '700', color: '#334155'}}>
                      ₹{item.financialRisk.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpiryAlerts;
