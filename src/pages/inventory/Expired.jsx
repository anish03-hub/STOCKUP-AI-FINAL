import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/inventory/inventory.css';
import { itemsApi } from '../../services/api';

const Expired = () => {
  const [dbMedicines, setDbMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await itemsApi.getAll();
        setDbMedicines(data || []);
      } catch (err) {
        console.error("Failed to load expired items:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const expiredItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (dbMedicines || []).map(m => {
      let isExpired = false;
      let expiryFormatted = 'N/A';
      if (m.expiryDate) {
        const exp = new Date(m.expiryDate);
        expiryFormatted = String(m.expiryDate).split('T')[0];
        if (exp < today) {
          isExpired = true;
        }
      }
      return {
        id: m.id,
        name: m.name,
        batch: m.batchNumber || m.batch || 'BAT-' + (m.id ? m.id.toString().slice(-4) : '001'),
        expiryDate: expiryFormatted,
        quantity: m.quantity ?? 0,
        unit: m.unit || 'units',
        isExpired,
        status: 'Expired - Pending Disposal'
      };
    }).filter(m => m.isExpired);
  }, [dbMedicines]);

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <h1>Expired Medicines</h1>
      </div>

      <div className="inventory-table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading expired items...</div>
        ) : (
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
              {expiredItems.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.batch}</td>
                  <td><span style={{ color: '#d93025', fontWeight: '600' }}>{item.expiryDate}</span></td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>
                    <span style={{ background: '#fce8e6', color: '#d93025', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn danger">Mark as Disposed</button>
                  </td>
                </tr>
              ))}
              {expiredItems.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#2e7d32', fontWeight: '500' }}>
                    No expired items found in active inventory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Expired;

