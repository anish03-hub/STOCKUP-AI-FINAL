import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiFileText,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiPrinter,
  FiEye,
  FiAlertTriangle,
  FiTrendingUp,
  FiDollarSign,
  FiPackage,
  FiShoppingCart,
  FiPlus,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { billingApi, getUser } from '../../services/api';
import { useCurrency } from '../../context/useCurrency';
import '../../styles/sales/billing.css';
import '../../styles/sales/sales.css';

const SalesHistory = () => {
  const currentUser = getUser();
  const { formatCurrency, formatHistorical } = useCurrency();

  // Data states
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected Invoice Modal for View / Print
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Fetch sales history from backend
  const fetchSalesHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await billingApi.getHistory(100);
      setSalesHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load sales history:', err);
      setError(err.message || 'Unable to retrieve sales history.');
      setSalesHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesHistory();
  }, [fetchSalesHistory]);

  // View Invoice Handler
  const handleViewInvoice = async (invoiceNumber) => {
    setLoadingInvoice(true);
    try {
      const invoiceData = await billingApi.getInvoice(invoiceNumber);
      setSelectedInvoice(invoiceData);
    } catch (err) {
      console.error('Failed to fetch invoice details:', err);
      alert('Could not load invoice details for ' + invoiceNumber);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered list
  const filteredSales = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return salesHistory.filter((item) => {
      // Search by invoice #, medicine name, customer name, phone, item code
      const query = searchTerm.toLowerCase().trim();
      const matchQuery =
        !query ||
        (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(query)) ||
        (item.itemName && item.itemName.toLowerCase().includes(query)) ||
        (item.itemCode && item.itemCode.toLowerCase().includes(query)) ||
        (item.customerName && item.customerName.toLowerCase().includes(query)) ||
        (item.customerPhone && item.customerPhone.includes(query));

      // Payment filter
      const matchPayment =
        paymentFilter === 'ALL' || (item.paymentMethod && item.paymentMethod.toUpperCase() === paymentFilter);

      // Date range filter
      let matchDate = true;
      if (item.createdAt) {
        const itemDate = new Date(item.createdAt);
        if (dateRangeFilter === 'TODAY') {
          matchDate = item.createdAt.startsWith(todayStr);
        } else if (dateRangeFilter === 'WEEK') {
          matchDate = itemDate >= sevenDaysAgo;
        } else if (dateRangeFilter === 'MONTH') {
          matchDate = itemDate >= thirtyDaysAgo;
        }
      }

      return matchQuery && matchPayment && matchDate;
    });
  }, [salesHistory, searchTerm, paymentFilter, dateRangeFilter]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, currentPage, pageSize]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = salesHistory.filter((s) => s.createdAt && s.createdAt.startsWith(todayStr));

    const todayRevenue = todaySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const todayUnits = todaySales.reduce((sum, s) => sum + (s.quantitySold || s.quantity || 0), 0);
    const totalInvoices = salesHistory.length;
    const allRevenue = salesHistory.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const avgOrderValue = totalInvoices > 0 ? allRevenue / totalInvoices : 0;

    return {
      todayRevenue,
      todayUnits,
      todayInvoicesCount: todaySales.length,
      totalInvoices,
      avgOrderValue,
    };
  }, [salesHistory]);

  const companyName = currentUser?.businessName || currentUser?.business_name || 'StockUp AI Pharmacy';

  return (
    <div className="pos-billing-page sales-history-page">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="pos-header">
        <div className="pos-header-left">
          <h1>
            <FiFileText className="pos-header-icon" />
            Pharmacy Sales History & Audit Ledger
          </h1>
          <p className="page-description">
            Complete transaction ledger of live POS sales, atomic inventory audits, and customer invoice receipts.
          </p>
        </div>
        <div className="pos-header-badges">
          <span className="tenant-badge">
            <FiPackage /> {companyName}
          </span>
          <Link to="/billing" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <FiPlus /> New POS Sale
          </Link>
        </div>
      </div>

      {/* ── KPI Summary Cards ────────────────────────────────────────────────── */}
      <div className="sales-kpi-grid">
        <div className="sales-kpi-card">
          <div className="kpi-icon-wrap icon-blue">
            <FiDollarSign size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Today's Revenue</span>
            <h2 className="kpi-value">{formatCurrency(kpis.todayRevenue)}</h2>
            <span className="kpi-sub">{kpis.todayInvoicesCount} invoices generated today</span>
          </div>
        </div>

        <div className="sales-kpi-card">
          <div className="kpi-icon-wrap icon-green">
            <FiPackage size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Units Sold Today</span>
            <h2 className="kpi-value">{kpis.todayUnits} boxes</h2>
            <span className="kpi-sub">Across all counters</span>
          </div>
        </div>

        <div className="sales-kpi-card">
          <div className="kpi-icon-wrap icon-purple">
            <FiFileText size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Total Invoices</span>
            <h2 className="kpi-value">{kpis.totalInvoices}</h2>
            <span className="kpi-sub">Lifetime live POS records</span>
          </div>
        </div>

        <div className="sales-kpi-card">
          <div className="kpi-icon-wrap icon-orange">
            <FiTrendingUp size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Average Order Value</span>
            <h2 className="kpi-value">{formatCurrency(kpis.avgOrderValue)}</h2>
            <span className="kpi-sub">Per completed customer bill</span>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Control Bar ───────────────────────────────────────── */}
      <div className="sales-filter-card">
        <div className="search-box-wrap">
          <FiSearch className="search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search invoice #, medicine name, code, customer..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              &times;
            </button>
          )}
        </div>

        <div className="filter-dropdowns">
          <div className="dropdown-group">
            <FiFilter className="dropdown-icon" />
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="ALL">All Payments</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI / QR</option>
              <option value="CARD">Card</option>
            </select>
          </div>

          <div className="dropdown-group">
            <FiCalendar className="dropdown-icon" />
            <select
              value={dateRangeFilter}
              onChange={(e) => {
                setDateRangeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn-refresh"
            onClick={fetchSalesHistory}
            disabled={loading}
            title="Refresh sales ledger"
          >
            <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Transactions Ledger Table ─────────────────────────────────────────── */}
      <div className="pos-card table-card">
        {loading ? (
          <div className="sales-loading-state">
            <FiRefreshCw className="spin" size={32} />
            <p>Loading sales history ledger...</p>
          </div>
        ) : error ? (
          <div className="sales-error-state">
            <FiAlertTriangle size={32} color="#e11d48" />
            <p>{error}</p>
            <button className="btn btn-sm btn-outline" onClick={fetchSalesHistory}>
              Try Again
            </button>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="sales-empty-state">
            <FiShoppingCart size={48} color="#94a3b8" />
            <h3>No Sales Records Found</h3>
            <p>
              {searchTerm || paymentFilter !== 'ALL' || dateRangeFilter !== 'ALL'
                ? 'No transactions match the selected filters. Try clearing your search.'
                : 'Your completed POS transactions will appear here once generated.'}
            </p>
            <Link to="/billing" className="btn btn-primary" style={{ marginTop: '12px' }}>
              <FiPlus /> Create New Sale
            </Link>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="sales-ledger-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Invoice #</th>
                    <th>Medicine Formulation</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th>Payment</th>
                    <th>Customer</th>
                    <th>Remaining Stock</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSales.map((sale) => {
                    const remaining = sale.stockAfter ?? sale.remainingStock ?? 0;
                    const isLow = remaining > 0 && remaining <= 50;
                    const isOut = remaining <= 0;

                    return (
                      <tr key={sale.transactionId || sale.invoiceNumber}>
                        <td className="cell-date">
                          {sale.createdAt ? new Date(sale.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        </td>
                        <td>
                          <code className="invoice-badge-code">{sale.invoiceNumber}</code>
                        </td>
                        <td>
                          <div className="table-med-name">{sale.itemName || sale.medicineName}</div>
                          {sale.itemCode && <span className="table-med-code">Code: {sale.itemCode}</span>}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <strong>{sale.quantitySold || sale.quantity}</strong>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {formatHistorical(
                            sale.unitPrice, 
                            sale.currency, 
                            sale.exchangeRate, 
                            (sale.transactionAmount && (sale.quantitySold || sale.quantity)) ? sale.transactionAmount / (sale.quantitySold || sale.quantity) : null
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong className="table-total-amt">
                            {formatHistorical(
                              sale.totalAmount, 
                              sale.currency, 
                              sale.exchangeRate, 
                              sale.transactionAmount
                            )}
                          </strong>
                        </td>
                        <td>
                          <span className={`payment-tag tag-${(sale.paymentMethod || 'CASH').toLowerCase()}`}>
                            {sale.paymentMethod || 'CASH'}
                          </span>
                        </td>
                        <td>
                          {sale.customerName ? (
                            <div className="table-customer">
                              <span className="customer-name">{sale.customerName}</span>
                              {sale.customerPhone && <span className="customer-phone">{sale.customerPhone}</span>}
                            </div>
                          ) : (
                            <span className="text-muted">Retail Walk-in</span>
                          )}
                        </td>
                        <td>
                          <span className={`stock-status-pill ${isOut ? 'pill-out' : isLow ? 'pill-low' : 'pill-ok'}`}>
                            {isOut ? '0 (Out of Stock)' : isLow ? `${remaining} (Low Stock)` : `${remaining} boxes`}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn-view-invoice"
                            title="View / Print Invoice"
                            disabled={loadingInvoice}
                            onClick={() => handleViewInvoice(sale.invoiceNumber)}
                          >
                            <FiEye size={15} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="table-pagination-footer">
                <span className="pagination-info">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredSales.length)} of {filteredSales.length} records
                </span>
                <div className="pagination-buttons">
                  <button
                    type="button"
                    className="btn-page"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  >
                    <FiChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && <span className="page-ellipsis">...</span>}
                        <button
                          type="button"
                          className={`btn-page ${currentPage === page ? 'active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}

                  <button
                    type="button"
                    className="btn-page"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── INVOICE DETAILS MODAL (PRINTABLE) ─────────────────────────────────── */}
      {selectedInvoice && (
        <div className="invoice-modal-overlay">
          <div className="invoice-modal-content">
            <div className="invoice-paper" id="printable-invoice">
              <div className="invoice-header">
                <div className="invoice-brand">
                  <h2 className="invoice-logo-title">STOCKUP AI</h2>
                  <p className="invoice-logo-sub">Pharmacy Management & AI Inventory Control</p>
                  <p className="invoice-business-name">{selectedInvoice.businessName || companyName}</p>
                </div>
                <div className="invoice-meta-right">
                  <div className="invoice-meta-num">{selectedInvoice.invoiceNumber}</div>
                  <div className="invoice-meta-date">
                    {selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString() : new Date().toLocaleString()}
                  </div>
                  <span className="invoice-meta-cashier">Cashier: {selectedInvoice.createdBy || selectedInvoice.cashierEmail || 'Admin'}</span>
                </div>
              </div>

              <div className="invoice-grid-info">
                <div>
                  <strong>Billed To:</strong>
                  <div>{selectedInvoice.customerName || 'Walk-in Retail Customer'}</div>
                  {selectedInvoice.customerPhone && <div>Phone: {selectedInvoice.customerPhone}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>Payment Details:</strong>
                  <div>Method: {selectedInvoice.paymentMethod || 'CASH'}</div>
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
                    <td><strong>{selectedInvoice.itemName || selectedInvoice.medicineName}</strong></td>
                    <td><code>{selectedInvoice.itemCode || '—'}</code></td>
                    <td style={{ textAlign: 'center' }}>{selectedInvoice.quantity}</td>
                    <td style={{ textAlign: 'right' }}>
                      {formatHistorical(
                        selectedInvoice.unitPrice, 
                        selectedInvoice.currency, 
                        selectedInvoice.exchangeRate, 
                        (selectedInvoice.transactionAmount && selectedInvoice.quantity) ? selectedInvoice.transactionAmount / selectedInvoice.quantity : null
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {formatHistorical(
                        selectedInvoice.totalAmount, 
                        selectedInvoice.currency, 
                        selectedInvoice.exchangeRate, 
                        selectedInvoice.transactionAmount
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="invoice-grand-total">
                <span>TOTAL AMOUNT:</span>
                <span>${(selectedInvoice.totalAmount || 0).toFixed(2)}</span>
              </div>

              <div className="invoice-footer-note">
                <p>Thank you for choosing {selectedInvoice.businessName || companyName}.</p>
                <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                  System-generated invoice &bull; Transaction ID: {selectedInvoice.transactionId} &bull; Powered by StockUp AI
                </p>
              </div>
            </div>

            <div className="invoice-modal-footer no-print">
              <button className="btn-print" onClick={handlePrint}>
                <FiPrinter size={16} /> Print Receipt
              </button>
              <button className="btn-close-modal" onClick={() => setSelectedInvoice(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
