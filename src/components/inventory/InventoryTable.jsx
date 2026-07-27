import React from 'react';
import StockLevelBar from './StockLevelBar';
import '../../styles/inventory/inventory.css';

const InventoryTable = ({ data = [] }) => {
  return (
    <div className="inventory-table-card">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Code</th>
            <th>Category</th>
            <th>Available</th>
            <th>Reserved</th>
            <th>Min Stock</th>
            <th>Stock Level</th>
            <th>Value</th>
            <th>Location</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td><strong>{item.name}</strong></td>
              <td>{item.code}</td>
              <td>{item.category}</td>
              <td>
                <span style={{ color: item.available < item.minStock ? '#d93025' : '#1e8e3e', fontWeight: '500' }}>
                  {item.available} {item.unit}
                </span>
              </td>
              <td>{item.reserved} {item.unit}</td>
              <td>{item.minStock} {item.unit}</td>
              <td style={{ width: '150px' }}>
                <StockLevelBar current={item.available} max={item.maxStock || item.minStock * 3} />
              </td>
              <td>${item.value?.toLocaleString()}</td>
              <td>{item.location}</td>
              <td>
                <div className="actions-cell">
                  <button className="action-btn">Edit</button>
                  <button className="action-btn warning">Order</button>
                </div>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan="10" style={{ textAlign: 'center', padding: '24px' }}>No inventory items found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;
