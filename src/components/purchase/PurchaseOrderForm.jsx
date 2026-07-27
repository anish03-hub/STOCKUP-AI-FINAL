import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import '../../styles/purchase/purchase.css';
import '../../styles/suppliers/suppliers.css'; // For common form styles

const PurchaseOrderForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    supplierId: '',
    deliveryDate: '',
    priority: 'Medium',
    notes: ''
  });

  const [items, setItems] = useState([
    { id: 1, medicine: '', quantity: 1, unitPrice: 0 }
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    setItems([...items, { id: newId, medicine: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const tax = calculateSubtotal() * 0.1; // 10% tax mock
  const total = calculateSubtotal() + tax;

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('PO Data:', { ...formData, items, total });
    navigate('/purchase-orders');
  };

  return (
    <div className="create-po-form">
      <form onSubmit={handleSubmit}>
        <div className="po-section">
          <h3>Order Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Supplier*</label>
              <select 
                className="form-control" 
                name="supplierId" 
                value={formData.supplierId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Supplier</option>
                <option value="SUP-001">MedLife Distributors</option>
                <option value="SUP-002">PharmaCorp Global</option>
                <option value="SUP-003">CarePlus Medicals</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Expected Delivery Date*</label>
              <input 
                type="date" 
                className="form-control"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select 
                className="form-control"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes/Instructions</label>
              <input 
                type="text" 
                className="form-control"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Optional delivery instructions..."
              />
            </div>
          </div>
        </div>

        <div className="po-section">
          <h3>Order Items</h3>
          <table className="po-items-table">
            <thead>
              <tr>
                <th style={{width: '40%'}}>Medicine Name</th>
                <th style={{width: '20%'}}>Quantity</th>
                <th style={{width: '20%'}}>Unit Price ($)</th>
                <th style={{width: '15%'}}>Total ($)</th>
                <th style={{width: '5%'}}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input 
                      type="text" 
                      className="item-input" 
                      placeholder="Enter medicine name"
                      value={item.medicine}
                      onChange={(e) => handleItemChange(item.id, 'medicine', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      className="item-input" 
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      className="item-input" 
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </td>
                  <td>
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </td>
                  <td>
                    <button 
                      type="button" 
                      className="btn-icon" 
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      style={{ color: items.length === 1 ? '#ccc' : '#ea4335' }}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="add-item-btn" onClick={addItem}>
            <FiPlus /> Add Item
          </button>
        </div>

        <div className="po-total-section">
          <div>
            <div className="total-row">
              <span>Subtotal:</span>
              <span>${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Tax (10%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Grand Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/purchase-orders')} style={{ width: 'auto', padding: '10px 20px' }}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>
            Create Purchase Order
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseOrderForm;
