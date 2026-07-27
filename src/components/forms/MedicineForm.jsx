import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiX } from 'react-icons/fi';
import '../../styles/medicines/medicines.css';
import { suppliers } from '../../data/mockData';

const MedicineForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    manufacturer: '',
    batchNumber: '',
    price: '',
    quantity: '',
    minStock: '',
    manufacturingDate: '',
    expiryDate: '',
    supplier: '',
    storageLocation: '',
    status: 'Active',
    description: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Make sure all fields have at least an empty string to avoid uncontrolled inputs
        price: initialData.price || '',
        quantity: initialData.quantity || '',
        minStock: initialData.minStock || '',
        description: initialData.description || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const categories = [
    'Analgesics', 'Antibiotics', 'Antifungal', 'Antiviral', 
    'Vitamins', 'Cardiovascular', 'Antidiabetic', 'Respiratory', 'Gastrointestinal'
  ];

  return (
    <div className="medicine-form-card">
      <div className="form-header">
        <h2>{initialData ? 'Edit Medicine' : 'Add New Medicine'}</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">Medicine Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Paracetamol 500mg"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="code">Medicine Code *</label>
            <input
              type="text"
              id="code"
              name="code"
              className="form-control"
              value={formData.code}
              onChange={handleChange}
              required
              placeholder="e.g. PRC-500"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              className="form-control"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="manufacturer">Manufacturer *</label>
            <input
              type="text"
              id="manufacturer"
              name="manufacturer"
              className="form-control"
              value={formData.manufacturer}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="batchNumber">Batch Number *</label>
            <input
              type="text"
              id="batchNumber"
              name="batchNumber"
              className="form-control"
              value={formData.batchNumber}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              className="form-control"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="price">Price (USD) *</label>
            <input
              type="number"
              step="0.01"
              id="price"
              name="price"
              className="form-control"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="quantity">Initial Quantity *</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              className="form-control"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="minStock">Minimum Stock Level *</label>
            <input
              type="number"
              id="minStock"
              name="minStock"
              className="form-control"
              value={formData.minStock}
              onChange={handleChange}
              required
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="storageLocation">Storage Location</label>
            <input
              type="text"
              id="storageLocation"
              name="storageLocation"
              className="form-control"
              value={formData.storageLocation}
              onChange={handleChange}
              placeholder="e.g. A-1, Shelf 3"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="manufacturingDate">Manufacturing Date *</label>
            <input
              type="date"
              id="manufacturingDate"
              name="manufacturingDate"
              className="form-control"
              value={formData.manufacturingDate}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="expiryDate">Expiry Date *</label>
            <input
              type="date"
              id="expiryDate"
              name="expiryDate"
              className="form-control"
              value={formData.expiryDate}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="supplier">Supplier</label>
            <select
              id="supplier"
              name="supplier"
              className="form-control"
              value={formData.supplier}
              onChange={handleChange}
            >
              <option value="">Select Supplier</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>{sup.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="description">Description / Notes</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            <FiX /> Cancel
          </button>
          <button type="submit" className="btn-primary">
            <FiSave /> {initialData ? 'Update Medicine' : 'Save Medicine'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicineForm;
