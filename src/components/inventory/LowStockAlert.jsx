import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle } from 'react-icons/fi';
import '../../styles/inventory/inventory.css';

const LowStockAlert = ({ items = [] }) => {
  const navigate = useNavigate();
  if (!items || items.length === 0) return null;

  return (
    <div className="expiry-warning-banner critical critical-stock-warning">
      <div className="icon">
        <FiAlertTriangle />
      </div>
      <div className="warning-content">
        <h4 className="warning-title">Critical Stock Warning</h4>
        <p className="warning-desc">
          There are <strong>{items.length}</strong> items running critically low on stock. Please restock immediately.
        </p>
        <div className="stock-warning-chips">
          {items.slice(0, 3).map((item) => (
            <span key={item.id} className="stock-warning-chip">
              <span className="stock-warning-chip-name">{item.name}</span>
              <span className="stock-warning-chip-count">({item.available ?? item.quantity ?? 0} left)</span>
            </span>
          ))}
          {items.length > 3 && (
            <span className="stock-warning-more">+{items.length - 3} more</span>
          )}
        </div>
      </div>
      <div className="warning-actions">
        <button 
          type="button" 
          className="action-btn danger stock-warning-order-btn"
          onClick={() => navigate('/reorder')}
        >
          Order Now
        </button>
      </div>
    </div>
  );
};

export default LowStockAlert;
