import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../../styles/inventory/inventory.css';
import { stockHistory } from '../../data/mockData';

const StockHistory = () => {
  const mockHistoryData = [
    { date: '2024-07-01', stock: 1200 },
    { date: '2024-07-05', stock: 1100 },
    { date: '2024-07-10', stock: 1500 },
    { date: '2024-07-15', stock: 1350 },
    { date: '2024-07-20', stock: 1250 },
  ];

  const mockLogs = stockHistory || [
    { id: 1, date: '2024-07-20 10:30 AM', medicine: 'Paracetamol 500mg', action: 'Dispensed', quantity: -50, user: 'Dr. Smith', notes: 'Ward A supply' },
    { id: 2, date: '2024-07-10 14:15 PM', medicine: 'Paracetamol 500mg', action: 'Added', quantity: 400, user: 'Admin', notes: 'PO #1029 received' }
  ];

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <h1>Stock History & Trends</h1>
      </div>

      <div className="inventory-table-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--text-primary)' }}>Overall Stock Movement (Past 30 Days)</h3>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockHistoryData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="stock" stroke="var(--primary, #1a73e8)" fill="var(--primary-light, #e8f0fe)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="inventory-table-card">
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--text-primary)' }}>Recent Activity Logs</h3>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Medicine</th>
              <th>Action</th>
              <th>Quantity</th>
              <th>User</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {mockLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.date}</td>
                <td><strong>{log.medicine}</strong></td>
                <td>
                  <span style={{ 
                    color: log.action === 'Added' ? '#1e8e3e' : '#d93025',
                    fontWeight: '500'
                  }}>
                    {log.action}
                  </span>
                </td>
                <td>
                  <span style={{ color: log.quantity > 0 ? '#1e8e3e' : '#d93025' }}>
                    {log.quantity > 0 ? '+' : ''}{log.quantity}
                  </span>
                </td>
                <td>{log.user}</td>
                <td>{log.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockHistory;
