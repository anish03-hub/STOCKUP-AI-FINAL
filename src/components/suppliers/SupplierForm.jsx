import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/suppliers/suppliers.css';
import { supplierApi } from '../../services/api';

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
    status: 'Active',
    unitCost: 15.00,
    avgLeadTimeDays: 3.0,
    leadTimeStdDevDays: 0.6,
    performanceScore: 92.0,
    fulfilledOrders: 100,
    suppliedCategories: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        contactPerson: initialData.contactPerson || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        status: initialData.status || 'Active',
        unitCost: initialData.unitCost != null ? initialData.unitCost : 15.00,
        avgLeadTimeDays: initialData.avgLeadTimeDays != null ? initialData.avgLeadTimeDays : 3.0,
        leadTimeStdDevDays: initialData.leadTimeStdDevDays != null ? initialData.leadTimeStdDevDays : 0.6,
        performanceScore: initialData.performanceScore != null ? initialData.performanceScore : 92.0,
        fulfilledOrders: initialData.fulfilledOrders != null ? initialData.fulfilledOrders : 100,
        suppliedCategories: Array.isArray(initialData.suppliedCategories)
          ? initialData.suppliedCategories.join(', ')
          : (initialData.suppliedCategories || '')
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

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit && initialData?.id) {
        await supplierApi.update(initialData.id, formData);
      } else {
        await supplierApi.create(formData);
      }
      navigate('/suppliers');
    } catch (err) {
      setError(err.message || 'Failed to save distributor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      {error && <div className="alert alert-error" role="alert" style={{ marginBottom: '16px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Distributor / Supplier Name*</label>
            <input 
              type="text" 
              className="form-control" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              placeholder="e.g. McKesson Health Distribution"
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
              placeholder="e.g. Sarah Jenkins"
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
              placeholder="e.g. +1-415-555-0192"
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
              placeholder="e.g. orders@mckessonhealth.com"
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
              placeholder="1 Post St, Suite 2800"
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
              placeholder="San Francisco"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">State</label>
            <input 
              type="text" 
              className="form-control" 
              name="state" 
              value={formData.state} 
              onChange={handleChange} 
              placeholder="CA"
            />
          </div>
        </div>

        <div className="form-row">
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

          <div className="form-group">
            <label className="form-label">Performance Score (0–100)*</label>
            <input 
              type="number" 
              className="form-control" 
              name="performanceScore" 
              value={formData.performanceScore} 
              onChange={handleNumberChange} 
              min="0" 
              max="100" 
              step="1"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Avg Unit Cost ($)</label>
            <input 
              type="number" 
              className="form-control" 
              name="unitCost" 
              value={formData.unitCost} 
              onChange={handleNumberChange} 
              min="0" 
              step="0.01"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Avg Lead Time (Days)</label>
            <input 
              type="number" 
              className="form-control" 
              name="avgLeadTimeDays" 
              value={formData.avgLeadTimeDays} 
              onChange={handleNumberChange} 
              min="0.5" 
              step="0.1"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label className="form-label">Supplied Therapeutic Categories (Comma separated)</label>
            <input 
              type="text" 
              className="form-control" 
              name="suppliedCategories" 
              value={formData.suppliedCategories} 
              onChange={handleChange} 
              placeholder="e.g. Insulin [CS], General Medicine, Anti-Inflammatory Agents, Antibacterial"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/suppliers')} style={{ width: 'auto', padding: '10px 20px' }}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '10px 20px' }}>
            {loading ? 'Saving…' : isEdit ? 'Update Distributor' : 'Save Distributor'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
