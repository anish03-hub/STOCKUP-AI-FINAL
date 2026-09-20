import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiActivity,
  FiDollarSign,
  FiAlertTriangle,
  FiPackage,
  FiAlertCircle,
  FiRefreshCw,
  FiArrowRightCircle,
  FiCheckCircle,
  FiTruck,
  FiTrendingUp,
  FiTrendingDown,
  FiShoppingCart,
  FiChevronRight,
  FiClock,
  FiLayers,
  FiBriefcase
} from 'react-icons/fi';
import '../../styles/dashboard/dashboard.css';
import { getDashboardSummary, itemApi, itemsApi } from '../../services/api';
import { useCurrency } from '../../context/useCurrency';

const InventoryHealthDashboard = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [data, setData] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Retrieve authenticated user from localStorage for contextual fallback
  const user = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('stockup_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const api = itemApi || itemsApi;

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summary, itemsRes] = await Promise.all([
        getDashboardSummary(),
        api.getItems(0, 10, '').catch(() => ({ content: [] })),
      ]);
      setData(summary);

      // If backend returned businessName in summary, sync it with localStorage if missing
      if (summary?.businessName && user && !user.businessName) {
        user.businessName = summary.businessName;
        localStorage.setItem('stockup_user', JSON.stringify(user));
      }

      const allFetched = itemsRes?.content || (Array.isArray(itemsRes) ? itemsRes : []);
      // Filter lowest stock items for quick action restock queue
      const lowStock = allFetched
        .filter(item => (item.quantity ?? 0) <= 50)
        .slice(0, 5);
      setLowStockItems(lowStock);
    } catch (err) {
      setError(err.message || 'Unable to load your inventory dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [api, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReorderItem = (item) => {
    navigate('/reorder', {
      state: {
        medicine: item.name,
        code: item.code,
        currentStock: item.quantity,
        unitPrice: item.price,
        category: item.category,
        demand: Math.max(100, (150 - (item.quantity || 0))),
      }
    });
  };

  const companyName = data?.businessName || user?.businessName || user?.business_name || 'Complete your StockUp setup';
  const userName = user?.fullName || user?.name || user?.email || 'Administrator';
  const userRole = user?.role || 'ADMIN';

  // ── Skeleton Loader State ──────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header-skeleton">
          <div className="skeleton-line title"></div>
          <div className="skeleton-line subtitle"></div>
        </div>

        <div className="dashboard-kpi-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="dashboard-kpi-card skeleton-card">
              <div className="skeleton-line icon"></div>
              <div className="skeleton-line value"></div>
              <div className="skeleton-line sub"></div>
            </div>
          ))}
        </div>

        <div className="dashboard-actions-section skeleton-actions">
          <div className="skeleton-line title" style={{ width: '250px' }}></div>
          <div className="skeleton-line item"></div>
          <div className="skeleton-line item"></div>
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error-banner">
          <div className="error-icon"><FiAlertCircle size={28} /></div>
          <div className="error-content">
            <h3>Unable to load your inventory dashboard</h3>
            <p>{error}</p>
          </div>
          <button className="error-retry-btn" onClick={fetchData}>
            <FiRefreshCw /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* ── Dashboard Header with Dynamic Company Identity ─────────── */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1><FiActivity className="header-icon" /> Inventory Health &amp; Executive KPIs</h1>
          <p className="page-description">
            Real-time inventory intelligence for <strong className="company-highlight">{companyName}</strong>
          </p>
        </div>

        <div className="header-right">
          <div className="company-badge-card" title={`Logged in as ${userName} (${userRole})`}>
            <div className="company-badge-icon">
              <FiBriefcase />
            </div>
            <div className="company-badge-info">
              <span className="company-badge-name">{companyName}</span>
              <span className="company-badge-role">{userName} • {userRole}</span>
            </div>
          </div>

          <button
            className="dashboard-refresh-btn"
            onClick={fetchData}
            disabled={loading}
            title="Refresh Live Data"
          >
            <FiRefreshCw className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 6 Company-Scoped Actionable KPI Cards ─────────────────────── */}
      <div className="dashboard-kpi-grid">
        {/* Card 1: Total Inventory Valuation */}
        <Link to="/inventory" className="dashboard-kpi-card blue clickable-card">
          <div className="kpi-header">
            <div className="kpi-icon"><FiDollarSign /></div>
            <div className="kpi-title">Total Inventory Valuation</div>
            <FiChevronRight className="kpi-arrow" />
          </div>
          <div className="kpi-value">
            {formatCurrency(data?.totalInventoryValue || 0)}
          </div>
          <div className="kpi-subtitle">
            Across {(data?.totalItems || 0).toLocaleString()} medicines in your inventory
          </div>
        </Link>

        {/* Card 2: Total Medicines */}
        <Link to="/medicines" className="dashboard-kpi-card purple clickable-card">
          <div className="kpi-header">
            <div className="kpi-icon"><FiLayers /></div>
            <div className="kpi-title">Total Medicines</div>
            <FiChevronRight className="kpi-arrow" />
          </div>
          <div className="kpi-value">
            {(data?.totalItems || 0).toLocaleString()}
          </div>
          <div className="kpi-subtitle">
            Active medicines catalog in company inventory
          </div>
        </Link>

        {/* Card 3: Critically Low Stock */}
        <Link to="/medicines?status=LOW_STOCK" className="dashboard-kpi-card yellow clickable-card">
          <div className="kpi-header">
            <div className="kpi-icon"><FiPackage /></div>
            <div className="kpi-title">Critically Low Stock</div>
            <FiChevronRight className="kpi-arrow" />
          </div>
          <div className="kpi-value">
            {data?.lowStockItemsCount || 0} Items
          </div>
          <div className="kpi-subtitle">
            Stock level &le; 50 units requiring reorder
          </div>
        </Link>

        {/* Card 4: Critical Expiry */}
        <Link to="/expiry" className="dashboard-kpi-card red clickable-card">
          <div className="kpi-header">
            <div className="kpi-icon"><FiClock /></div>
            <div className="kpi-title">Critical Expiry</div>
            <FiChevronRight className="kpi-arrow" />
          </div>
          <div className="kpi-value">
            {data?.criticalExpiryItemsCount || 0} Batches
          </div>
          <div className="kpi-subtitle">
            Medicines expiring within 30 days
          </div>
        </Link>

        {/* Card 5: Critical Spoilage Risk */}
        <Link to="/expiry" className="dashboard-kpi-card orange clickable-card">
          <div className="kpi-header">
            <div className="kpi-icon"><FiTrendingDown /></div>
            <div className="kpi-title">Critical Spoilage Risk</div>
            <FiChevronRight className="kpi-arrow" />
          </div>
          <div className="kpi-value">
            {formatCurrency(data?.spoilageRiskValue || 0)}
          </div>
          <div className="kpi-subtitle">
            Estimated capital at risk from impending expiry
          </div>
        </Link>

        {/* Card 6: Distributor / Supplier Network */}
        <Link to="/suppliers" className="dashboard-kpi-card green clickable-card">
          <div className="kpi-header">
            <div className="kpi-icon"><FiTruck /></div>
            <div className="kpi-title">Distributor Network</div>
            <FiChevronRight className="kpi-arrow" />
          </div>
          <div className="kpi-value">
            {data?.totalSuppliers ?? 0} Suppliers
          </div>
          <div className="kpi-subtitle">
            Ranked by AI-driven supplier performance
          </div>
        </Link>
      </div>

      {/* ── AI Recommended Actions ───────────────────────────────────── */}
      <div className="dashboard-actions-section">
        <div className="actions-header">
          <h2><FiAlertCircle /> AI Inventory Action Items</h2>
          <span className="actions-company-tag">{companyName}</span>
        </div>
        <div className="action-item-list">
          {(!data?.actionItems || data.actionItems.length === 0) ? (
            <div className="action-item INFO all-clear">
              <div className="action-icon"><FiCheckCircle /></div>
              <div className="action-content">
                <h3>All Clear</h3>
                <p>All inventory metrics are healthy. No urgent actions required for {companyName}.</p>
              </div>
            </div>
          ) : (
            data.actionItems.map((action, index) => {
              const priority = action.priority || action.type || 'INFO';
              const route = action.suggestedActionRoute || action.link || '/dashboard';
              return (
                <Link to={route} className={`action-item ${priority}`} key={index}>
                  <div className="action-icon">
                    {priority === 'URGENT' ? <FiAlertTriangle /> : 
                     priority === 'WARNING' ? <FiAlertCircle /> : <FiCheckCircle />}
                  </div>
                  <div className="action-content">
                    <h3>
                      {priority === 'URGENT' ? 'Urgent Action Required' : 
                       priority === 'WARNING' ? 'Attention Needed' : 'All Clear'}
                    </h3>
                    <p>{action.message}</p>
                  </div>
                  <FiArrowRightCircle size={24} className="action-arrow" />
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* ── Quick Restock / Low Stock Highlight ──────────────────────── */}
      {lowStockItems.length > 0 && (
        <div className="dashboard-low-stock-section">
          <div className="low-stock-header">
            <div>
              <h2>
                <FiTrendingUp className="low-stock-icon" /> Low-Stock Restock Priority Queue
              </h2>
              <div className="low-stock-desc">
                Quickly trigger dynamic safety stock optimization and dispatch purchase orders for {companyName}.
              </div>
            </div>
            <Link to="/medicines?status=LOW_STOCK" className="view-all-link">
              View All Low Stock ({data?.lowStockItemsCount || lowStockItems.length}) <FiChevronRight />
            </Link>
          </div>

          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>NDC Code</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr key={item.id || item.code}>
                    <td className="medicine-name-cell">{item.name}</td>
                    <td className="ndc-code-cell">{item.code}</td>
                    <td className="category-cell">{item.category || 'General'}</td>
                    <td>
                      <span className="stock-badge danger">
                        {item.quantity} units
                      </span>
                    </td>
                    <td>${(item.price || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleReorderItem(item)}
                        className="reorder-action-btn"
                      >
                        <FiShoppingCart /> Optimize Reorder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Historical Sales Performance Intelligence Banner ──────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginTop: '28px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(37, 99, 235, 0.2)',
            color: '#60a5fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            <FiTrendingUp />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: 'white' }}>
              Historical Pharmacy Sales Intelligence &amp; Trends
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#94a3b8' }}>
              Analyze 6-year longitudinal sales velocity, COVID-19 demand impacts, and regional demographic trends for {companyName}.
            </p>
          </div>
        </div>

        <Link
          to="/sales-analytics"
          style={{
            background: '#2563eb',
            color: 'white',
            textDecoration: 'none',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: '600',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.2s ease',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)'
          }}
        >
          <span>View Sales Analytics</span>
          <FiChevronRight />
        </Link>
      </div>
    </div>
  );
};

export default InventoryHealthDashboard;

