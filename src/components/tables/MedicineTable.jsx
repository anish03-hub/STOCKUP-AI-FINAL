import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import '../../styles/medicines/medicines.css';

const MedicineTable = ({ medicines, onDelete }) => {
  const navigate = useNavigate();

  const getStatusClass = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Inactive': return 'status-inactive';
      case 'Expired': return 'status-expired';
      default: return '';
    }
  };

  const getInitials = (name) => {
    return name.charAt(0).toUpperCase();
  };

  if (medicines.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No medicines found matching the criteria.
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="medicine-table">
        <thead>
          <tr>
            <th>Medicine Info</th>
            <th>Category</th>
            <th>Manufacturer</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Status</th>
            <th>Expiry Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((medicine) => (
            <tr key={medicine.id}>
              <td>
                <div className="medicine-cell">
                  <div className="medicine-avatar">
                    {getInitials(medicine.name)}
                  </div>
                  <div className="medicine-info">
                    <span className="medicine-name">{medicine.name}</span>
                    <span className="medicine-code-badge">{medicine.code}</span>
                  </div>
                </div>
              </td>
              <td>{medicine.category}</td>
              <td>{medicine.manufacturer}</td>
              <td>
                <span className={medicine.quantity <= medicine.minStock ? 'quantity-low' : ''}>
                  {medicine.quantity}
                </span>
                {medicine.quantity <= medicine.minStock && (
                  <span className="text-xs text-red-500 block">Low Stock</span>
                )}
              </td>
              <td>${medicine.price.toFixed(2)}</td>
              <td>
                <span className={`status-badge ${getStatusClass(medicine.status)}`}>
                  {medicine.status}
                </span>
              </td>
              <td>{new Date(medicine.expiryDate).toLocaleDateString()}</td>
              <td>
                <div className="action-buttons">
                  <button 
                    className="action-btn view" 
                    title="View Details"
                    onClick={() => navigate(`/medicines/${medicine.id}`)}
                  >
                    <FiEye size={18} />
                  </button>
                  <button 
                    className="action-btn edit" 
                    title="Edit Medicine"
                    onClick={() => navigate(`/medicines/edit/${medicine.id}`)}
                  >
                    <FiEdit2 size={18} />
                  </button>
                  <button 
                    className="action-btn delete" 
                    title="Delete Medicine"
                    onClick={() => onDelete(medicine.id)}
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MedicineTable;
