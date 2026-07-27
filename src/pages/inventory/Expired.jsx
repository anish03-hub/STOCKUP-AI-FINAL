import React from 'react';
import '../../styles/inventory/inventory.css';
import { expiredMedicines } from '../../data/mockData';

const Expired = () => {
  const mockExpired = expiredMedicines || [
    { id: 1, name: 'Ibuprofen 400mg', batch: 'B-9921', expiryDate: '2024-01-01', quantity: 150, unit: 'tabs', status: 'Pending Disposal' }
  ];

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <h1>Expired Medicines</h1>
      </div>

      <div className="inventory-table-card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Batch</th>
              <th>Expiry Date</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockExpired.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.name}</strong></td>
                <td>{item.batch}</td>
                <td><span style={{ color: '#d93025' }}>{item.expiryDate}</span></td>
                <td>{item.quantity} {item.unit}</td>
                <td>
                  <span style={{ background: '#fce8e6', color: '#d93025', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <button className="action-btn danger">Mark as Disposed</button>
                </td>
              </tr>
            ))}
            {mockExpired.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No expired items.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Expired;
