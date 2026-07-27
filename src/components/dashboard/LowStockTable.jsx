import React from 'react';
import '../../styles/dashboard/dashboard.css';

const lowStockData = [
  { id: 1, name: 'Paracetamol 500mg', category: 'Analgesics', stock: 23, min: 100, status: 'Critical' },
  { id: 2, name: 'Amoxicillin 250mg', category: 'Antibiotics', stock: 45, min: 150, status: 'Low' },
  { id: 3, name: 'Ibuprofen 400mg', category: 'Analgesics', stock: 89, min: 100, status: 'Warning' },
  { id: 4, name: 'Omeprazole 20mg', category: 'Antacids', stock: 12, min: 80, status: 'Critical' },
  { id: 5, name: 'Cetirizine 10mg', category: 'Antihistamines', stock: 55, min: 120, status: 'Low' },
  { id: 6, name: 'Metformin 500mg', category: 'Antidiabetics', stock: 110, min: 150, status: 'Warning' },
  { id: 7, name: 'Amlodipine 5mg', category: 'Antihypertensives', stock: 30, min: 100, status: 'Critical' },
  { id: 8, name: 'Azithromycin 500mg', category: 'Antibiotics', stock: 60, min: 100, status: 'Low' },
  { id: 9, name: 'Pantoprazole 40mg', category: 'Antacids', stock: 85, min: 100, status: 'Warning' },
  { id: 10, name: 'Losartan 50mg', category: 'Antihypertensives', stock: 40, min: 120, status: 'Critical' },
];

const getStatusBadge = (status) => {
  switch(status) {
    case 'Critical': return 'badge badge-critical';
    case 'Low': return 'badge badge-warning';
    case 'Warning': return 'badge badge-low';
    default: return 'badge';
  }
};

const LowStockTable = () => {
  return (
    <div className="table-card">
      <h3>Low Stock Alerts</h3>
      <table>
        <thead>
          <tr>
            <th>Medicine Name</th>
            <th>Category</th>
            <th>Current Stock</th>
            <th>Min Required</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {lowStockData.map(item => (
            <tr key={item.id}>
              <td><strong>{item.name}</strong></td>
              <td>{item.category}</td>
              <td>{item.stock}</td>
              <td>{item.min}</td>
              <td><span className={getStatusBadge(item.status)}>{item.status}</span></td>
              <td><button className="btn-action">Order Now</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LowStockTable;
