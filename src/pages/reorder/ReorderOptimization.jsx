import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import {
  FiShoppingCart,
  FiSearch,
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiTarget,
  FiAward,
  FiX,
  FiArrowRight,
  FiCheck
} from 'react-icons/fi';
import '../../styles/reorder/reorder.css';
import { optimizeReorder, supplierApi, itemApi, itemsApi } from '../../services/api';
import { useCurrency } from '../../context/useCurrency';

const ReorderOptimization = () => {
  const { formatCurrency } = useCurrency();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search & Autocomplete State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [quickMedicines, setQuickMedicines] = useState([]);

  // Form parameters
  const [medicineName, setMedicineName] = useState('');
  const [predictedDemand, setPredictedDemand] = useState('100');
  const [leadTimeHours, setLeadTimeHours] = useState('');
  const [serviceLevel, setServiceLevel] = useState('');

  // Processing & Results State
  const [state, setState] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Recommended Suppliers State
  const [recommendedSuppliers, setRecommendedSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const dropdownRef = useRef(null);
  const api = itemApi || itemsApi;

  // Search medicines via GET /api/items?search={query}&size=10
  const searchMedicines = useCallback(async (query = '') => {
    try {
      setIsSearching(true);
      const res = await api.getItems(0, 10, query);
      const items = res?.content || (Array.isArray(res) ? res : []);
      setSearchResults(items);
    } catch (err) {
      console.error('Failed to search medicines:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [api]);

  // Initial load: quick picks and check route params
  useEffect(() => {
    let active = true;
    const initData = async () => {
      try {
        const res = await api.getItems(0, 6, '');
        const items = res?.content || (Array.isArray(res) ? res : []);
        if (active) setQuickMedicines(items);

        // Check if navigated with state or URL params (e.g. from low-stock alert or medicine details)
        const incomingMed = location.state?.medicine || location.state?.name || searchParams.get('medicine');
        const incomingCode = location.state?.code || searchParams.get('code');
        const incomingDemand = location.state?.demand || location.state?.predictedDemand;

        if (incomingDemand) setPredictedDemand(String(incomingDemand));

        if (incomingCode || incomingMed) {
          const searchRes = await api.getItems(0, 5, incomingCode || incomingMed);
          const foundItems = searchRes?.content || (Array.isArray(searchRes) ? searchRes : []);
          if (foundItems.length > 0 && active) {
            handleSelectMedicine(foundItems[0]);
            return;
          }
        }

        if (items.length > 0 && !selectedMedicine && active) {
          handleSelectMedicine(items[0]);
        }
      } catch (err) {
        console.error('Failed to initialize reorder data:', err);
      }
    };

    initData();
    return () => { active = false; };
  }, [api, location.state, searchParams]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch supplier recommendations when category changes or calculation completes
  const fetchSupplierRecommendations = async (category) => {
    if (!category) return;
    setLoadingSuppliers(true);
    try {
      const recs = await supplierApi.recommend(category, 4);
      setRecommendedSuppliers(Array.isArray(recs) ? recs : []);
    } catch (err) {
      console.error('Failed to fetch supplier recommendations:', err);
      setRecommendedSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  // Select a medicine from dropdown or quick-pick
  const handleSelectMedicine = (item) => {
    setSelectedMedicine(item);
    setMedicineName(item.name);
    setSearchTerm(`${item.name} (${item.code})`);
    setIsDropdownOpen(false);
    setErrorMessage('');
    if (item.category) {
      fetchSupplierRecommendations(item.category);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setMedicineName(val);
    setSelectedMedicine(null);
    setIsDropdownOpen(true);
    searchMedicines(val);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setMedicineName('');
    setSelectedMedicine(null);
    setSearchResults([]);
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!medicineName && !selectedMedicine) {
      setErrorMessage('Please select or enter a Medicine Name.');
      setState('error');
      return;
    }

    const demand = parseInt(predictedDemand, 10);
    if (isNaN(demand) || demand <= 0) {
      setErrorMessage('Predicted Demand must be greater than 0.');
      setState('error');
      return;
    }

    setState('loading');
    try {
      const payload = {
        medicineName: (selectedMedicine?.name || medicineName).trim(),
        predictedDemand: demand,
      };
      if (leadTimeHours) {
        const lt = parseInt(leadTimeHours, 10);
        if (!isNaN(lt) && lt > 0) payload.leadTimeHours = lt;
      }
      if (serviceLevel) {
        const sl = parseFloat(serviceLevel);
        if (!isNaN(sl)) payload.serviceLevel = sl;
      }

      const data = await optimizeReorder(payload);
      setResult(data);
      setState('success');

      // Ensure suppliers for the category are loaded
      const category = selectedMedicine?.category;
      if (category) {
        fetchSupplierRecommendations(category);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to calculate reorder optimization.');
      setState('error');
    }
  };

  const resetForm = () => {
    setMedicineName('');
    setSearchTerm('');
    setSelectedMedicine(null);
    setPredictedDemand('100');
    setLeadTimeHours('');
    setServiceLevel('');
    setResult(null);
    setErrorMessage('');
    setState('idle');
    setRecommendedSuppliers([]);
  };

  // 1-Click action to create a draft Purchase Order
  const handleCreatePO = (supplier) => {
    const qty = result?.reorderQuantity && result.reorderQuantity > 0 ? result.reorderQuantity : 100;
    const price = supplier?.unitCost || result?.unitPrice || selectedMedicine?.price || 15.0;

    // Calculate expected delivery date from lead time days
    const leadDays = supplier?.avgLeadTimeDays || (leadTimeHours ? Math.ceil(parseInt(leadTimeHours, 10) / 24) : 3);
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + Math.ceil(leadDays));
    const deliveryDateStr = deliveryDate.toISOString().split('T')[0];

    navigate('/purchase-orders/create', {
      state: {
        supplierId: supplier?.supplierId || supplier?.id || '',
        supplierName: supplier?.name || '',
        deliveryDate: deliveryDateStr,
        medicine: result?.medicineName || selectedMedicine?.name || medicineName,
        productCode: result?.productCode || selectedMedicine?.code || '',
        quantity: qty,
        unitPrice: price,
        leadTimeDays: leadDays,
      }
    });
  };

  const fmt2 = (n) => (n ?? 0).toFixed(2);
  const fmt4 = (n) => (n ?? 0).toFixed(4);
  const fmtPct = (n) => `${((n ?? 0) * 100).toFixed(0)}%`;
  const fmtCost = (n) =>
    (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="reorder-page">
      <div className="reorder-header">
        <h1><FiShoppingCart /> Reorder Optimization &amp; Supplier Allocation</h1>
        <p className="page-description">
          Optimize your inventory purchasing using <strong>Dynamic Safety Stock</strong> and AI-ranked 
          pharmaceutical distributors matched to therapeutic categories.
        </p>
      </div>

      {state === 'error' && errorMessage && (
        <div className="reorder-alert reorder-alert-error">
          <FiAlertCircle /> <span>{errorMessage}</span>
        </div>
      )}

      <div className="reorder-form-card">
        <h2><FiSearch /> Search Medicine &amp; Calculate Safety Stock</h2>
        <form onSubmit={handleSubmit}>
          <div className="reorder-form-grid">
            
            {/* ── Medicine Search / Autocomplete ───────────────────────── */}
            <div className="reorder-form-group reorder-search-container" ref={dropdownRef}>
              <label>
                Select Medicine from Database <span className="required">*</span>
              </label>
              <div className="reorder-search-input-wrap">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by name (e.g. Humulin) or NDC code..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    setIsDropdownOpen(true);
                    if (searchResults.length === 0) searchMedicines(searchTerm);
                  }}
                  required
                />
                {searchTerm && (
                  <button type="button" className="reorder-clear-btn" onClick={handleClearSearch}>
                    <FiX />
                  </button>
                )}
              </div>

              {isDropdownOpen && (
                <div className="reorder-autocomplete-menu">
                  {isSearching ? (
                    <div style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      Searching catalog…
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      No medicines matched "{searchTerm}"
                    </div>
                  ) : (
                    searchResults.map((item) => (
                      <div
                        key={item.id || item.code}
                        className={`reorder-autocomplete-item ${selectedMedicine?.code === item.code ? 'active' : ''}`}
                        onClick={() => handleSelectMedicine(item)}
                      >
                        <div className="reorder-item-main">
                          <span className="reorder-item-name">{item.name}</span>
                          <span className="reorder-item-sub">
                            <span>NDC: {item.code}</span>
                            <span>•</span>
                            <span>{item.category || 'General'}</span>
                          </span>
                        </div>
                        <span className={`reorder-item-stock ${(item.quantity ?? 0) <= 50 ? 'low-stock' : 'in-stock'}`}>
                          {(item.quantity ?? 0)} units
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Quick Picks */}
              <div className="reorder-quick-picks">
                <span style={{ fontSize: '11px', color: '#94a3b8', alignSelf: 'center' }}>Popular:</span>
                {quickMedicines.map((m) => (
                  <button
                    key={m.code}
                    type="button"
                    className={`reorder-chip ${selectedMedicine?.code === m.code ? 'selected' : ''}`}
                    onClick={() => handleSelectMedicine(m)}
                  >
                    {m.name.split(' ')[0]} ({m.code})
                  </button>
                ))}
              </div>
            </div>

            {/* ── Predicted Demand ────────────────────────────────────── */}
            <div className="reorder-form-group">
              <label>Predicted Demand (units) <span className="required">*</span></label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={predictedDemand}
                onChange={(e) => setPredictedDemand(e.target.value)}
                min="1"
                required
              />
            </div>

            {/* ── Lead Time ───────────────────────────────────────────── */}
            <div className="reorder-form-group">
              <label>
                Lead Time (hours)
                <span className="reorder-optional-tag"> optional — default: 24h</span>
              </label>
              <input
                type="number"
                placeholder="24"
                value={leadTimeHours}
                onChange={(e) => setLeadTimeHours(e.target.value)}
                min="1"
              />
            </div>

            {/* ── Service Level ───────────────────────────────────────── */}
            <div className="reorder-form-group">
              <label>
                Service Level
                <span className="reorder-optional-tag"> optional — default: 95%</span>
              </label>
              <select
                value={serviceLevel}
                onChange={(e) => setServiceLevel(e.target.value)}
                className="reorder-select"
              >
                <option value="">Default (95%) — Z = 1.645</option>
                <option value="0.90">90% — Z = 1.282</option>
                <option value="0.95">95% — Z = 1.645</option>
                <option value="0.99">99% — Z = 2.326</option>
              </select>
            </div>
          </div>

          <div className="reorder-form-actions">
            <button type="submit" className="reorder-btn reorder-btn-primary" disabled={state === 'loading'}>
              {state === 'loading' ? (
                <><span className="reorder-spinner" /> Optimizing...</>
              ) : (
                <><FiShoppingCart /> Calculate Reorder &amp; Match Suppliers</>
              )}
            </button>
            <button type="button" className="reorder-btn reorder-btn-outline" onClick={resetForm}>
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* ── Results & Supplier Matching ───────────────────────────────── */}
      {state === 'success' && result && (
        <div className="reorder-result">
          {!result.itemFound && (
            <div className="reorder-alert reorder-alert-warning">
              <FiAlertCircle />
              <span>Medicine not found in inventory database. Displaying calculation with $0 cost.</span>
            </div>
          )}

          <div className="reorder-result-card">
            <div className="reorder-result-header">
              <h2><FiCheckCircle /> Optimization Results: {result.medicineName}</h2>
              <div className="reorder-badges">
                <span className={`reorder-badge ${result.itemFound ? 'success' : 'warning'}`}>
                  {result.itemFound ? 'INVENTORY LINKED' : 'GENERIC CALCULATION'}
                </span>
                {result.productCode && (
                  <span className="reorder-badge info">NDC: {result.productCode}</span>
                )}
                {selectedMedicine?.category && (
                  <span className="reorder-badge success">{selectedMedicine.category}</span>
                )}
                <span className={`reorder-badge ${result.historicalDataAvailable ? 'success' : 'warning'}`}>
                  {result.historicalDataAvailable ? 'DYNAMIC SAFETY STOCK' : 'NO DEMAND HISTORY'}
                </span>
              </div>
            </div>

            {/* ── Primary metrics ─────────────────────────────────────── */}
            <div className="reorder-metrics-grid">
              <div className="reorder-metric-box">
                <div className="reorder-metric-label"><FiPackage /> Current Stock</div>
                <div className="reorder-metric-value">{result.currentStock}</div>
                <div className="reorder-metric-sub">units in live database</div>
              </div>
              <div className="reorder-metric-box">
                <div className="reorder-metric-label"><FiTrendingUp /> Predicted Demand</div>
                <div className="reorder-metric-value">{result.predictedDemand}</div>
                <div className="reorder-metric-sub">units required</div>
              </div>
              <div className="reorder-metric-box highlight-box">
                <div className="reorder-metric-label"><FiShield /> Dynamic Safety Stock</div>
                <div className="reorder-metric-value highlight">{fmt2(result.safetyStock)}</div>
                <div className="reorder-metric-sub">
                  Z({fmtPct(result.serviceLevel)}) × σ × √LT
                </div>
              </div>
              <div className="reorder-metric-box">
                <div className="reorder-metric-label"><FiDollarSign /> Unit Price</div>
                <div className="reorder-metric-value">{formatCurrency(result.unitPrice)}</div>
                <div className="reorder-metric-sub">from inventory record</div>
              </div>
            </div>

            {/* ── Dynamic Safety Stock breakdown ───────────────────────── */}
            <div className="reorder-safety-stock-section">
              <div className="reorder-section-title">
                <FiShield /> Dynamic Safety Stock Breakdown
              </div>

              <div className="reorder-formula-box">
                <div className="reorder-formula-text">
                  <strong>Safety Stock</strong> = Z × σ<sub>demand</sub> × √(Lead Time)
                </div>
                <div className="reorder-formula-values">
                  = {fmt2(result.zScore)} × {fmt4(result.demandStdDev)} × √({result.leadTimeHours}h)
                  = <strong>{fmt2(result.safetyStock)} units</strong>
                </div>
              </div>

              <div className="reorder-stats-grid">
                <div className="reorder-stat-item">
                  <div className="reorder-stat-label">Avg Demand / hr</div>
                  <div className="reorder-stat-value">{fmt4(result.averageDemand)}</div>
                  <div className="reorder-stat-source">from {(result.historicalObservations ?? 0).toLocaleString()} observations</div>
                </div>
                <div className="reorder-stat-item">
                  <div className="reorder-stat-label">Demand Std Dev (σ)</div>
                  <div className="reorder-stat-value">{fmt4(result.demandStdDev)}</div>
                  <div className="reorder-stat-source">hourly variability</div>
                </div>
                <div className="reorder-stat-item">
                  <div className="reorder-stat-label">Service Level</div>
                  <div className="reorder-stat-value">{fmtPct(result.serviceLevel)}</div>
                  <div className="reorder-stat-source">no-stockout target</div>
                </div>
                <div className="reorder-stat-item">
                  <div className="reorder-stat-label">Lead Time</div>
                  <div className="reorder-stat-value">{result.leadTimeHours}h</div>
                  <div className="reorder-stat-source">configurable</div>
                </div>
              </div>
            </div>

            {/* ── Reorder Point breakdown ──────────────────────────────── */}
            <div className="reorder-safety-stock-section" style={{ marginTop: '16px' }}>
              <div className="reorder-section-title">
                <FiTarget /> Reorder Point &amp; Target Stock
              </div>

              <div className="reorder-reorder-point-grid">
                <div className="reorder-rp-box">
                  <div className="reorder-rp-label">Reorder Point</div>
                  <div className="reorder-rp-value">{fmt2(result.reorderPoint)}</div>
                  <div className="reorder-rp-desc">= Expected Lead-Time Demand + Safety Stock</div>
                  <div className="reorder-rp-formula">
                    {fmt2(result.expectedLeadTimeDemand)} + {fmt2(result.safetyStock)}
                  </div>
                </div>
                <div className="reorder-rp-box">
                  <div className="reorder-rp-label">Target Stock</div>
                  <div className="reorder-rp-value">{fmt2(result.targetStock)}</div>
                  <div className="reorder-rp-desc">= Reorder Point + Predicted Demand</div>
                  <div className="reorder-rp-formula">
                    {fmt2(result.reorderPoint)} + {result.predictedDemand}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Explanation note ─────────────────────────────────────── */}
            {result.calculationNote && (
              <div className="reorder-note" style={{ marginTop: '16px' }}>
                <FiInfo className="reorder-note-icon" />
                <span>{result.calculationNote}</span>
              </div>
            )}

            {/* ── Final cost banner ─────────────────────────────────────── */}
            <div className="reorder-total-cost">
              <div>
                <div className="reorder-total-cost-label">Recommended Reorder Quantity</div>
                <div style={{ color: '#166534', marginTop: '4px' }}>
                  Based on Target Stock of {fmt2(result.targetStock)} units ({result.currentStock} in stock)
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="reorder-total-cost-value">
                  {result.reorderQuantity} <span style={{ fontSize: '18px', opacity: 0.8 }}>units</span>
                </div>
                <div style={{ color: '#15803d', fontWeight: '600', marginTop: '4px' }}>
                  Estimated Total: {formatCurrency(result.estimatedCost)}
                </div>
              </div>
            </div>
          </div>

          {/* ── Supplier Recommendations Section ─────────────────────── */}
          <div className="reorder-suppliers-section">
            <div className="reorder-suppliers-header">
              <div>
                <h3>
                  <FiAward /> AI-Recommended Pharmaceutical Distributors
                </h3>
                <div className="reorder-suppliers-subtitle">
                  Ranked by multi-factor score: Unit Cost (30%), Lead Time (25%), Reliability (20%), Performance (25%)
                  {selectedMedicine?.category && ` for category: "${selectedMedicine.category}"`}
                </div>
              </div>
            </div>

            {loadingSuppliers ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="reorder-spinner" style={{ margin: '0 auto 10px', borderColor: '#2563eb', borderTopColor: 'transparent' }} />
                Matching distributors for {selectedMedicine?.category || 'selected category'}…
              </div>
            ) : recommendedSuppliers.length === 0 ? (
              <div style={{ padding: '20px', background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                No specialized distributors found for this category. Standard pharmaceutical distributors available in Supplier Network.
              </div>
            ) : (
              <div className="reorder-suppliers-grid">
                {recommendedSuppliers.map((supplier) => (
                  <div key={supplier.supplierId || supplier.name} className="reorder-supplier-card">
                    <div>
                      <div className="reorder-supplier-top">
                        <div className="reorder-supplier-rank">
                          <span className={`rank-pill rank-${supplier.rank <= 3 ? supplier.rank : 'other'}`}>
                            #{supplier.rank}
                          </span>
                          <div>
                            <div className="reorder-supplier-name">{supplier.name}</div>
                          </div>
                        </div>
                        <div className="reorder-score-badge">
                          {Number(supplier.score).toFixed(1)} Score
                        </div>
                      </div>

                      <div className="reorder-supplier-metrics">
                        <div className="reorder-sup-metric">
                          <span className="reorder-sup-metric-label">Unit Cost</span>
                          <span className="reorder-sup-metric-val">
                            {supplier.unitCost != null ? formatCurrency(supplier.unitCost) : '—'}
                          </span>
                        </div>
                        <div className="reorder-sup-metric">
                          <span className="reorder-sup-metric-label">Avg Lead Time</span>
                          <span className="reorder-sup-metric-val">
                            {supplier.avgLeadTimeDays != null ? `${Number(supplier.avgLeadTimeDays).toFixed(1)}d` : '—'}
                          </span>
                        </div>
                        <div className="reorder-sup-metric">
                          <span className="reorder-sup-metric-label">Reliability</span>
                          <span className="reorder-sup-metric-val">
                            ±{supplier.leadTimeStdDevDays != null ? Number(supplier.leadTimeStdDevDays).toFixed(1) : '—'}d
                          </span>
                        </div>
                        <div className="reorder-sup-metric">
                          <span className="reorder-sup-metric-label">Performance</span>
                          <span className="reorder-sup-metric-val">
                            {supplier.rawPerformanceScore != null ? `${Number(supplier.rawPerformanceScore).toFixed(0)}%` : '—'}
                          </span>
                        </div>
                      </div>

                      {supplier.reason && (
                        <div className="reorder-supplier-reason">
                          <FiCheck style={{ color: '#16a34a', marginRight: '4px' }} />
                          {supplier.reason}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="reorder-po-btn"
                      onClick={() => handleCreatePO(supplier)}
                    >
                      <FiShoppingCart /> 1-Click Draft Purchase Order <FiArrowRight />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReorderOptimization;
