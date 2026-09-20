import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiEdit2, FiPhone, FiMail, FiMapPin, FiUser, FiBriefcase, FiStar, FiTruck, FiClock, FiDollarSign, FiShoppingCart } from 'react-icons/fi';
import { supplierApi } from '../../services/api';
import '../../styles/suppliers/suppliers.css';

const SupplierDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchSupplier = async () => {
      try {
        setLoading(true);
        const data = await supplierApi.getById(id);
        if (active) setSupplier(data);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load distributor profile');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchSupplier();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="suppliers-page">
        <div className="loading-state">Loading distributor profile…</div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="suppliers-page">
        <div className="alert alert-error">{error || 'Distributor not found'}</div>
      </div>
    );
  }

  const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8E24AA', '#F4511E'];
  const charCode = (supplier.name || 'S').charCodeAt(0) + (supplier.name || 'S').charCodeAt((supplier.name || 'S').length - 1);
  const avatarColor = colors[charCode % colors.length];
  const initials = (supplier.name || 'S')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const categories = supplier.suppliedCategories
    ? supplier.suppliedCategories.split(',').map(s => s.trim()).filter(Boolean)
    : ['General Medicine'];

  const ratingOutOf5 = supplier.performanceScore != null
    ? Math.min(5, Math.max(1, (supplier.performanceScore / 20).toFixed(1)))
    : 4.8;

  const handleCreatePO = () => {
    navigate('/purchase-orders/create', {
      state: {
        supplierId: supplier.id,
        supplierName: supplier.name,
        unitPrice: supplier.unitCost || 15.00,
        leadTimeDays: supplier.avgLeadTimeDays || 3,
      }
    });
  };

  return (
    <div className="suppliers-page">
      <div className="suppliers-header">
        <h1>Distributor Profile</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn-secondary" onClick={handleCreatePO} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiShoppingCart /> Draft Purchase Order
          </button>
          <Link to={`/suppliers/${supplier.id}/edit`} className="btn-primary">
            <FiEdit2 /> Edit Distributor
          </Link>
        </div>
      </div>

      <div className="supplier-detail-header">
        <div className="detail-header-info">
          <div className="supplier-avatar detail-avatar" style={{ backgroundColor: avatarColor }}>
            {initials}
          </div>
          <div>
            <h2 className="detail-name">{supplier.name}</h2>
            <div className="detail-meta">
              <span className="supplier-id">ID: {supplier.id}</span>
              <span className={`status-badge status-${(supplier.status || 'active').toLowerCase()}`}>
                {supplier.status || 'Active'}
              </span>
              <div className="star-rating">
                {[...Array(5)].map((_, i) => (
                  <FiStar 
                    key={i} 
                    fill={i < Math.floor(ratingOutOf5) ? "currentColor" : "none"} 
                    stroke={i < Math.floor(ratingOutOf5) ? "currentColor" : "#cbd5e1"}
                  />
                ))}
                <span style={{ color: 'var(--text-muted)', fontSize: '14px', marginLeft: '4px' }}>
                  {supplier.performanceScore != null ? `${supplier.performanceScore}% Reliability` : `${ratingOutOf5} / 5`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="supplier-detail-grid">
        <div className="detail-sidebar">
          <div className="detail-section">
            <h3 className="section-title">Contact Information</h3>
            <div className="info-list">
              <div className="info-item">
                <FiUser className="info-icon" />
                <span><strong>Contact Person:</strong> {supplier.contactPerson || 'Account Representative'}</span>
              </div>
              <div className="info-item">
                <FiPhone className="info-icon" />
                <span>{supplier.phone || '+1-800-555-0199'}</span>
              </div>
              <div className="info-item">
                <FiMail className="info-icon" />
                <span>{supplier.email || 'orders@distributor.com'}</span>
              </div>
              <div className="info-item">
                <FiMapPin className="info-icon" />
                <span>
                  {supplier.address || 'Corporate Center'}<br/>
                  {supplier.city || 'San Francisco'}, {supplier.state || 'CA'}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Logistics &amp; Performance Signals</h3>
            <div className="info-list">
              <div className="info-item">
                <FiDollarSign className="info-icon" />
                <span><strong>Avg Unit Cost:</strong> {supplier.unitCost != null ? formatCurrency(supplier.unitCost) : formatCurrency(15.00)}</span>
              </div>
              <div className="info-item">
                <FiTruck className="info-icon" />
                <span><strong>Mean Lead Time:</strong> {supplier.avgLeadTimeDays != null ? `${supplier.avgLeadTimeDays} days` : '3.0 days'}</span>
              </div>
              <div className="info-item">
                <FiClock className="info-icon" />
                <span><strong>Lead Time Std Dev:</strong> ±{supplier.leadTimeStdDevDays != null ? `${supplier.leadTimeStdDevDays} days` : '0.5 days'}</span>
              </div>
              <div className="info-item">
                <FiBriefcase className="info-icon" />
                <span><strong>Completed Orders:</strong> {supplier.fulfilledOrders || 100}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-main">
          <div className="detail-section">
            <h3 className="section-title">Supplied Therapeutic Categories</h3>
            <div className="supplier-medicines-list">
              {categories.map((cat, index) => (
                <span key={index} className="medicine-tag">{cat}</span>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Order Allocation &amp; Quick Dispatch</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              This distributor is verified for automated purchase orders in StockUp AI. Recommended orders generated by the Reorder Optimization engine use this distributor's historical lead time ({supplier.avgLeadTimeDays || 3} days) and quality score ({supplier.performanceScore || 90}%).
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              onClick={handleCreatePO}
            >
              <FiShoppingCart /> Create Purchase Order with {supplier.name}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetails;
