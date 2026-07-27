import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/suppliers/suppliers.css';

const SupplierForm = ({ initialData, isEdit }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pin: '',
    status: 'Active',
    paymentTerms: 'Net 30',
    rating: 0,
    suppliedMedicines: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        suppliedMedicines: initialData.suppliedMedicines ? initialData.suppliedMedicines.join(', ') : ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would dispatch an action or call an API
    console.log('Saving supplier:', formData);
    navigate('/suppliers');
  };

  return (
    <div className="form-card">
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Supplier Name*</label>
            <input 
              type="text" 
              className="form-control" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              placeholder="e.g. PharmaCorp Ltd."
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Contact Person</label>
            <input 
              type="text" 
              className="form-control" 
              name="contactPerson" 
              value={formData.contactPerson} 
              onChange={handleChange} 
              placeholder="e.g. John Doe"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone Number*</label>
            <input 
              type="tel" 
              className="form-control" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              required 
              placeholder="e.g. +1 234 567 8900"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email Address*</label>
            <input 
              type="email" 
              className="form-control" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              placeholder="e.g. contact@pharmacorp.com"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label className="form-label">Street Address</label>
            <input 
              type="text" 
              className="form-control" 
              name="address" 
              value={formData.address} 
              onChange={handleChange} 
              placeholder="123 Health Ave, Suite 100"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">City</label>
            <input 
              type="text" 
              className="form-control" 
              name="city" 
              value={formData.city} 
              onChange={handleChange} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">State/Province</label>
            <input 
              type="text" 
              className="form-control" 
              name="state" 
              value={formData.state} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">PIN/Zip Code</label>
            <input 
              type="text" 
              className="form-control" 
              name="pin" 
              value={formData.pin} 
              onChange={handleChange} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Status</label>
            <select 
              className="form-control" 
              name="status" 
              value={formData.status} 
              onChange={handleChange}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Payment Terms</label>
            <select 
              className="form-control" 
              name="paymentTerms" 
              value={formData.paymentTerms} 
              onChange={handleChange}
            >
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 45">Net 45</option>
              <option value="Net 60">Net 60</option>
              <option value="Cash on Delivery">Cash on Delivery</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Initial Rating (1-5)</label>
            <input 
              type="number" 
              className="form-control" 
              name="rating" 
              value={formData.rating} 
              onChange={handleChange} 
              min="0" 
              max="5" 
              step="0.5"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label className="form-label">Supplied Medicines (Comma separated)</label>
            <input 
              type="text" 
              className="form-control" 
              name="suppliedMedicines" 
              value={formData.suppliedMedicines} 
              onChange={handleChange} 
              placeholder="e.g. Paracetamol, Amoxicillin, Ibuprofen"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/suppliers')} style={{ width: 'auto', padding: '10px 20px' }}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>
            {isEdit ? 'Update Supplier' : 'Save Supplier'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
