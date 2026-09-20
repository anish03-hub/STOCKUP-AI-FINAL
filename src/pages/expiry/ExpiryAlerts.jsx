import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiClock,
  FiShield,
  FiDollarSign,
  FiRefreshCw,
  FiAlertCircle,
  FiPackage,
  FiShoppingCart,
  FiSearch,
  FiMail,
  FiCheckCircle,
  FiX
} from 'react-icons/fi';
import '../../styles/expiry/expiry.css';
import { getExpiryAlerts, notificationApi, getUser } from '../../services/api';
import { useCurrency } from '../../context/useCurrency';

const ExpiryAlerts = () => {
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'WARNING'
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalRecipientEmail, setModalRecipientEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getExpiryAlerts();
      setData(result);
      fetchHistory();
    } catch (err) {
      setError(err.message || 'Failed to load expiry alerts.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await notificationApi.getExpiryHistory();
      setHistory(res || []);
    } catch (err) {
      console.error("Failed to load email notification history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openSendModal = () => {
    const currentUser = getUser();
    const defaultEmail = currentUser?.notificationEmail || currentUser?.email || 'ag584160@gmail.com';
    setModalRecipientEmail(defaultEmail);
    setEmailError('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const trimmed = modalRecipientEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!trimmed) {
      setEmailError('Recipient email is required.');
      return;
    }
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setEmailError('');
    setSendingEmail(true);
    setEmailStatus(null);

    try {
      const res = await notificationApi.sendTestExpiryEmail({ recipientEmail: trimmed });
      const count = res.processedItems ?? res.itemsFound ?? 0;
      const critical = res.criticalItems ?? 0;
      const warning = res.warningItems ?? 0;

      if (res.status === 'SENT') {
        setEmailStatus({
          status: 'SENT',
          message: `Expiry alert sent successfully to ${res.recipient} (${count} items processed • ${critical} critical • ${warning} warning).`
        });
      } else if (res.status === 'SIMULATED') {
        setEmailStatus({
          status: 'SIMULATED',
          message: `Email alert was simulated for ${res.recipient}. SMTP credentials are not configured.`
        });
      } else {
        setEmailStatus({
          status: 'FAILED',
          message: `Failed to send expiry alert to ${res.recipient}: ${res.errorMessage || 'SMTP connection or authentication rejected.'}`
        });
      }
      setIsModalOpen(false);
      fetchHistory();
    } catch (err) {
      setEmailError(err.response?.data?.message || err.message || 'Failed to trigger test email notification.');
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReorder = (item) => {
    navigate('/reorder', {
      state: {
        medicine: item.medicineName,
        code: item.code || '',
        category: item.category || '',
        currentStock: item.quantity,
        demand: Math.max(item.quantity * 2, 50),
      }
    });
  };

  const filteredItems = useMemo(() => {
    if (!data?.atRiskItems) return [];
    let items = data.atRiskItems;

    if (filterTab === 'CRITICAL') {
      items = items.filter(i => i.riskLevel === 'CRITICAL');
    } else if (filterTab === 'WARNING') {
      items = items.filter(i => i.riskLevel === 'WARNING');
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      items = items.filter(i => 
        (i.medicineName && i.medicineName.toLowerCase().includes(q)) ||
        (i.manufacturer && i.manufacturer.toLowerCase().includes(q)) ||
        (i.category && i.category.toLowerCase().includes(q))
      );
    }

    return items;
  }, [data, filterTab, searchTerm]);

  if (loading) {
    return (
      <div className="expiry-page">
        <div className="expiry-loading">
          <div className="expiry-spinner" />
          <p>Analyzing stock expiration profiles &amp; calculating financial exposure...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="expiry-page">
        <div className="expiry-error">
          <FiAlertCircle size={32} />
          <h3>Unable to Load Expiry Alerts</h3>
          <p>{error}</p>
          <button type="button" onClick={fetchData} className="btn-retry">
            <FiRefreshCw /> Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="expiry-page">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="expiry-header">
        <div>
          <h1><FiAlertTriangle /> Expiry Risk Analysis &amp; Alerts</h1>
          <p className="page-description">
            Monitor approaching medication expiry dates, evaluate financial exposure, and trigger automated reorders.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={openSendModal} 
            disabled={sendingEmail}
            className="btn-refresh" 
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}
            title="Dispatch Expiry Alert Email Notification"
          >
            <FiMail /> {sendingEmail ? 'Opening...' : 'Send Expiry Email Alert'}
          </button>
          <button type="button" onClick={fetchData} className="btn-refresh" title="Refresh Live Expiry Data">
            <FiRefreshCw /> Refresh Data
          </button>
        </div>
      </div>

      {emailStatus && (
        <div style={{
          margin: '0 0 20px 0',
          padding: '12px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          background: emailStatus.status === 'SENT' 
            ? 'rgba(16, 185, 129, 0.1)' 
            : emailStatus.status === 'SIMULATED' 
              ? 'rgba(245, 158, 11, 0.1)' 
              : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${
            emailStatus.status === 'SENT' 
              ? '#10b981' 
              : emailStatus.status === 'SIMULATED' 
                ? '#f59e0b' 
                : '#ef4444'
          }`,
          color: emailStatus.status === 'SENT' 
            ? '#047857' 
            : emailStatus.status === 'SIMULATED' 
              ? '#b45309' 
              : '#b91c1c'
        }}>
          {emailStatus.status === 'SENT' && <FiCheckCircle size={18} />}
          {emailStatus.status === 'SIMULATED' && <FiClock size={18} />}
          {emailStatus.status === 'FAILED' && <FiAlertCircle size={18} />}
          <span>{emailStatus.message}</span>
        </div>
      )}

      {/* ── Metric Summary Cards ───────────────────────────────── */}
      <div className="expiry-summary-grid">
        <div className="expiry-summary-card critical">
          <div className="expiry-summary-icon"><FiAlertTriangle /></div>
          <div className="expiry-summary-label">Critical (&lt; 30 Days)</div>
          <div className="expiry-summary-value">{data.totalCriticalItems} Items</div>
        </div>
        <div className="expiry-summary-card warning">
          <div className="expiry-summary-icon"><FiClock /></div>
          <div className="expiry-summary-label">Warning (31–90 Days)</div>
          <div className="expiry-summary-value">{data.totalWarningItems} Items</div>
        </div>
        <div className="expiry-summary-card safe">
          <div className="expiry-summary-icon"><FiShield /></div>
          <div className="expiry-summary-label">Safe Stock (&gt; 90 Days)</div>
          <div className="expiry-summary-value">{data.totalSafeItems} Items</div>
        </div>
        <div className="expiry-summary-card financial">
          <div className="expiry-summary-icon"><FiDollarSign /></div>
          <div className="expiry-summary-label">Total At-Risk Valuation</div>
          <div className="expiry-summary-value">
            {formatCurrency(data.totalAtRiskValue || 0)}
          </div>
        </div>
      </div>

      <div className="expiry-table-container">
        <div className="expiry-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>At-Risk Inventory ({filteredItems.length} of {data.atRiskItems.length} Flagged Items)</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FiSearch style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search at-risk medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  minWidth: '220px'
                }}
              />
            </div>

            <div className="filter-tabs">
              <button
                type="button"
                onClick={() => setFilterTab('ALL')}
                style={{
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: filterTab === 'ALL' ? 'white' : 'transparent',
                  color: filterTab === 'ALL' ? '#0f172a' : '#64748b',
                  boxShadow: filterTab === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                All At-Risk ({data.atRiskItems.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('CRITICAL')}
                style={{
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: filterTab === 'CRITICAL' ? '#ef4444' : 'transparent',
                  color: filterTab === 'CRITICAL' ? 'white' : '#64748b',
                  boxShadow: filterTab === 'CRITICAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Critical ({data.totalCriticalItems})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('WARNING')}
                style={{
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: filterTab === 'WARNING' ? '#f59e0b' : 'transparent',
                  color: filterTab === 'WARNING' ? 'white' : '#64748b',
                  boxShadow: filterTab === 'WARNING' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Warning ({data.totalWarningItems})
              </button>
            </div>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <FiShield size={48} color="#10b981" style={{ marginBottom: '16px' }} />
            <h3>No matching at-risk items</h3>
            <p>All stock in this category is safe and well within expiration margins.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="expiry-table">
              <thead>
                <tr>
                  <th>Medicine / Manufacturer</th>
                  <th>Current Stock</th>
                  <th>Unit Price</th>
                  <th>Expiry Date</th>
                  <th>Risk Level</th>
                  <th>Spoilage Exposure</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <span className="expiry-item-name">{item.medicineName}</span>
                      <span className="expiry-item-category">{item.manufacturer || item.category || 'Pharmaceutical'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FiPackage style={{ marginRight: '6px', color: 'var(--text-muted)' }} />
                        <strong>{item.quantity}</strong> units
                      </div>
                    </td>
                    <td>{formatCurrency(item.price || 0)}</td>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.expiryDate}</div>
                      <div style={{ fontSize: '12px', color: item.daysUntilExpiry <= 30 ? '#dc2626' : '#d97706', fontWeight: '500' }}>
                        {item.daysUntilExpiry <= 0 ? 'Expired' : `${item.daysUntilExpiry} days left`}
                      </div>
                    </td>
                    <td>
                      <span className={`expiry-badge ${item.riskLevel.toLowerCase()}`}>
                        {item.riskLevel === 'CRITICAL' ? <FiAlertTriangle /> : <FiClock />}
                        {item.riskLevel}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                      {formatCurrency(item.financialRisk || 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleReorder(item)}
                        style={{
                          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <FiShoppingCart /> Reorder Fresh
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Notification Audit Log Section ────────────────────── */}
      <div className="expiry-table-container" style={{ marginTop: '24px' }}>
        <div className="expiry-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2><FiMail style={{ marginRight: '8px' }} /> Expiry Email Alert Delivery History</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {history.length} Email Log Record{history.length === 1 ? '' : 's'}
          </span>
        </div>

        {loadingHistory ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading notification audit history...
          </div>
        ) : history.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FiClock size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <p>No email alerts logged yet for this business.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="expiry-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Recipient Email</th>
                  <th>Alert Level</th>
                  <th>Medicine</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {log.sentAt ? new Date(log.sentAt).toLocaleString() : 'Pending'}
                    </td>
                    <td style={{ fontWeight: '500' }}>{log.recipient}</td>
                    <td>
                      <span className={`expiry-badge ${log.alertLevel ? log.alertLevel.toLowerCase() : 'critical'}`}>
                        {log.alertLevel}
                      </span>
                    </td>
                    <td>
                      <strong>{log.itemName || 'Batch Alert'}</strong>
                      {log.itemCode && <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Code: {log.itemCode}</span>}
                    </td>
                    <td>{log.expiryDate || 'N/A'}</td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        background: log.status === 'SENT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: log.status === 'SENT' ? '#10b981' : '#ef4444'
                      }}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Send Expiry Alert Modal ────────────────────────────── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface-card, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color, #334155)',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiMail color="#3b82f6" /> Send Expiry Alert
              </h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                disabled={sendingEmail}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} style={{ padding: '24px' }}>
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#94a3b8', lineHeight: 1.5 }}>
                Send the current expiry-risk report by email. Choose where to send the report for this pharmacy.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>
                  Recipient Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter recipient email (e.g. manager@example.com)"
                  value={modalRecipientEmail}
                  onChange={(e) => {
                    setModalRecipientEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  disabled={sendingEmail}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${emailError ? '#ef4444' : '#475569'}`,
                    background: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {emailError && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', fontWeight: '500' }}>
                    {emailError}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                  The email will contain the current {data?.atRiskItems?.length || 222} expiring items for this pharmacy.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid #334155' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={sendingEmail}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '6px',
                    border: '1px solid #475569',
                    background: 'transparent',
                    color: '#94a3b8',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: sendingEmail ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: sendingEmail ? 0.7 : 1
                  }}
                >
                  {sendingEmail ? 'Sending...' : 'Send Email Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpiryAlerts;
