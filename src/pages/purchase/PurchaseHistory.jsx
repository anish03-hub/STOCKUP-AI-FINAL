import React, { useState, useEffect } from 'react';
import { FiEye, FiCheckCircle, FiLoader, FiX } from 'react-icons/fi';
import '../../styles/purchase/purchase.css';
import { purchaseOrderApi } from '../../services/api';
import { useCurrency } from '../../context/useCurrency';

const PurchaseHistory = () => {
  const { formatCurrency } = useCurrency();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await purchaseOrderApi.getAll('RECEIVED');
        if (active) {
          setHistory(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load purchase history:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchHistory();
    return () => { active = false; };
  }, []);

  return (
    <div className="purchase-page">
      <div className="purchase-header">
        <div>
          <h1>Purchase History & Receipts</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Archived record of all fulfilled shipments and warehouse stock receipts.
          </p>
        </div>
      </div>

      <div className="po-table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <FiLoader className="spin" size={24} />
            <p style={{ marginTop: '10px' }}>Loading fulfilled receipts...</p>
          </div>
        ) : history.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <FiCheckCircle size={32} style={{ color: '#10b981', marginBottom: '8px' }} />
            <p>No fulfilled shipments yet. Receive pending orders to build history.</p>
          </div>
        ) : (
          <table className="po-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Medicine / NDC</th>
                <th>Supplier</th>
                <th>Qty Received</th>
                <th>Total Cost</th>
                <th>Order Date</th>
                <th>Received Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map(order => (
                <tr key={order.id}>
                  <td><strong>{order.poNumber || order.id?.substring(0, 8)}</strong></td>
                  <td>
                    <div>
                      <strong>{order.itemName || 'Medicine'}</strong>
                      {order.itemCode && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>NDC: {order.itemCode}</div>}
                    </div>
                  </td>
                  <td>{order.supplierName || 'Distributor'}</td>
                  <td><strong>{order.quantityOrdered} units</strong></td>
                  <td><strong>{formatCurrency(order.totalAmount)}</strong></td>
                  <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>{order.receivedAt ? new Date(order.receivedAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className="po-status po-status-completed">
                      Received
                    </span>
                  </td>
                  <td>
                    <button 
                      type="button" 
                      className="btn-icon" 
                      title="View Details"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <FiEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Receipt: {selectedOrder.poNumber}</h3>
              <button type="button" onClick={() => setSelectedOrder(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <FiX size={20} />
              </button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-primary)' }}>
              <p><strong>Medicine:</strong> {selectedOrder.itemName} ({selectedOrder.itemCode})</p>
              <p><strong>Distributor:</strong> {selectedOrder.supplierName}</p>
              <p><strong>Quantity Added to Stock:</strong> {selectedOrder.quantityOrdered} units</p>
              <p><strong>Unit Cost:</strong> {formatCurrency(selectedOrder.unitPrice)}</p>
              <p><strong>Total Cost:</strong> {formatCurrency(selectedOrder.totalAmount)}</p>
              <p><strong>Received At:</strong> {selectedOrder.receivedAt ? new Date(selectedOrder.receivedAt).toLocaleString() : 'N/A'}</p>
            </div>
            <div style={{ padding: '16px 24px', background: 'var(--surface-muted)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setSelectedOrder(null)} style={{ width: 'auto' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseHistory;
