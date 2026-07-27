import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import '../../styles/inventory/inventory.css';

const LowStockAlert = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="expiry-warning-banner critical">
      <div className="icon">
        <FiAlertTriangle />
      </div>
      <div>
        <h4>Critical Stock Warning</h4>
        <p>There are {items.length} items running critically low on stock. Please restock immediately.</p>
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {items.slice(0, 3).map((item) => (
             <span key={item.id} style={{ background: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #fce8e6' }}>
               {item.name} ({item.available} left)
             </span>
          ))}
          {items.length > 3 && (
             <span style={{ padding: '4px 8px', fontSize: '12px' }}>+{items.length - 3} more</span>
          )}
        </div>
      </div>
      <div style={{ marginLeft: 'auto' }}>
        <button className="action-btn danger">Order Now</button>
      </div>
    </div>
  );
};

export default LowStockAlert;
