import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiEye, FiEdit2, FiTrash2, FiPlus, FiUpload, FiCheckCircle, 
  FiAlertCircle, FiSearch, FiRefreshCw, FiChevronLeft, FiChevronRight,
  FiChevronsLeft, FiChevronsRight, FiPackage, FiShoppingCart
} from 'react-icons/fi';
import { itemApi, itemsApi, getDashboardSummary } from '../../services/api';
import { useCurrency } from '../../context/useCurrency';
import SummaryCards from './components/SummaryCards';
import '../../styles/medicines/medicine-inventory.css';

const Medicines = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  
  // Data state
  const [medicines, setMedicines] = useState([]);
  const [summary, setSummary] = useState(null);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed for backend API
  const [pageSize, setPageSize] = useState(20);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  // CSV Import States
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(0); // Reset to first page on search
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch paginated medicines & catalog summary
  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const api = itemApi || itemsApi;
      const [itemsData, summaryData] = await Promise.allSettled([
        api.getItems(currentPage, pageSize, debouncedSearch),
        getDashboardSummary().catch(() => null)
      ]);

      if (itemsData.status === 'fulfilled') {
        const data = itemsData.value;
        if (data && data.content) {
          // Paginated Spring Data Page response
          setMedicines(data.content);
          setTotalElements(data.totalElements || data.content.length);
          setTotalPages(data.totalPages || 1);
        } else if (Array.isArray(data)) {
          // Fallback for flat array responses
          setMedicines(data);
          setTotalElements(data.length);
          setTotalPages(Math.ceil(data.length / pageSize) || 1);
        } else {
          setMedicines([]);
          setTotalElements(0);
          setTotalPages(1);
        }
      } else {
        throw itemsData.reason;
      }

      if (summaryData.status === 'fulfilled' && summaryData.value) {
        setSummary(summaryData.value);
      }
    } catch (err) {
      console.error('Failed to fetch medicines:', err);
      setError(err.message || 'Failed to load medicines from the server.');
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  // Handle Delete
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      setDeletingId(id);
      const api = itemApi || itemsApi;
      await api.delete(id);
      await fetchMedicines();
    } catch (err) {
      console.error('Delete failed:', err);
      alert(err.message || 'Failed to delete medicine item.');
    } finally {
      setDeletingId(null);
    }
  };

  // CSV Import Handlers
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportStats(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setError(null);
    setImportStats(null);
    try {
      const api = itemApi || itemsApi;
      const stats = await api.importCsv(selectedFile);
      setImportStats(stats);
      setSelectedFile(null);
      await fetchMedicines();
    } catch (err) {
      console.error('Import failed:', err);
      setError(err.message || 'Failed to import CSV file. Please check file structure.');
    } finally {
      setImporting(false);
    }
  };

  // Helper for Status Badge Class
  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('IN_STOCK') || s.includes('IN STOCK') || s.includes('ACTIVE')) {
      return <span className="status-badge status-green">In Stock</span>;
    }
    if (s.includes('LOW') || s.includes('WARNING')) {
      return <span className="status-badge status-orange">Low Stock</span>;
    }
    if (s.includes('OUT') || s.includes('OUT_OF_STOCK')) {
      return <span className="status-badge status-red">Out of Stock</span>;
    }
    if (s.includes('EXPIRED')) {
      return <span className="status-badge status-darkred">Expired</span>;
    }
    return <span className="status-badge status-yellow">{status || 'Unknown'}</span>;
  };

  // Extract unique categories from current medicines
  const categories = React.useMemo(() => {
    const set = new Set();
    medicines.forEach(m => {
      if (m.category && m.category.trim()) set.add(m.category.trim());
    });
    return Array.from(set).sort();
  }, [medicines]);

  // Filter and Sort medicines
  const displayMedicines = React.useMemo(() => {
    let filtered = medicines.filter(item => {
      if (statusFilter !== 'all') {
        const itemStatus = String(item.status || '').toUpperCase();
        const filter = statusFilter.toUpperCase();
        if (!itemStatus.includes(filter)) return false;
      }
      if (categoryFilter !== 'all') {
        if ((item.category || '').toLowerCase() !== categoryFilter.toLowerCase()) return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [medicines, statusFilter, categoryFilter, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Generate pagination buttons with smart ellipsis
  const renderPaginationButtons = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    if (startPage > 0) {
      pages.push(
        <button key={0} className={`page-btn ${currentPage === 0 ? 'active' : ''}`} onClick={() => setCurrentPage(0)}>
          1
        </button>
      );
      if (startPage > 1) {
        pages.push(<span key="ellipsis-start" style={{ padding: '0 6px', color: '#94a3b8' }}>…</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`page-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => setCurrentPage(i)}
        >
          {i + 1}
        </button>
      );
    }

    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        pages.push(<span key="ellipsis-end" style={{ padding: '0 6px', color: '#94a3b8' }}>…</span>);
      }
      pages.push(
        <button
          key={totalPages - 1}
          className={`page-btn ${currentPage === totalPages - 1 ? 'active' : ''}`}
          onClick={() => setCurrentPage(totalPages - 1)}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="medicine-inventory">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Pharmacy: <span className="highlight">FDA Medicine Catalog</span>
          </h1>
          <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '14px', margin: '4px 0 0 0' }}>
            Connected to live PostgreSQL database ({totalElements.toLocaleString()} active items)
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="btn-primary" 
            onClick={fetchMedicines} 
            disabled={loading}
            title="Refresh database records"
            style={{ padding: '10px 18px', background: 'var(--surface, #f8fafc)', color: 'var(--text-primary, #334155)', border: '1px solid var(--border, #cbd5e1)', boxShadow: 'none' }}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/medicines/add')} 
            style={{ padding: '10px 20px' }}
          >
            <FiPlus /> Add Medicine
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <SummaryCards 
        medicines={medicines} 
        totalElements={totalElements} 
        summary={summary} 
        loading={loading} 
        error={error} 
      />

      {/* Error Notification */}
      {error && (
        <div style={{ margin: '20px 0', padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiAlertCircle size={22} />
            <span><strong>Connection / Database Error:</strong> {error}</span>
          </div>
          <button 
            onClick={fetchMedicines} 
            style={{ background: '#b91c1c', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* CSV Import Success Banner */}
      {importStats && (
        <div style={{ margin: '20px 0', padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontWeight: 'bold' }}>
            <FiCheckCircle size={20} color="#10b981" />
            <span>CSV Import Completed Successfully</span>
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px', flexWrap: 'wrap' }}>
            <span><strong>Processed:</strong> {importStats.totalRecords}</span>
            <span><strong>Imported:</strong> {importStats.imported}</span>
            <span><strong>Updated:</strong> {importStats.updated}</span>
            <span><strong>Skipped:</strong> {importStats.skipped}</span>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="card-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        {/* Toolbar & Controls */}
        <div className="toolbar">
          <div className="toolbar-left" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div className="search-bar">
              <FiSearch color="var(--text-muted, #94a3b8)" />
              <input
                type="text"
                placeholder="Search by NDC code, name, category, manufacturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-dropdown">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock (&le; 50)</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            {categories.length > 0 && (
              <div className="filter-dropdown">
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">All Categories ({categories.length})</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="filter-dropdown">
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}>
                <option value={10}>10 items / page</option>
                <option value={20}>20 items / page</option>
                <option value={50}>50 items / page</option>
                <option value={100}>100 items / page</option>
              </select>
            </div>
          </div>

          <div className="toolbar-right">
            <label 
              style={{ 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', 
                margin: 0, padding: '10px 16px', border: '1px solid var(--border, #cbd5e1)', 
                borderRadius: '12px', background: 'var(--surface-muted, #f8fafc)', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary, #475569)' 
              }}
            >
              <FiUpload /> Upload CSV
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </label>

            {selectedFile && (
              <span style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={selectedFile.name}>
                {selectedFile.name}
              </span>
            )}

            {selectedFile && (
              <button 
                onClick={handleImport} 
                disabled={importing} 
                style={{ padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            )}
          </div>
        </div>

        {/* Responsive Live Medicine Table */}
        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary, #64748b)' }}>
              <FiRefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px auto', display: 'block', color: 'var(--color-primary)' }} />
              <p style={{ fontSize: '16px', fontWeight: '500' }}>Fetching live catalog from PostgreSQL...</p>
            </div>
          ) : displayMedicines.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary, #64748b)' }}>
              <FiPackage size={48} style={{ margin: '0 auto 16px auto', display: 'block', color: 'var(--border, #cbd5e1)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary, #334155)', marginBottom: '8px' }}>No Medicines Found</h3>
              <p style={{ fontSize: '14px' }}>No medicine records matched your filters.</p>
            </div>
          ) : (
            <table className="medicine-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('code')}>
                    NDC Code {sortField === 'code' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                    Medicine Name {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('category')}>
                    Category {sortField === 'category' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th>Manufacturer</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('price')}>
                    Unit Price {sortField === 'price' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('quantity')}>
                    Stock Qty {sortField === 'quantity' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th>Inventory Value</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('expiryDate')}>
                    Expiry Date {sortField === 'expiryDate' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayMedicines.map((item) => {
                  const qty = item.quantity != null ? item.quantity : 0;
                  const price = item.price != null ? item.price : 0;
                  const itemVal = qty * price;
                  return (
                    <tr key={item.id || item.code}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--primary, #2563eb)', background: 'var(--surface-muted, #eff6ff)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
                          {item.code || '—'}
                        </span>
                      </td>
                      <td>
                        <div 
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                          onClick={() => navigate(`/medicines/${item.id || item.code}`)}
                          title="Click to view details"
                        >
                          <div style={{ 
                            width: '36px', height: '36px', borderRadius: '10px', 
                            background: 'var(--surface-muted, #eff6ff)', 
                            color: 'var(--primary, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            fontWeight: '700', fontSize: '14px', flexShrink: 0 
                          }}>
                            {(item.name || 'M').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary, #1e293b)' }}>{item.name}</div>
                            {item.description && (
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary, #475569)' }}>
                          {item.category || 'General Medicine'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary, #475569)' }}>
                          {item.manufacturer || 'Generic Manufacturer'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: '600', fontSize: '13px' }}>
                          {formatCurrency(item.price)}
                        </span>
                      </td>
                      <td>
                        <span className={qty === 0 ? 'stock-critical' : qty <= 50 ? 'stock-low' : 'stock-good'}>
                          {qty} units
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: '600', color: 'var(--primary, #2563eb)', fontSize: '13px' }}>
                          {formatCurrency(itemVal)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary, #475569)' }}>
                          {item.expiryDate || '—'}
                        </span>
                      </td>
                      <td>
                        {getStatusBadge(item.status)}
                      </td>
                      <td>
                        <div className="action-buttons" style={{ justifyContent: 'center', gap: '6px' }}>
                          <button 
                            className="action-btn action-view" 
                            title="View Details"
                            onClick={() => navigate(`/medicines/${item.id || item.code}`)}
                          >
                            <FiEye size={15} />
                          </button>
                          <button 
                            className="action-btn action-sell" 
                            title="Sell in POS Billing"
                            style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                            onClick={() => navigate(`/billing?item=${encodeURIComponent(item.name)}`)}
                          >
                            <FiShoppingCart size={15} />
                          </button>
                          <button 
                            className="action-btn action-edit" 
                            title="Edit Medicine"
                            onClick={() => navigate(`/medicines/${item.id || item.code}/edit`)}
                          >
                            <FiEdit2 size={15} />
                          </button>
                          <button 
                            className="action-btn action-delete" 
                            title="Delete Item"
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item.id, item.name)}
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>


        {/* Pagination Navigation Footer */}
        <div className="pagination">
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {totalElements > 0 ? (
              <>
                Showing <strong>{(currentPage * pageSize) + 1}</strong> – <strong>{Math.min((currentPage + 1) * pageSize, totalElements)}</strong> of <strong>{totalElements.toLocaleString()}</strong> medicines
              </>
            ) : (
              '0 medicines'
            )}
          </div>

          <div className="pagination-controls" style={{ alignItems: 'center' }}>
            <button
              className="page-btn"
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0 || loading}
              title="First Page"
              style={{ padding: '8px 12px' }}
            >
              <FiChevronsLeft />
            </button>
            <button
              className="page-btn"
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0 || loading}
              title="Previous Page"
              style={{ padding: '8px 12px' }}
            >
              <FiChevronLeft />
            </button>

            {renderPaginationButtons()}

            <button
              className="page-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1 || loading}
              title="Next Page"
              style={{ padding: '8px 12px' }}
            >
              <FiChevronRight />
            </button>
            <button
              className="page-btn"
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1 || loading}
              title="Last Page"
              style={{ padding: '8px 12px' }}
            >
              <FiChevronsRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Medicines;
