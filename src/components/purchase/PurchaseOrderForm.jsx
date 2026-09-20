import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiLoader,
  FiAlertCircle,
  FiSearch,
  FiZap,
  FiArrowRight,
  FiCpu,
  FiMinus,
  FiTruck,
  FiAward,
  FiRefreshCw
} from 'react-icons/fi';
import { supplierApi, purchaseOrderApi, itemsApi } from '../../services/api';
import { useCurrency } from '../../context/useCurrency';
import '../../styles/purchase/purchase.css';

const PurchaseOrderForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formatCurrency } = useCurrency();

  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Search state for Add Medicines Card
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Read incoming state (from Reorder Optimization or Supplier list)
  const incoming = location.state || {};

  const [formData, setFormData] = useState({
    supplierId: incoming.supplierId || '',
    deliveryDate: incoming.deliveryDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    priority: incoming.priority || 'Medium',
    notes: incoming.productCode ? `Auto-generated draft for NDC ${incoming.productCode}` : ''
  });

  const [items, setItems] = useState([
    {
      id: 1,
      medicine: incoming.medicine ? (incoming.productCode ? `${incoming.medicine} (${incoming.productCode})` : incoming.medicine) : '',
      itemId: incoming.itemId || '',
      itemCode: incoming.productCode || '',
      currentStock: incoming.currentStock ?? 12,
      quantity: incoming.quantity || 100,
      unitPrice: incoming.unitPrice || 15.00,
      status: incoming.currentStock <= 50 ? 'Low Stock' : 'In Stock'
    }
  ]);

  // Fetch live suppliers from database
  useEffect(() => {
    let active = true;
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        const data = await supplierApi.getAll();
        if (active) {
          const list = Array.isArray(data) ? data : [];
          setSuppliers(list);

          if (incoming.supplierName && !incoming.supplierId) {
            const matched = list.find(s => s.name?.toLowerCase() === incoming.supplierName?.toLowerCase());
            if (matched) {
              setFormData(prev => ({ ...prev, supplierId: matched.id }));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load suppliers:', err);
      } finally {
        if (active) setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
    return () => { active = false; };
  }, [incoming.supplierName, incoming.supplierId]);

  const selectedSupplier = useMemo(() => {
    return suppliers.find(s => s.id === formData.supplierId);
  }, [suppliers, formData.supplierId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'notes' && value.length > 250) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    setItems([...items, {
      id: newId,
      medicine: '',
      itemId: '',
      itemCode: '',
      currentStock: 10,
      quantity: 50,
      unitPrice: 15.00,
      status: 'In Stock'
    }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // Medicine search via API
  const handleSearchMedicine = useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await itemsApi.getItems(0, 10, query.trim());
      const list = res?.content || res?.items || (Array.isArray(res) ? res : []);
      setSearchResults(list);
    } catch (err) {
      console.error('Failed to search medicines:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleAddFromSearch = (medItem) => {
    const existingIndex = items.findIndex(
      it => (it.itemId && it.itemId === medItem.id) || (it.itemCode && it.itemCode === medItem.code)
    );

    if (existingIndex >= 0) {
      setItems(prev => prev.map((it, idx) =>
        idx === existingIndex ? { ...it, quantity: (parseInt(it.quantity) || 0) + 50 } : it
      ));
    } else {
      const newRow = {
        id: Date.now(),
        medicine: medItem.name,
        itemId: medItem.id,
        itemCode: medItem.code || '',
        currentStock: medItem.quantity ?? 12,
        quantity: 50,
        unitPrice: medItem.sellingPrice || medItem.price || 15.00,
        status: (medItem.quantity ?? 0) <= 0 ? 'Out of Stock' : (medItem.quantity ?? 0) <= 50 ? 'Low Stock' : 'In Stock'
      };

      if (items.length === 1 && !items[0].medicine.trim()) {
        setItems([newRow]);
      } else {
        setItems(prev => [...prev, newRow]);
      }
    }

    setSearchQuery('');
    setSearchResults([]);
  };

  // Financial calculations
  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)), 0);
  }, [items]);

  const tax = useMemo(() => {
    return subtotal * 0.10; // 10% Tax
  }, [subtotal]);

  const grandTotal = useMemo(() => {
    return subtotal + tax;
  }, [subtotal, tax]);

  // Form submission
  const handleSubmit = async (status = 'SUBMITTED') => {
    setErrorMessage(null);

    if (!formData.supplierId) {
      setErrorMessage('Please select a Pharmaceutical Distributor / Supplier.');
      return;
    }

    const validItems = items.filter(it => it.medicine && it.medicine.trim().length > 0);
    if (validItems.length === 0) {
      setErrorMessage('Please add at least one medicine item to this purchase order.');
      return;
    }

    try {
      setSubmitting(true);
      for (const item of validItems) {
        const payload = {
          itemId: item.itemId || incoming.itemId,
          itemCode: item.itemCode || incoming.productCode || (item.medicine.includes('(') ? item.medicine.split('(')[1]?.replace(')', '')?.trim() : null),
          itemName: item.medicine,
          supplierId: formData.supplierId,
          supplierName: selectedSupplier ? selectedSupplier.name : null,
          quantityOrdered: parseInt(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          priority: formData.priority,
          notes: formData.notes,
          expectedDeliveryDate: formData.deliveryDate,
          status: status
        };
        await purchaseOrderApi.create(payload);
      }

      const message = status === 'DRAFT'
        ? `Purchase order draft saved with ${validItems.length} item(s)!`
        : `Purchase order successfully created with ${validItems.length} item(s)!`;

      navigate('/purchase-orders', {
        state: { flashMessage: message }
      });
    } catch (err) {
      console.error('Failed to create purchase order:', err);
      setErrorMessage(err.message || 'Failed to submit purchase order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const firstMedicineName = items.find(it => it.medicine?.trim())?.medicine || incoming.medicine || 'your medicines';

  return (
    <div className="po-redesign-container">
      {/* ── 1. PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="po-page-header">
        <div className="header-left-col">
          <div className="breadcrumb-nav">
            <Link to="/purchase-orders" className="bc-link">Purchase Orders</Link>
            <span className="bc-sep">&gt;</span>
            <span className="bc-current">Create</span>
          </div>

          <div className="header-title-row">
            <button
              type="button"
              className="btn-back-icon"
              onClick={() => navigate('/purchase-orders')}
              title="Back to Purchase Orders"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="po-main-title">Create Purchase Order</h1>
              <p className="po-main-subtitle">
                Create a new purchase order to restock medicines from your supplier
              </p>
            </div>
          </div>
        </div>

        <div className="header-actions-col">
          <button
            type="button"
            className="btn-reorder-plan"
            onClick={() => navigate('/reorder')}
          >
            <FiCpu size={16} />
            <span>Load from Reorder Plan</span>
          </button>
        </div>
      </div>

      {/* ── REORDER PLAN BANNER (If opened from Reorder Optimization) ────────── */}
      {incoming.medicine && (
        <div className="reorder-plan-banner">
          <FiCheckCircle className="banner-icon" />
          <div className="banner-text">
            ✓ Draft PO pre-populated from Reorder Optimization for <strong>{incoming.medicine}</strong> ({incoming.quantity || 100} units recommended).
          </div>
        </div>
      )}

      {/* ── ERROR MESSAGE BANNER ───────────────────────────────────────────── */}
      {errorMessage && (
        <div className="po-error-alert">
          <FiAlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── 2. TWO-COLUMN MAIN GRID ────────────────────────────────────────── */}
      <div className="po-main-layout-grid">
        {/* ── LEFT COLUMN: MAIN CONTENT (70-75%) ────────────────────────────── */}
        <div className="po-left-column">
          {/* CARD 1: ORDER INFORMATION */}
          <div className="po-card">
            <div className="card-header-block">
              <h2 className="card-title">Order Information</h2>
              <p className="card-subtitle">Supplier details and order configuration</p>
            </div>

            <div className="order-info-form-grid">
              {/* Supplier Dropdown */}
              <div className="form-field-group">
                <label className="field-label">Pharmaceutical Distributor *</label>
                <select
                  className="form-select-custom"
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">
                    {loadingSuppliers ? 'Loading distributors…' : 'Select Distributor / Supplier'}
                  </option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city || 'US'}, {s.state || ''})
                    </option>
                  ))}
                </select>

                {/* Selected Supplier Metric Indicator */}
                {selectedSupplier && (
                  <div className="supplier-meta-badge">
                    <span className="meta-item">
                      <FiTruck className="meta-icon" /> Lead time: <strong>{selectedSupplier.avgLeadTimeDays != null ? selectedSupplier.avgLeadTimeDays : 3} days</strong>
                    </span>
                    <span className="meta-divider">|</span>
                    <span className="meta-item">
                      <FiAward className="meta-icon" /> Performance: <strong>{selectedSupplier.performanceScore != null ? selectedSupplier.performanceScore : 95}%</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Delivery Date */}
              <div className="form-field-group">
                <label className="field-label">Expected Delivery Date *</label>
                <input
                  type="date"
                  className="form-input-custom"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Priority */}
              <div className="form-field-group">
                <label className="field-label">Priority</label>
                <select
                  className="form-select-custom"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent / Emergency Stock</option>
                </select>
              </div>
            </div>

            {/* Notes / Instructions */}
            <div className="notes-field-group">
              <div className="notes-label-row">
                <label className="field-label">Notes / Instructions</label>
                <span className="char-counter">{formData.notes.length} / 250</span>
              </div>
              <textarea
                className="form-textarea-custom"
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Optional delivery instructions or PO reference..."
              />
            </div>
          </div>

          {/* CARD 2: ADD MEDICINES */}
          <div className="po-card">
            <div className="card-header-block">
              <h2 className="card-title">Add Medicines</h2>
              <p className="card-subtitle">Search and add medicines to your purchase order</p>
            </div>

            <div className="search-medicine-bar">
              <div className="search-input-box">
                <FiSearch className="search-input-icon" />
                <input
                  type="text"
                  className="medicine-search-input"
                  placeholder="Search by medicine name, NDC code, or brand..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearchMedicine(e.target.value);
                  }}
                />
                {isSearching && <FiRefreshCw className="search-spinner spin" />}
              </div>

              <button
                type="button"
                className="btn-search-trigger"
                onClick={() => handleSearchMedicine(searchQuery)}
              >
                Search
              </button>

              <button
                type="button"
                className="btn-add-multiple"
                onClick={addItem}
              >
                <FiPlus size={16} />
                <span>Add Multiple Items</span>
              </button>
            </div>

            {/* Live Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="med-search-dropdown">
                {searchResults.map((med) => {
                  const stock = med.quantity ?? 0;
                  const isLow = stock > 0 && stock <= 50;
                  const isOut = stock <= 0;

                  return (
                    <div
                      key={med.id || med.code}
                      className="dropdown-med-item"
                      onClick={() => handleAddFromSearch(med)}
                    >
                      <div className="med-info">
                        <span className="med-name">{med.name}</span>
                        <span className="med-code">NDC: {med.code || '—'}</span>
                      </div>
                      <div className="med-meta-actions">
                        <span className={`status-pill ${isOut ? 'pill-danger' : isLow ? 'pill-warning' : 'pill-success'}`}>
                          {isOut ? 'Out of Stock (0)' : isLow ? `Low: ${stock}` : `${stock} in stock`}
                        </span>
                        <span className="med-price">{formatCurrency(med.sellingPrice || med.price || 15.00)}</span>
                        <button type="button" className="btn-add-pill">
                          + Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CARD 3: ORDER ITEMS */}
          <div className="po-card">
            <div className="card-header-block">
              <h2 className="card-title">Order Items</h2>
              <p className="card-subtitle">
                {items.length} item{items.length === 1 ? '' : 's'} added to this purchase order
              </p>
            </div>

            <div className="po-table-wrapper">
              <table className="po-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '5%' }}>#</th>
                    <th style={{ width: '38%' }}>Medicine Name / NDC Code</th>
                    <th style={{ width: '15%' }}>Current Stock</th>
                    <th style={{ width: '16%' }}>Order Quantity</th>
                    <th style={{ width: '14%' }}>Unit Price</th>
                    <th style={{ width: '12%' }}>Total</th>
                    <th style={{ width: '5%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const rowStock = item.currentStock ?? 12;
                    const isLow = rowStock > 0 && rowStock <= 50;
                    const isOut = rowStock <= 0;
                    const rowTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);

                    return (
                      <tr key={item.id}>
                        <td className="row-index">{idx + 1}</td>
                        <td className="row-medicine">
                          <input
                            type="text"
                            className="table-input-name"
                            placeholder="Enter medicine name or NDC code"
                            value={item.medicine}
                            onChange={(e) => handleItemChange(item.id, 'medicine', e.target.value)}
                            required
                          />
                          {item.itemCode && (
                            <div className="item-sub-code">NDC: {item.itemCode}</div>
                          )}
                        </td>

                        <td className="row-stock">
                          <div className="stock-val-text">{rowStock} units</div>
                          <span className={`status-pill ${isOut ? 'pill-danger' : isLow ? 'pill-warning' : 'pill-success'}`}>
                            {isOut ? 'Critical' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>

                        <td className="row-qty">
                          <div className="qty-stepper-box">
                            <button
                              type="button"
                              className="qty-step-btn"
                              onClick={() => handleItemChange(item.id, 'quantity', Math.max(1, (parseInt(item.quantity) || 0) - 10))}
                            >
                              <FiMinus size={12} />
                            </button>
                            <input
                              type="number"
                              className="table-input-qty"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                              required
                            />
                            <button
                              type="button"
                              className="qty-step-btn"
                              onClick={() => handleItemChange(item.id, 'quantity', (parseInt(item.quantity) || 0) + 10)}
                            >
                              <FiPlus size={12} />
                            </button>
                          </div>
                        </td>

                        <td className="row-price">
                          <input
                            type="number"
                            className="table-input-price"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </td>

                        <td className="row-total">
                          {formatCurrency(rowTotal)}
                        </td>

                        <td className="row-actions">
                          <button
                            type="button"
                            className="btn-delete-row"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                            title="Remove item"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button type="button" className="btn-add-item-row" onClick={addItem}>
              <FiPlus size={16} /> Add Item
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN: STICKY ORDER SUMMARY (25-30%) ───────────────────── */}
        <div className="po-right-column">
          <div className="po-card po-summary-sticky">
            <div className="card-header-block">
              <h2 className="card-title">Order Summary</h2>
              <p className="card-subtitle">Review your order details</p>
            </div>

            <div className="summary-breakdown-rows">
              <div className="summary-row">
                <span className="s-label">Total Items</span>
                <span className="s-val">{items.length}</span>
              </div>
              <div className="summary-row">
                <span className="s-label">Total Quantity</span>
                <span className="s-val">{totalQuantity}</span>
              </div>
              <div className="summary-row">
                <span className="s-label">Subtotal</span>
                <span className="s-val">{formatCurrency(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span className="s-label">Tax (10%)</span>
                <span className="s-val">{formatCurrency(tax)}</span>
              </div>

              <div className="summary-divider" />

              <div className="summary-row grand-total-row">
                <span className="gt-label">Grand Total</span>
                <span className="gt-val">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="summary-action-buttons">
              <button
                type="button"
                className="btn-create-po-primary"
                disabled={submitting}
                onClick={() => handleSubmit('SUBMITTED')}
              >
                {submitting ? (
                  <>
                    <FiLoader className="spin" size={18} />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={18} />
                    <span>Create Purchase Order</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-save-draft-secondary"
                disabled={submitting}
                onClick={() => handleSubmit('DRAFT')}
              >
                Save as Draft
              </button>
            </div>

            {/* AI Smart Recommendation Card */}
            <div className="ai-recommendation-card">
              <div className="ai-rec-header">
                <div className="ai-rec-icon-box">
                  <FiZap size={18} />
                </div>
                <h3>Smart Recommendation</h3>
              </div>
              <p className="ai-rec-text">
                "This quantity ({totalQuantity} units) is based on AI-powered reorder optimization for <strong>{firstMedicineName}</strong>."
              </p>
              <Link to="/reorder" className="ai-rec-link">
                View Reorder Analysis <FiArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
