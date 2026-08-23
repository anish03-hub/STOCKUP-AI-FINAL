import React from 'react';
import { FiEye } from 'react-icons/fi';
import '../../styles/purchase/purchase.css';

const mockHistory = [
  { id: 'PO-2023-085', supplier: 'MedLife Distributors', total: 4250.00, orderDate: '2023-09-15', receivedDate: '2023-09-20', status: 'Completed' },
  { id: 'PO-2023-086', supplier: 'PharmaCorp Global', total: 1150.50, orderDate: '2023-09-16', receivedDate: '2023-09-21', status: 'Completed' },
  { id: 'PO-2023-088', supplier: 'HealthFirst Supplies', total: 3200.00, orderDate: '2023-09-20', receivedDate: '2023-09-25', status: 'Completed' },
  { id: 'PO-2023-090', supplier: 'BioGen Therapeutics', total: 850.00, orderDate: '2023-09-25', receivedDate: '2023-09-28', status: 'Completed' },
];

const PurchaseHistory = () => {
  return (
    <div className="purchase-page">
      <div className="purchase-header">
        <h1>Purchase History</h1>
      </div>

      <div className="purchase-controls" style={{ justifyContent: 'flex-end' }}>
        <div className="search-filter">
          <input type="date" className="search-input" />
          <span style={{ alignSelf: 'center' }}>to</span>
          <input type="date" className="search-input" />
          <button className="btn-primary">Filter</button>
        </div>
      </div>

      <div className="po-table-container">
        <table className="po-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Supplier</th>
              <th>Total Cost</th>
              <th>Order Date</th>
              <th>Received Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockHistory.map(order => (
              <tr key={order.id}>
                <td><strong>{order.id}</strong></td>
                <td>{order.supplier}</td>
                <td>₹{order.total.toFixed(2)}</td>
                <td>{order.orderDate}</td>
                <td>{order.receivedDate}</td>
                <td>
                  <span className={`po-status po-status-completed`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <button className="btn-icon" title="View Details"><FiEye /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseHistory;
