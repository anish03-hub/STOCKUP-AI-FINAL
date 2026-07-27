import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiEdit2, FiPhone, FiMail, FiMapPin, FiUser, FiBriefcase, FiStar } from 'react-icons/fi';
import '../../styles/suppliers/suppliers.css';

const SupplierDetails = () => {
  const { id } = useParams();

  // Mock Data
  const supplier = {
    id: id,
    name: 'MedLife Distributors',
    contactPerson: 'Alice Smith',
    phone: '+1 234-567-8901',
    email: 'orders@medlife.com',
    address: '123 Health Ave',
    city: 'New York',
    state: 'NY',
    pin: '10001',
    status: 'Active',
    paymentTerms: 'Net 30',
    rating: 4.5,
    totalOrders: 156,
    suppliedMedicines: ['Paracetamol', 'Aspirin', 'Ibuprofen', 'Amoxicillin', 'Cetirizine']
  };

  const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8E24AA', '#F4511E'];
  const charCode = supplier.name.charCodeAt(0) + supplier.name.charCodeAt(supplier.name.length - 1);
  const avatarColor = colors[charCode % colors.length];
  const initials = supplier.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const mockPOHistory = [
    { id: 'PO-2023-001', date: '2023-10-01', total: '$1,250.00', status: 'Completed' },
    { id: 'PO-2023-045', date: '2023-10-15', total: '$840.50', status: 'Completed' },
    { id: 'PO-2023-089', date: '2023-11-02', total: '$2,100.00', status: 'Pending' }
  ];

  return (
    <div className="suppliers-page">
      <div className="suppliers-header">
        <h1>Supplier Details</h1>
        <Link to={`/suppliers/edit/${supplier.id}`} className="btn-primary">
          <FiEdit2 /> Edit Supplier
        </Link>
      </div>

      <div className="supplier-detail-header">
        <div className="detail-header-info">
          <div className="supplier-avatar detail-avatar" style={{ backgroundColor: avatarColor }}>
            {initials}
          </div>
          <div>
            <h2 className="detail-name">{supplier.name}</h2>
            <div className="detail-meta">
              <span className="supplier-id">{supplier.id}</span>
              <span className={`status-badge status-${supplier.status.toLowerCase()}`}>
                {supplier.status}
              </span>
              <div className="star-rating">
                {[...Array(5)].map((_, i) => (
                  <FiStar 
                    key={i} 
                    fill={i < Math.floor(supplier.rating) ? "currentColor" : "none"} 
                    stroke={i < Math.floor(supplier.rating) ? "currentColor" : "#cbd5e1"}
                  />
                ))}
                <span style={{color: 'var(--text-muted)', fontSize: '14px', marginLeft: '4px'}}>{supplier.rating}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="supplier-detail-grid">
        <div className="detail-sidebar">
          <div className="detail-section">
            <h3 className="section-title">Contact Information</h3>
            <div className="info-list">
              <div className="info-item">
                <FiUser className="info-icon" />
                <span><strong>Contact:</strong> {supplier.contactPerson}</span>
              </div>
              <div className="info-item">
                <FiPhone className="info-icon" />
                <span>{supplier.phone}</span>
              </div>
              <div className="info-item">
                <FiMail className="info-icon" />
                <span>{supplier.email}</span>
              </div>
              <div className="info-item">
                <FiMapPin className="info-icon" />
                <span>
                  {supplier.address}<br/>
                  {supplier.city}, {supplier.state} {supplier.pin}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Business Info</h3>
            <div className="info-list">
              <div className="info-item">
                <FiBriefcase className="info-icon" />
                <span><strong>Payment Terms:</strong> {supplier.paymentTerms}</span>
              </div>
              <div className="info-item">
                <FiBriefcase className="info-icon" />
                <span><strong>Total Orders:</strong> {supplier.totalOrders}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-main">
          <div className="detail-section">
            <h3 className="section-title">Supplied Medicines</h3>
            <div className="supplier-medicines-list">
              {supplier.suppliedMedicines.map((med, index) => (
                <span key={index} className="medicine-tag">{med}</span>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Recent Purchase Orders</h3>
            <table className="supplier-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockPOHistory.map((po) => (
                  <tr key={po.id}>
                    <td><Link to={`/purchase-orders/${po.id}`}>{po.id}</Link></td>
                    <td>{po.date}</td>
                    <td>{po.total}</td>
                    <td>
                       <span className={`status-badge status-${po.status.toLowerCase() === 'pending' ? 'inactive' : 'active'}`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetails;
