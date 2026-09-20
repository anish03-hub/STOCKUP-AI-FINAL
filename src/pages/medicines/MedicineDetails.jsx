import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';
import { itemApi, itemsApi, forecastApi } from '../../services/api';
import { useCurrency } from '../../context/useCurrency';
import '../../styles/medicines/medicines.css';

const MedicineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [medicine, setMedicine] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const api = itemApi || itemsApi;
        const med = await api.getById(id);
        setMedicine(med);

        // Fetch forecast history if productCode is available
        if (med && med.code) {
          try {
            const history = await forecastApi.history(med.code);
            if (history && history.length > 0) {
              setForecast(history[0]);
            }
          } catch {
            // Optional forecast info
          }
        }
      } catch (err) {
        console.error('Failed to load medicine details:', err);
        setError(err.message || 'Medicine not found in database.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="medicines-page" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Loading medicine details from database...</p>
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="medicines-page" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
          Medicine Not Found
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {error || 'No database record matching this identifier was found.'}
        </p>
        <Link to="/medicines" className="btn-primary" style={{ display: 'inline-flex', padding: '10px 20px' }}>
          Back to Medicines Catalog
        </Link>
      </div>
    );
  }

  const getStatusClass = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('IN_STOCK') || s.includes('IN STOCK') || s.includes('ACTIVE')) return 'status-active';
    if (s.includes('LOW') || s.includes('WARNING')) return 'status-expired';
    if (s.includes('OUT') || s.includes('EXPIRED')) return 'status-expired';
    return 'status-inactive';
  };

  const isLowStock = (medicine.quantity || 0) <= 20;

  return (
    <div className="medicines-page">
      <div className="mb-6 flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <nav className="text-sm text-gray-500 mb-2" style={{ fontSize: '14px', color: 'var(--text-secondary, #64748b)', marginBottom: '8px' }}>
            <Link to="/medicines" style={{ color: 'var(--primary, #2563eb)', textDecoration: 'none' }}>Medicines</Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: 'var(--text-primary, #1e293b)', fontWeight: '500' }}>{medicine.name}</span>
          </nav>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('/medicines')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border, #cbd5e1)', background: 'var(--surface, white)', color: 'var(--text-primary, #1e293b)', cursor: 'pointer' }}>
            <FiArrowLeft /> Back
          </button>
          <Link to={`/medicines/${medicine.id || medicine.code}/edit`} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', color: 'white' }}>
            <FiEdit2 /> Edit Details
          </Link>
        </div>
      </div>

      <div className="medicine-detail-card" style={{ background: 'var(--surface, white)', borderRadius: '16px', border: '1px solid var(--border, #e2e8f0)', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div className="detail-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border, #f1f5f9)', paddingBottom: '20px' }}>
          <div className="detail-header-info" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--surface-muted, #eff6ff)', color: 'var(--primary, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700' }}>
              {(medicine.name || 'M').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary, #1e293b)', margin: 0 }}>{medicine.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--primary, #2563eb)', background: 'var(--surface-muted, #eff6ff)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}>
                  {medicine.code || 'NDC N/A'}
                </span>
                <span className={`status-badge ${getStatusClass(medicine.status)}`}>
                  {medicine.status || 'IN_STOCK'}
                </span>
                {isLowStock && (
                  <span className="status-badge status-expired" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <FiAlertCircle /> Low Stock Warning
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="detail-content">
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary, #334155)', marginBottom: '16px' }}>General Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="detail-item">
              <span style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', display: 'block', marginBottom: '4px' }}>Category / Class</span>
              <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary, #1e293b)' }}>{medicine.category || 'General Medicine'}</span>
            </div>
            <div className="detail-item">
              <span style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', display: 'block', marginBottom: '4px' }}>Manufacturer (Labeler)</span>
              <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary, #1e293b)' }}>{medicine.manufacturer || 'Generic Manufacturer'}</span>
            </div>
            <div className="detail-item">
              <span style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', display: 'block', marginBottom: '4px' }}>Active Ingredient / Description</span>
              <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary, #1e293b)' }}>{medicine.description || '—'}</span>
            </div>
            <div className="detail-item">
              <span style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', display: 'block', marginBottom: '4px' }}>Unit Purchase Price</span>
              <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary, #1e293b)' }}>
                {formatCurrency(medicine.price)}
              </span>
            </div>
            <div className="detail-item">
              <span style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', display: 'block', marginBottom: '4px' }}>Selling Price</span>
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#059669' }}>
                {formatCurrency(medicine.sellingPrice || medicine.price)}
              </span>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary, #334155)', marginBottom: '16px' }}>Inventory & Expiration</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="detail-item">
              <span style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', display: 'block', marginBottom: '4px' }}>Current Stock</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: isLowStock ? '#dc2626' : 'var(--text-primary, #1e293b)' }}>
                {medicine.quantity != null ? `${medicine.quantity} units` : '0 units'}
              </span>
            </div>
            <div className="detail-item">
              <span style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', display: 'block', marginBottom: '4px' }}>Expiry Date</span>
              <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary, #1e293b)' }}>{medicine.expiryDate || '—'}</span>
            </div>
            <div className="detail-item">
              <span style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', display: 'block', marginBottom: '4px' }}>Database Record ID</span>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary, #64748b)' }}>{medicine.id || '—'}</span>
            </div>
          </div>

          {forecast && (
            <div style={{ marginTop: '24px', padding: '20px', background: 'var(--surface-muted, #eff6ff)', borderRadius: '12px', border: '1px solid var(--border, #bfdbfe)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary, #1d4ed8)', fontWeight: '600', marginBottom: '12px' }}>
                <FiTrendingUp /> AI Medicine Demand Forecast
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--primary, #1e40af)', display: 'block' }}>Predicted Demand</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary, #1e3a8a)' }}>{forecast.predictedDemand} units</span>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--primary, #1e40af)', display: 'block' }}>Model</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary, #1e3a8a)' }}>{forecast.model || 'RandomForest v2'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--primary, #1e40af)', display: 'block' }}>Forecast Target</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary, #1e3a8a)' }}>{forecast.forecastDate || 'Next Cycle'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicineDetails;
