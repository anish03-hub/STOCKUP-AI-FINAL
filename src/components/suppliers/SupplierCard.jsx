import React from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiStar } from 'react-icons/fi';
import '../../styles/suppliers/suppliers.css';

const SupplierCard = ({ supplier }) => {
  // Generate random color for avatar based on name
  const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8E24AA', '#F4511E'];
  const charCode = supplier.name.charCodeAt(0) + supplier.name.charCodeAt(supplier.name.length - 1);
  const avatarColor = colors[charCode % colors.length];
  
  const initials = supplier.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="supplier-card">
      <div className="supplier-card-header">
        <div className="supplier-avatar-wrapper">
          <div className="supplier-avatar" style={{ backgroundColor: avatarColor }}>
            {initials}
          </div>
          <div>
            <h3 className="supplier-name">{supplier.name}</h3>
            <p className="supplier-id">{supplier.id}</p>
          </div>
        </div>
        <span className={`status-badge status-${supplier.status.toLowerCase()}`}>
          {supplier.status}
        </span>
      </div>

      <div className="supplier-info-grid">
        <div className="info-item">
          <FiPhone className="info-icon" />
          <span>{supplier.phone}</span>
        </div>
        <div className="info-item">
          <FiMail className="info-icon" />
          <span>{supplier.email}</span>
        </div>
        <div className="info-item">
          <FiMapPin className="info-icon" />
          <span title={`${supplier.city}, ${supplier.state}`}>{supplier.city}, {supplier.state}</span>
        </div>
      </div>

      <div className="supplier-stats">
        <div className="supplier-stat">
          <span className="stat-label">Total Orders</span>
          <span className="stat-value">{supplier.totalOrders || 0}</span>
        </div>
        <div className="supplier-stat">
          <span className="stat-label">Medicines</span>
          <span className="stat-value">{supplier.suppliedMedicines?.length || 0}</span>
        </div>
        <div className="supplier-stat">
          <span className="stat-label">Rating</span>
          <div className="star-rating">
            {[...Array(5)].map((_, i) => (
              <FiStar 
                key={i} 
                fill={i < Math.floor(supplier.rating) ? "currentColor" : "none"} 
                stroke={i < Math.floor(supplier.rating) ? "currentColor" : "#cbd5e1"}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="supplier-actions">
        <Link to={`/suppliers/${supplier.id}`} className="btn-secondary">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default SupplierCard;
