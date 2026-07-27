import React from 'react';
import ActionButtons from './ActionButtons';

const MedicineRow = ({ item }) => {
  
  const calculateDaysLeft = (expiry) => {
    const today = new Date();
    const expDate = new Date(expiry);
    const timeDiff = expDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const daysLeft = calculateDaysLeft(item.expiryDate);

  let statusBadge = '';
  let statusText = item.status;
  
  if (daysLeft < 0) {
    statusBadge = 'status-darkred';
    statusText = 'Expired';
  } else if (daysLeft < 30) {
    statusBadge = 'status-red';
    statusText = 'Expiring Soon';
  } else if (item.currentStock === 0) {
    statusBadge = 'status-red';
    statusText = 'Out of Stock';
  } else if (item.currentStock < 20) {
    statusBadge = 'status-orange';
    statusText = 'Low Stock';
  } else if (item.status === 'Needs Review') {
    statusBadge = 'status-yellow';
  } else {
    statusBadge = 'status-green';
    statusText = 'In Stock';
  }

  const stockClass = item.currentStock > 50 ? 'stock-good' : (item.currentStock > 15 ? 'stock-low' : 'stock-critical');

  return (
    <tr>
      <td><strong>{item.name}</strong></td>
      <td>{item.code}</td>
      <td>{item.category}</td>
      <td>{item.manufacturer}</td>
      <td>{item.batchNumber}</td>
      <td className={stockClass}>{item.currentStock} Units</td>
      <td>${item.purchasePrice?.toFixed(2)}</td>
      <td>${item.sellingPrice?.toFixed(2)}</td>
      <td>
        {item.expiryDate} <br/>
        <span style={{fontSize: '11px', color: 'var(--color-text-muted)'}}>
          ({daysLeft > 0 ? `${daysLeft} days left` : 'Expired'})
        </span>
      </td>
      <td>
        <span className={`status-badge ${statusBadge}`}>
          {statusText}
        </span>
      </td>
      <td>
        <ActionButtons />
      </td>
    </tr>
  );
};

export default MedicineRow;
