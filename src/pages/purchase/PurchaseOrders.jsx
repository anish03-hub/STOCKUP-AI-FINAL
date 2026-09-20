import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiPlus, FiClock, FiCheckCircle, FiEye, FiTrash2, 
  FiPackage, FiAlertCircle, FiDollarSign, FiLoader, FiX, FiCheck
} from 'react-icons/fi';
import DataTable from '../../components/common/DataTable';
import '../../styles/purchase/purchase.css';
import { purchaseOrderApi } from '../../services/api';
import { useCurrency } from '../../context/useCurrency';

const PurchaseOrders = () => {
  const { formatCurrency } = useCurrency();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [receivingId, setReceivingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notification, setNotification] = useState(
    location.state?.flashMessage 
      ? { type: 'success', message: location.state.flashMessage } 
      : null
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await purchaseOrderApi.getAll();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load purchase orders:', err);
      setNotification({ type: 'error', message: 'Failed to fetch purchase orders from server.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Handle Receiving Shipment
  const handleReceiveShipment = async (order) => {
    if (!order || !order.id) return;
    try {
      setReceivingId(order.id);
      const res = await purchaseOrderApi.receive(order.id);
      setNotification({
        type: 'success',
        message: `✅ Shipment Received for ${res.poNumber || order.poNumber}! Added ${res.quantityOrdered || order.quantityOrdered} units of ${res.itemName || order.itemName || 'medicine'} to warehouse stock. Stock status updated.`
      });
      // Refresh order ledger
      await fetchOrders();
    } catch (err) {
      console.error('Failed to receive order:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to process shipment receipt.'
      });
    } finally {
      setReceivingId(null);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      await purchaseOrderApi.delete(id);
      setNotification({ type: 'success', message: 'Purchase order deleted successfully.' });
      await fetchOrders();
    } catch (err) {
      console.error('Failed to delete order:', err);
      setNotification({ type: 'error', message: 'Failed to delete purchase order.' });
    }
  };

  // Status mapping for filter tabs
  const filteredOrders = useMemo(() => {
    if (activeTab === 'All') return orders;
    if (activeTab === 'Pending' || activeTab === 'Submitted') {
      return orders.filter(o => o.status === 'SUBMITTED');
    }
    if (activeTab === 'Completed' || activeTab === 'Received') {
      return orders.filter(o => o.status === 'RECEIVED');
    }
    if (activeTab === 'Draft') {
      return orders.filter(o => o.status === 'DRAFT');
    }
    if (activeTab === 'Cancelled') {
      return orders.filter(o => o.status === 'CANCELLED');
    }
    return orders;
  }, [orders, activeTab]);

  const pendingCount = orders.filter(o => o.status === 'SUBMITTED').length;
  const completedCount = orders.filter(o => o.status === 'RECEIVED').length;
  const draftCount = orders.filter(o => o.status === 'DRAFT').length;
  const totalSpend = orders
    .filter(o => o.status === 'RECEIVED')
    .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

  const columns = useMemo(() => [
    { 
      key: 'poNumber', 
      title: 'Order ID', 
      accessor: 'poNumber', 
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
          {val || row.id?.substring(0, 8)}
        </span>
      )
    },
    { 
      key: 'itemName', 
      title: 'Medicine / NDC', 
      accessor: 'itemName', 
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val || 'General Medicine'}</div>
          {row.itemCode && (
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              NDC: {row.itemCode}
            </span>
          )}
        </div>
      )
    },
    { key: 'supplierName', title: 'Distributor', accessor: 'supplierName', sortable: true },
    { 
      key: 'quantityOrdered', 
      title: 'Quantity', 
      accessor: 'quantityOrdered', 
      sortable: true,
      render: (val) => <strong>{val} units</strong>
    },
    { 
      key: 'totalAmount', 
      title: 'Total Amount', 
      accessor: 'totalAmount', 
      type: 'currency', 
      sortable: true,
      render: (val) => formatCurrency(val)
    },
    { 
      key: 'expectedDeliveryDate', 
      title: 'Expected Delivery', 
      accessor: 'expectedDeliveryDate', 
      sortable: true,
      render: (val) => val || 'Pending schedule'
    },
    { 
      key: 'priority', 
      title: 'Priority', 
      accessor: 'priority', 
      sortable: true,
      render: (val) => {
        const p = (val || 'Medium').toLowerCase();
        return (
          <span className={`po-priority po-priority-${p}`}>
            {val || 'Medium'}
          </span>
        );
      }
    },
    { 
      key: 'status', 
      title: 'Status', 
      accessor: 'status', 
      sortable: true,
      render: (val) => {
        const s = (val || 'SUBMITTED').toUpperCase();
        if (s === 'RECEIVED' || s === 'COMPLETED') {
          return <span className="po-status po-status-completed"><FiCheck /> Received</span>;
        }
        if (s === 'SUBMITTED' || s === 'PENDING') {
          return <span className="po-status po-status-pending"><FiClock /> Submitted</span>;
        }
        if (s === 'DRAFT') {
          return <span className="po-status" style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>Draft</span>;
        }
        return <span className="po-status po-status-rejected">Cancelled</span>;
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div className="action-buttons" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {row.status !== 'RECEIVED' && row.status !== 'CANCELLED' && (
            <button
              type="button"
              className="btn-primary"
              style={{
                fontSize: '12px',
                padding: '5px 10px',
                background: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                borderRadius: '6px'
              }}
              onClick={() => handleReceiveShipment(row)}
              disabled={receivingId === row.id}
              title="Receive shipment & update warehouse stock"
            >
              {receivingId === row.id ? (
                <FiLoader className="spin" />
              ) : (
                <FiPackage />
              )}
              <span>Receive</span>
            </button>
          )}
          <button
            type="button"
            className="btn-icon"
            onClick={() => setSelectedOrder(row)}
            title="View Details"
            style={{ padding: '6px', color: 'var(--text-secondary)' }}
          >
            <FiEye />
          </button>
          {row.status !== 'RECEIVED' && (
            <button
              type="button"
              className="btn-icon"
              onClick={() => handleDeleteOrder(row.id)}
              title="Delete Order"
              style={{ padding: '6px', color: '#dc2626' }}
            >
              <FiTrash2 />
            </button>
          )}
        </div>
      )
    }
  ], [receivingId, formatCurrency]);

  return (
    <div className="purchase-page">
      <div className="purchase-header">
        <div>
          <h1>Purchase Orders</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Automated procurement ledger linked directly to PostgreSQL warehouse inventory.
          </p>
        </div>
        <Link to="/purchase-orders/create" className="btn-primary">
          <FiPlus /> Create PO
        </Link>
      </div>

      {notification && (
        <div style={{
          background: notification.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${notification.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: notification.type === 'success' ? '#065f46' : '#991b1b',
          padding: '14px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {notification.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
            <span>{notification.message}</span>
          </div>
          <button 
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      <div className="po-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="po-stat-card pending">
          <div className="stat-icon pending">
            <FiClock />
          </div>
          <div className="stat-info">
            <h3>{pendingCount}</h3>
            <span>Pending / In-Transit</span>
          </div>
        </div>
        <div className="po-stat-card completed">
          <div className="stat-icon completed">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{completedCount}</h3>
            <span>Received & Stocked</span>
          </div>
        </div>
        <div className="po-stat-card" style={{ borderLeftColor: 'var(--text-muted)' }}>
          <div className="stat-icon" style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>
            <FiPackage />
          </div>
          <div className="stat-info">
            <h3>{draftCount}</h3>
            <span>Draft Orders</span>
          </div>
        </div>
        <div className="po-stat-card" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <FiDollarSign />
          </div>
          <div className="stat-info">
            <h3>{formatCurrency(totalSpend, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
            <span>Fulfilled Spend</span>
          </div>
        </div>
      </div>

      <div className="purchase-controls">
        <div className="filter-tabs">
          {['All', 'Submitted', 'Received', 'Draft', 'Cancelled'].map(tab => (
            <button 
              key={tab}
              className={`filter-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        data={filteredOrders}
        columns={columns}
        title="Purchase Order Ledger"
        subtitle="Live procurement records from PostgreSQL — receiving orders instantly increments warehouse stock levels"
        searchPlaceholder="Search by PO number, medicine, NDC, or distributor..."
        searchable
        pageSize={8}
        loading={loading}
      />

      {/* View Details Modal */}
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
            maxWidth: '550px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>
                  Purchase Order: {selectedOrder.poNumber}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Created: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <FiX size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Medicine Name</span>
                  <p style={{ margin: '2px 0 0', fontWeight: '600', color: 'var(--text-primary)' }}>{selectedOrder.itemName || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>NDC Product Code</span>
                  <p style={{ margin: '2px 0 0', fontWeight: '600', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                    {selectedOrder.itemCode || 'N/A'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Distributor</span>
                  <p style={{ margin: '2px 0 0', fontWeight: '600', color: 'var(--text-primary)' }}>{selectedOrder.supplierName || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Priority</span>
                  <p style={{ margin: '2px 0 0', fontWeight: '600', color: 'var(--text-primary)' }}>{selectedOrder.priority || 'Medium'}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: 'var(--surface-muted)', padding: '12px', borderRadius: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Quantity</span>
                  <p style={{ margin: '2px 0 0', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedOrder.quantityOrdered} units</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Unit Cost</span>
                  <p style={{ margin: '2px 0 0', fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(selectedOrder.unitPrice)}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Total Amount</span>
                  <p style={{ margin: '2px 0 0', fontWeight: '700', color: '#059669' }}>
                    {formatCurrency(selectedOrder.totalAmount)}
                  </p>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Expected Delivery</span>
                <p style={{ margin: '2px 0 0', fontWeight: '500', color: 'var(--text-primary)' }}>{selectedOrder.expectedDeliveryDate || 'Not specified'}</p>
              </div>

              {selectedOrder.notes && (
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Instructions / Notes</span>
                  <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)' }}>{selectedOrder.notes}</p>
                </div>
              )}

              {selectedOrder.receivedAt && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px 14px', borderRadius: '6px', color: '#10b981', fontSize: '13px' }}>
                  <strong>Fulfilled & Stocked:</strong> {new Date(selectedOrder.receivedAt).toLocaleString()}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', background: 'var(--surface-muted)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {selectedOrder.status !== 'RECEIVED' && selectedOrder.status !== 'CANCELLED' && (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => {
                    handleReceiveShipment(selectedOrder);
                    setSelectedOrder(null);
                  }}
                >
                  <FiPackage /> Receive Shipment
                </button>
              )}
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setSelectedOrder(null)}
                style={{ width: 'auto' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
