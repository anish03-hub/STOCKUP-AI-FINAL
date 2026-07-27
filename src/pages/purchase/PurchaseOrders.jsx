import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiClock, FiCheckCircle, FiXCircle, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import DataTable from '../../components/common/DataTable';
import '../../styles/purchase/purchase.css';

const mockOrders = [
  { id: 'PO-2023-101', supplier: 'MedLife Distributors', itemsCount: 5, total: 1250.00, deliveryDate: '2023-11-15', priority: 'High', status: 'Pending' },
  { id: 'PO-2023-102', supplier: 'PharmaCorp Global', itemsCount: 2, total: 450.50, deliveryDate: '2023-11-10', priority: 'Medium', status: 'Completed' },
  { id: 'PO-2023-103', supplier: 'CarePlus Medicals', itemsCount: 8, total: 3200.75, deliveryDate: '2023-11-20', priority: 'Low', status: 'Pending' },
  { id: 'PO-2023-104', supplier: 'BioGen Therapeutics', itemsCount: 1, total: 850.00, deliveryDate: '2023-11-05', priority: 'High', status: 'Rejected' },
  { id: 'PO-2023-105', supplier: 'HealthFirst Supplies', itemsCount: 12, total: 5400.00, deliveryDate: '2023-11-08', priority: 'Medium', status: 'Completed' },
];

const PurchaseOrders = () => {
  const [activeTab, setActiveTab] = useState('All');

  const filteredOrders = activeTab === 'All' 
    ? mockOrders 
    : mockOrders.filter(o => o.status === activeTab);

  const pendingCount = mockOrders.filter(o => o.status === 'Pending').length;
  const completedCount = mockOrders.filter(o => o.status === 'Completed').length;
  const rejectedCount = mockOrders.filter(o => o.status === 'Rejected').length;

  const columns = useMemo(() => [
    { key: 'id', title: 'Order ID', accessor: 'id', sortable: true },
    { key: 'supplier', title: 'Supplier', accessor: 'supplier', sortable: true },
    { key: 'itemsCount', title: 'Items', accessor: 'itemsCount', sortable: true },
    { key: 'total', title: 'Total', accessor: 'total', type: 'currency', sortable: true },
    { key: 'deliveryDate', title: 'Delivery', accessor: 'deliveryDate', sortable: true },
    { key: 'priority', title: 'Priority', accessor: 'priority', sortable: true },
    { key: 'status', title: 'Status', accessor: 'status', type: 'status', sortable: true },
    { key: 'actions', title: 'Actions', type: 'actions' },
  ], []);

  return (
    <div className="purchase-page">
      <div className="purchase-header">
        <h1>Purchase Orders</h1>
        <Link to="/purchase-orders/create" className="btn-primary">
          <FiPlus /> Create PO
        </Link>
      </div>

      <div className="po-stats">
        <div className="po-stat-card pending">
          <div className="stat-icon pending">
            <FiClock />
          </div>
          <div className="stat-info">
            <h3>{pendingCount}</h3>
            <span>Pending Orders</span>
          </div>
        </div>
        <div className="po-stat-card completed">
          <div className="stat-icon completed">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{completedCount}</h3>
            <span>Completed Orders</span>
          </div>
        </div>
        <div className="po-stat-card rejected">
          <div className="stat-icon rejected">
            <FiXCircle />
          </div>
          <div className="stat-info">
            <h3>{rejectedCount}</h3>
            <span>Rejected Orders</span>
          </div>
        </div>
      </div>

      <div className="purchase-controls">
        <div className="filter-tabs">
          {['All', 'Pending', 'Completed', 'Rejected'].map(tab => (
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
        subtitle="Review orders by priority, delivery timeline, and approval status"
        searchPlaceholder="Search orders"
        searchable
        filters={[
          { key: 'status', label: 'Status', defaultValue: 'All', options: [{ value: 'All', label: 'All Status' }, { value: 'Pending', label: 'Pending' }, { value: 'Completed', label: 'Completed' }, { value: 'Rejected', label: 'Rejected' }] }
        ]}
        pageSize={6}
        actions={[
          { label: 'View', icon: <FiEye />, onClick: () => {} },
          { label: 'Edit', icon: <FiEdit2 />, onClick: () => {} },
          { label: 'Delete', icon: <FiTrash2 />, onClick: () => {} },
        ]}
        statusMap={{ pending: 'warning', completed: 'success', rejected: 'danger' }}
      />
    </div>
  );
};

export default PurchaseOrders;
