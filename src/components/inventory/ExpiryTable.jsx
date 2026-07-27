import React from 'react';
import '../../styles/inventory/inventory.css';

const ExpiryTable = ({ data = [] }) => {
  const getDaysLeftClass = (days) => {
    if (days < 7) return 'critical';
    if (days <= 30) return 'warning';
    if (days <= 60) return 'warning'; // Using warning style, you could also make a yellow specific one
    return 'safe';
  };

  return (
    <div className="inventory-table-card">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Batch</th>
            <th>Manufactured</th>
            <th>Expiry Date</th>
            <th>Days Left</th>
            <th>Quantity</th>
            <th>Storage</th>
            <th style={{ minWidth: '160px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id || item.batch}>
              <td><strong>{item.name}</strong></td>
              <td>{item.batch}</td>
              <td>{item.manufacturedDate}</td>
              <td>{item.expiryDate}</td>
              <td>
                <span className={`expiry-countdown ${getDaysLeftClass(item.daysLeft)}`}>
                  {item.daysLeft} days
                </span>
              </td>
              <td>{item.quantity} {item.unit}</td>
              <td>{item.storage}</td>
              <td style={{ whiteSpace: 'nowrap', width: '180px', minWidth: '180px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    style={{
                      padding: '5px 12px',
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Dispose
                  </button>
                  <button
                    style={{
                      padding: '5px 12px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Transfer
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No expiring items found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ExpiryTable;
