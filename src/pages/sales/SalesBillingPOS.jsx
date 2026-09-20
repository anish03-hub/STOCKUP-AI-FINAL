import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  FiShoppingCart,
  FiPlus,
  FiMinus,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiPrinter,
  FiRefreshCw,
  FiPackage,
  FiFileText,
  FiSearch,
  FiArrowRight,
  FiUser,
  FiPhone,
  FiCreditCard,
  FiDollarSign,
  FiTrash2,
  FiX
} from 'react-icons/fi';
import { billingApi, itemsApi, getUser } from '../../services/api';
import { useCurrency } from '../../context/useCurrency';
import '../../styles/sales/billing.css';

const POPULAR_PRESETS = [
  'Paracetamol',
  'Amoxicillin',
  'Ibuprofen',
  'Cetirizine',
  'Metformin',
  'Azithromycin',
  'Omeprazole',
  'Atorvastatin',
  'Amlodipine',
  'Ciprofloxacin',
];

const SalesBillingPOS = () => {
  const navigate = useNavigate();
  const currentUser = getUser();
  const { formatCurrency, convertCurrency, selectedCurrency, exchangeRate, formatHistorical } = useCurrency();
  const [searchParams] = useSearchParams();
  const queryParamItem = searchParams.get('medicine') || searchParams.get('item') || searchParams.get('name') || searchParams.get('medicineName');

  // Search & Catalog state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Billing inputs
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0.0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saleSuccessData, setSaleSuccessData] = useState(null); // SaleResponseDTO from backend
  const [invoiceModal, setInvoiceModal] = useState(null); // Detailed InvoiceDTO for printing

  // Search items in live PostgreSQL catalog
  const handleSearch = useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await itemsApi.getItems(0, 8, query.trim());
      const items = res?.content || res?.items || (Array.isArray(res) ? res : []);
      setSearchResults(items);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle auto-selection when navigated with query params
  useEffect(() => {
    if (queryParamItem) {
      setSearchQuery(queryParamItem);
      const fetchInitial = async () => {
        try {
          setIsSearching(true);
          const res = await itemsApi.getItems(0, 5, queryParamItem);
          const items = res?.content || res?.items || (Array.isArray(res) ? res : []);
          if (items.length > 0) {
            const match = items[0];
            setSelectedItem(match);
            setUnitPrice(match.sellingPrice || match.price || 15.0);
            setQuantity(1);
            setSearchResults([]);
          }
        } catch (err) {
          console.error('Failed to preselect item:', err);
        } finally {
          setIsSearching(false);
        }
      };
      fetchInitial();
    }
  }, [queryParamItem]);

  const selectItem = (item) => {
    setSelectedItem(item);
    setSearchQuery(item.name);
    setSearchResults([]);
    setUnitPrice(item.sellingPrice || item.price || 15.0);
    setQuantity(1);
    setErrorMessage('');
  };

  const clearSelection = () => {
    setSelectedItem(null);
    setSearchQuery('');
    setSearchResults([]);
    setQuantity(1);
    setUnitPrice(0.0);
    setErrorMessage('');
  };

  // Stock calculations
  const availableStock = selectedItem ? (selectedItem.quantity ?? selectedItem.available ?? 0) : 0;
  const isOutOfStock = availableStock <= 0;
  const isLowStock = availableStock > 0 && availableStock <= 50;
  const remainingStock = Math.max(0, availableStock - quantity);
  const isOverSelling = quantity > availableStock;

  // Financial calculations
  const subtotal = useMemo(() => {
    return Math.round((quantity * unitPrice) * 100) / 100;
  }, [quantity, unitPrice]);

  const taxAmount = 0.0;
  const discountAmount = 0.0;
  const grandTotal = useMemo(() => {
    return Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;
  }, [subtotal, taxAmount, discountAmount]);

  // Adjust quantity
  const handleQuantityChange = (newQty) => {
    const parsed = parseInt(newQty, 10);
    if (isNaN(parsed) || parsed < 1) {
      setQuantity(1);
      return;
    }
    setQuantity(parsed);
    setErrorMessage('');
  };

  // Handle Checkout / Generate Bill
  const handleGenerateBill = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!selectedItem) {
      setErrorMessage('Please search and select a medicine to sell.');
      return;
    }

    if (quantity < 1) {
      setErrorMessage('Quantity sold must be at least 1.');
      return;
    }

    if (isOverSelling) {
      setErrorMessage(`Insufficient stock. Only ${availableStock} boxes are currently available in inventory.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        itemId: selectedItem.id,
        itemCode: selectedItem.code,
        itemName: selectedItem.name,
        quantitySold: quantity,
        unitPrice: unitPrice, // Base USD price preserved in DB
        currency: selectedCurrency,
        exchangeRate: exchangeRate,
        transactionAmount: convertCurrency(grandTotal),
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        paymentMethod: paymentMethod,
        notes: notes.trim() || undefined,
      };

      const response = await billingApi.createSale(payload);

      // Save response to display success modal
      setSaleSuccessData(response);

      // Reset form state for next transaction
      setSelectedItem(null);
      setSearchQuery('');
      setQuantity(1);
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
    } catch (err) {
      console.error('POS Checkout failed:', err);
      setErrorMessage(err.message || 'Failed to process sale transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // View Printable Invoice
  const handleViewInvoice = async (invoiceNumber) => {
    try {
      const invoiceData = await billingApi.getInvoice(invoiceNumber);
      setInvoiceModal(invoiceData);
    } catch (err) {
      console.error('Failed to load invoice details:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const resetAfterSuccess = () => {
    setSaleSuccessData(null);
    clearSelection();
  };

  const companyName = currentUser?.businessName || currentUser?.business_name || 'StockUp AI Pharmacy';

  return (
    <div className="pos-billing-page">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="pos-header">
        <div className="pos-header-left">
          <h1>
            <FiShoppingCart className="pos-header-icon" />
            Point of Sale (POS) Billing
          </h1>
          <p className="page-description">
            Live counter sales terminal with atomic stock deduction, invoice generation, and real-time inventory synchronization.
          </p>
        </div>
        <div className="pos-header-badges">
          <span className="tenant-badge">
            <FiPackage /> {companyName}
          </span>
          <Link to="/sales/history" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <FiFileText /> Sales History
          </Link>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────────── */}
      {errorMessage && (
        <div className="pos-error-banner" role="alert">
          <FiAlertCircle size={20} />
          <div className="error-text">
            <strong>Transaction Notice:</strong> {errorMessage}
          </div>
          <button className="error-dismiss-btn" onClick={() => setErrorMessage('')}>
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* ── Two-Column Desktop POS Layout ────────────────────────────────────── */}
      <div className="pos-main-grid">
        {/* ── LEFT COLUMN: Medicine Selection & Presets ───────────────────────── */}
        <div className="pos-left-panel">
          {/* Search Box */}
          <div className="pos-card search-card">
            <div className="card-header-simple">
              <h3>1. Select Medicine</h3>
              <span className="badge-pill">Live 2,511 Catalog</span>
            </div>

            <div className="search-input-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                className="pos-search-input"
                placeholder="Search medicine name, code (e.g. Paracetamol, N02BE, 0002-0213)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
              />
              {isSearching && <FiRefreshCw className="search-spinner spin" />}
              {searchQuery && (
                <button className="search-clear-btn" onClick={clearSelection} title="Clear search">
                  <FiX size={16} />
                </button>
              )}
            </div>

            {/* Quick Presets */}
            <div className="presets-section">
              <span className="presets-label">Fast Selection Presets:</span>
              <div className="presets-grid">
                {POPULAR_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`preset-chip ${searchQuery.toLowerCase() === preset.toLowerCase() ? 'active' : ''}`}
                    onClick={() => {
                      setSearchQuery(preset);
                      handleSearch(preset);
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && !selectedItem && (
              <div className="search-results-dropdown">
                {searchResults.map((item) => {
                  const stock = item.quantity ?? item.available ?? 0;
                  const itemIsLow = stock > 0 && stock <= 50;
                  const itemIsOut = stock <= 0;

                  return (
                    <div
                      key={item.id || item.code}
                      className={`search-result-item ${itemIsOut ? 'out-of-stock-item' : ''}`}
                      onClick={() => !itemIsOut && selectItem(item)}
                    >
                      <div className="result-info">
                        <div className="result-name">{item.name}</div>
                        <div className="result-meta">
                          <span className="result-code">Code: {item.code || '—'}</span>
                          <span className="result-category">{item.category || 'General'}</span>
                          {item.expiryDate && <span className="result-expiry">Exp: {item.expiryDate}</span>}
                        </div>
                      </div>

                      <div className="result-pricing-action">
                        <div className="result-price">
                          {formatCurrency(item.sellingPrice || item.price || 0)}
                        </div>
                        <div className={`result-stock-tag ${itemIsOut ? 'tag-out' : itemIsLow ? 'tag-low' : 'tag-in'}`}>
                          {itemIsOut ? 'OUT OF STOCK (0)' : itemIsLow ? `LOW: ${stock} boxes` : `${stock} in stock`}
                        </div>
                        <button
                          type="button"
                          className="btn-add-item"
                          disabled={itemIsOut}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectItem(item);
                          }}
                        >
                          {itemIsOut ? 'Unavailable' : 'ADD'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Medicine Details Card */}
          {selectedItem ? (
            <div className={`pos-card selected-medicine-card ${isOutOfStock ? 'card-out' : isLowStock ? 'card-low' : 'card-healthy'}`}>
              <div className="selected-med-header">
                <div className="selected-med-title-area">
                  <span className="selected-indicator">Selected Formulation</span>
                  <h2 className="selected-med-name">{selectedItem.name}</h2>
                  <div className="selected-med-codes">
                    <span className="code-badge">NDC / Code: {selectedItem.code || '—'}</span>
                    <span className="category-badge">{selectedItem.category || 'General Pharma'}</span>
                  </div>
                </div>
                <button className="btn-remove-selection" onClick={clearSelection} title="Remove selection">
                  <FiTrash2 size={18} />
                </button>
              </div>

              <div className="stock-health-metrics">
                <div className="metric-box">
                  <span className="metric-label">Available Stock</span>
                  <span className={`metric-val ${isLowStock ? 'val-warning' : isOutOfStock ? 'val-danger' : 'val-success'}`}>
                    {availableStock} boxes
                  </span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Unit Price</span>
                  <span className="metric-val val-price">
                    {formatCurrency(selectedItem.sellingPrice || selectedItem.price || 15.0)}
                  </span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Remaining After Sale</span>
                  <span className={`metric-val ${remainingStock <= 0 ? 'val-danger' : remainingStock <= 50 ? 'val-warning' : 'val-neutral'}`}>
                    {isOverSelling ? '0 (Deficit)' : `${remainingStock} boxes`}
                  </span>
                </div>
              </div>

              {/* Status & Alerts */}
              {isOutOfStock ? (
                <div className="status-alert-box alert-danger">
                  <FiAlertCircle size={18} />
                  <span>This medicine is currently <strong>OUT OF STOCK</strong> (0 units). Sale cannot be processed.</span>
                  <Link to={`/reorder?medicine=${encodeURIComponent(selectedItem.name)}`} className="alert-reorder-link">
                    Reorder <FiArrowRight />
                  </Link>
                </div>
              ) : isLowStock ? (
                <div className="status-alert-box alert-warning">
                  <FiAlertTriangle size={18} />
                  <span><strong>LOW STOCK WARNING:</strong> Current level is &le; 50 threshold ({availableStock} boxes left).</span>
                  <Link to={`/reorder?medicine=${encodeURIComponent(selectedItem.name)}`} className="alert-reorder-link">
                    Optimize Reorder <FiArrowRight />
                  </Link>
                </div>
              ) : null}

              {/* Over-selling Alert */}
              {isOverSelling && !isOutOfStock && (
                <div className="status-alert-box alert-danger">
                  <FiAlertCircle size={18} />
                  <span><strong>INSUFFICIENT STOCK:</strong> Requested {quantity} boxes exceeds available inventory of {availableStock} boxes.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="pos-card empty-selection-card">
              <FiPackage className="empty-box-icon" />
              <h4>No Medicine Selected</h4>
              <p>Search by name, code, or click any popular medicine chip above to begin billing.</p>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: Cart, Customer & Checkout ─────────────────────────── */}
        <div className="pos-right-panel">
          <div className="pos-card bill-summary-card">
            <div className="card-header-simple">
              <h3>2. Current Bill & Customer</h3>
              <span className="badge-method">{paymentMethod}</span>
            </div>

            {/* Item in Cart Line */}
            {selectedItem ? (
              <div className="cart-item-row">
                <div className="cart-item-details">
                  <div className="cart-item-title">{selectedItem.name}</div>
                  <div className="cart-item-rate">
                    {formatCurrency(unitPrice)} / unit &times; {quantity}
                  </div>
                </div>

                {/* Quantity Control Stepper */}
                <div className="qty-stepper">
                  <button
                    type="button"
                    className="qty-btn"
                    disabled={quantity <= 1 || isSubmitting}
                    onClick={() => handleQuantityChange(quantity - 1)}
                    title="Decrease quantity"
                  >
                    <FiMinus size={14} />
                  </button>
                  <input
                    type="number"
                    className="qty-input"
                    min="1"
                    max={availableStock}
                    value={quantity}
                    disabled={isSubmitting}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                  />
                  <button
                    type="button"
                    className="qty-btn"
                    disabled={quantity >= availableStock || isSubmitting}
                    onClick={() => handleQuantityChange(quantity + 1)}
                    title="Increase quantity"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>

                <div className="cart-item-total">
                  {formatCurrency(subtotal)}
                </div>
              </div>
            ) : (
              <div className="cart-empty-line">
                <em>Cart is currently empty. Add a medicine from the left panel.</em>
              </div>
            )}

            <hr className="divider" />

            {/* Customer Details Form */}
            <div className="customer-fields-section">
              <span className="section-label">Customer Information (Optional):</span>
              <div className="form-row">
                <div className="input-group-icon">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Customer Name"
                    value={customerName}
                    disabled={isSubmitting}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="input-group-icon">
                  <FiPhone className="input-icon" />
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Phone Number"
                    value={customerPhone}
                    disabled={isSubmitting}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="payment-method-section">
              <span className="section-label">Payment Method:</span>
              <div className="payment-options-grid">
                {[
                  { id: 'CASH', label: 'Cash Payment', icon: <FiDollarSign /> },
                  { id: 'UPI', label: 'UPI / QR', icon: <FiCreditCard /> },
                  { id: 'CARD', label: 'Debit/Credit Card', icon: <FiCreditCard /> }
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    className={`payment-option-btn ${paymentMethod === method.id ? 'selected' : ''}`}
                    disabled={isSubmitting}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    {method.icon}
                    <span>{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="bill-breakdown">
              <div className="breakdown-row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="breakdown-row">
                <span>Discount</span>
                <span>{formatCurrency(discountAmount)}</span>
              </div>
              <div className="breakdown-row">
                <span>Tax / GST</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="breakdown-row grand-total-row">
                <span>TOTAL PAYABLE</span>
                <span className="grand-total-val">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              type="button"
              className={`btn-checkout ${isSubmitting ? 'submitting' : ''}`}
              disabled={!selectedItem || isOutOfStock || isOverSelling || isSubmitting}
              onClick={handleGenerateBill}
            >
              {isSubmitting ? (
                <>
                  <FiRefreshCw className="spin" size={20} />
                  <span>Processing Sale Transaction...</span>
                </>
              ) : (
                <>
                  <FiCheckCircle size={20} />
                  <span>GENERATE BILL ({formatCurrency(grandTotal)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── SUCCESS MODAL & RECEIPT ─────────────────────────────────────────── */}
      {saleSuccessData && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card success-modal">
            <div className="modal-header-success">
              <div className="success-badge-icon">
                <FiCheckCircle size={36} />
              </div>
              <h2>Sale Completed Successfully!</h2>
              <p className="invoice-num-tag">Invoice #{saleSuccessData.invoiceNumber}</p>
            </div>

            <div className="modal-body-content">
              {/* Summary table */}
              <div className="sale-receipt-summary">
                <div className="receipt-row">
                  <span className="receipt-label">Medicine Formulation:</span>
                  <strong className="receipt-val">{saleSuccessData.itemName || saleSuccessData.medicineName}</strong>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Quantity Sold:</span>
                  <span className="receipt-val">{saleSuccessData.quantitySold || saleSuccessData.quantity} boxes</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Unit Price:</span>
                  <span className="receipt-val">
                    {formatHistorical(
                      saleSuccessData.unitPrice, 
                      saleSuccessData.currency, 
                      saleSuccessData.exchangeRate, 
                      (saleSuccessData.transactionAmount && (saleSuccessData.quantitySold || saleSuccessData.quantity)) 
                        ? saleSuccessData.transactionAmount / (saleSuccessData.quantitySold || saleSuccessData.quantity) 
                        : null
                    )}
                  </span>
                </div>
                <div className="receipt-row total-highlight">
                  <span className="receipt-label">Total Amount Paid:</span>
                  <strong className="receipt-val total-amt">
                    {formatHistorical(
                      saleSuccessData.totalAmount, 
                      saleSuccessData.currency, 
                      saleSuccessData.exchangeRate, 
                      saleSuccessData.transactionAmount
                    )}
                  </strong>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Payment Method:</span>
                  <span className="receipt-val badge-method">{saleSuccessData.paymentMethod || paymentMethod}</span>
                </div>
                {saleSuccessData.customerName && (
                  <div className="receipt-row">
                    <span className="receipt-label">Customer:</span>
                    <span className="receipt-val">{saleSuccessData.customerName}</span>
                  </div>
                )}
              </div>

              {/* Inventory State Transition */}
              <div className="inventory-transition-box">
                <span className="transition-title">Inventory Stock Transition:</span>
                <div className="transition-steps">
                  <div className="t-step">
                    <span className="t-lbl">Before Sale</span>
                    <span className="t-val">{saleSuccessData.stockBefore ?? '—'}</span>
                  </div>
                  <div className="t-arrow">&rarr;</div>
                  <div className="t-step">
                    <span className="t-lbl">Quantity Sold</span>
                    <span className="t-val val-sold">-{saleSuccessData.quantitySold || saleSuccessData.quantity}</span>
                  </div>
                  <div className="t-arrow">&rarr;</div>
                  <div className="t-step">
                    <span className="t-lbl">Remaining Stock</span>
                    <span className={`t-val ${(saleSuccessData.stockAfter ?? 0) <= 50 ? 'val-warning' : 'val-success'}`}>
                      {saleSuccessData.stockAfter ?? saleSuccessData.remainingStock} boxes
                    </span>
                  </div>
                </div>
              </div>

              {/* Alerts if Low Stock or Out of Stock */}
              {(saleSuccessData.isLowStock || (saleSuccessData.stockAfter != null && saleSuccessData.stockAfter <= 50)) && (
                <div className="modal-alert-box alert-warning">
                  <FiAlertTriangle size={20} />
                  <div className="modal-alert-text">
                    <strong>LOW STOCK RESTOCK ALERT:</strong> Stock has reached {saleSuccessData.stockAfter} boxes (&le; 50 threshold).
                  </div>
                  <Link
                    to={`/reorder?medicine=${encodeURIComponent(saleSuccessData.itemName || saleSuccessData.medicineName)}`}
                    className="btn btn-sm btn-warning"
                  >
                    View Reorder
                  </Link>
                </div>
              )}

              {saleSuccessData.isOutOfStock && (
                <div className="modal-alert-box alert-danger">
                  <FiAlertCircle size={20} />
                  <div className="modal-alert-text">
                    <strong>CRITICAL ALERT:</strong> This medicine is now completely <strong>OUT OF STOCK</strong> (0 units)!
                  </div>
                  <Link
                    to={`/reorder?medicine=${encodeURIComponent(saleSuccessData.itemName || saleSuccessData.medicineName)}`}
                    className="btn btn-sm btn-danger"
                  >
                    Order Stock
                  </Link>
                </div>
              )}
            </div>

            <div className="modal-footer-actions">
              <button
                type="button"
                className="btn-modal-print"
                onClick={() => handleViewInvoice(saleSuccessData.invoiceNumber)}
              >
                <FiPrinter size={18} /> Print Official Invoice
              </button>
              <button
                type="button"
                className="btn-modal-history"
                onClick={() => navigate('/sales/history')}
              >
                <FiFileText size={18} /> View Sales History
              </button>
              <button
                type="button"
                className="btn-modal-new-sale"
                onClick={resetAfterSuccess}
              >
                <FiPlus size={18} /> New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINTABLE DETAILED INVOICE MODAL ─────────────────────────────────── */}
      {invoiceModal && (
        <div className="invoice-modal-overlay">
          <div className="invoice-modal-content">
            <div className="invoice-paper" id="printable-invoice">
              <div className="invoice-header">
                <div className="invoice-brand">
                  <h2 className="invoice-logo-title">STOCKUP AI</h2>
                  <p className="invoice-logo-sub">Pharmacy Management & AI Inventory Control</p>
                  <p className="invoice-business-name">{invoiceModal.businessName || companyName}</p>
                </div>
                <div className="invoice-meta-right">
                  <div className="invoice-meta-num">{invoiceModal.invoiceNumber}</div>
                  <div className="invoice-meta-date">
                    {invoiceModal.createdAt ? new Date(invoiceModal.createdAt).toLocaleString() : new Date().toLocaleString()}
                  </div>
                  <span className="invoice-meta-cashier">Cashier: {invoiceModal.createdBy || invoiceModal.cashierEmail || 'Admin'}</span>
                </div>
              </div>

              <div className="invoice-grid-info">
                <div>
                  <strong>Billed To:</strong>
                  <div>{invoiceModal.customerName || 'Walk-in Retail Customer'}</div>
                  {invoiceModal.customerPhone && <div>Phone: {invoiceModal.customerPhone}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>Payment Details:</strong>
                  <div>Method: {invoiceModal.paymentMethod || 'CASH'}</div>
                  <div>Status: <span style={{ color: '#059669', fontWeight: 700 }}>PAID / COMPLETED</span></div>
                </div>
              </div>

              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>NDC / Code</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>{invoiceModal.itemName || invoiceModal.medicineName}</strong></td>
                    <td><code>{invoiceModal.itemCode || '—'}</code></td>
                    <td style={{ textAlign: 'center' }}>{invoiceModal.quantity}</td>
                    <td style={{ textAlign: 'right' }}>
                      {formatHistorical(
                        invoiceModal.unitPrice, 
                        invoiceModal.currency, 
                        invoiceModal.exchangeRate, 
                        (invoiceModal.transactionAmount && invoiceModal.quantity) ? invoiceModal.transactionAmount / invoiceModal.quantity : null
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {formatHistorical(
                        invoiceModal.totalAmount, 
                        invoiceModal.currency, 
                        invoiceModal.exchangeRate, 
                        invoiceModal.transactionAmount
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="invoice-grand-total">
                <span>TOTAL AMOUNT:</span>
                <span>
                  {formatHistorical(
                    invoiceModal.totalAmount, 
                    invoiceModal.currency, 
                    invoiceModal.exchangeRate, 
                    invoiceModal.transactionAmount
                  )}
                </span>
              </div>

              <div className="invoice-footer-note">
                <p>Thank you for choosing {invoiceModal.businessName || companyName}.</p>
                <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                  System-generated invoice &bull; Transaction ID: {invoiceModal.transactionId} &bull; Powered by StockUp AI
                </p>
              </div>
            </div>

            <div className="invoice-modal-footer no-print">
              <button className="btn-print" onClick={handlePrint}>
                <FiPrinter size={16} /> Print Receipt
              </button>
              <button className="btn-close-modal" onClick={() => setInvoiceModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesBillingPOS;
