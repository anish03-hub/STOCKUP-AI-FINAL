import React, { useState } from 'react';
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
  FiActivity,
  FiTarget
} from 'react-icons/fi';
import '../../styles/reorder/reorder.css';
import { optimizeReorder } from '../../services/api';

const ReorderOptimization = () => {
  const [medicineName, setMedicineName] = useState('');
  const [predictedDemand, setPredictedDemand] = useState('');
  const [leadTimeHours, setLeadTimeHours] = useState('');
  const [serviceLevel, setServiceLevel] = useState('');
  const [state, setState] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!medicineName || !predictedDemand) {
      setErrorMessage('Please provide both Medicine Name and Predicted Demand.');
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
        medicineName: medicineName.trim(),
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
    } catch (err) {
      setErrorMessage(err.message || 'Failed to calculate reorder optimization.');
      setState('error');
    }
  };

  const resetForm = () => {
    setMedicineName('');
    setPredictedDemand('');
    setLeadTimeHours('');
    setServiceLevel('');
    setResult(null);
    setErrorMessage('');
    setState('idle');
  };

  const fmt2 = (n) => (n ?? 0).toFixed(2);
  const fmt4 = (n) => (n ?? 0).toFixed(4);
  const fmtPct = (n) => `${((n ?? 0) * 100).toFixed(0)}%`;
  const fmtCost = (n) =>
    (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="reorder-page">
      <div className="reorder-header">
        <h1><FiShoppingCart /> Reorder Optimization</h1>
        <p className="page-description">
          Optimize your inventory purchasing using <strong>Dynamic Safety Stock</strong>.
          Safety stock is computed from historical demand variability (σ), lead time, and service level —
          not a hardcoded percentage.
        </p>
      </div>

      {state === 'error' && errorMessage && (
        <div className="reorder-alert reorder-alert-error">
          <FiAlertCircle /> <span>{errorMessage}</span>
        </div>
      )}

      <div className="reorder-form-card">
        <h2><FiSearch /> Calculate Reorder Quantity</h2>
        <form onSubmit={handleSubmit}>
          <div className="reorder-form-grid">
            <div className="reorder-form-group">
              <label>Medicine Name <span className="required">*</span></label>
              <input
                type="text"
                placeholder="e.g. Paracetamol"
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                required
              />
            </div>
            <div className="reorder-form-group">
              <label>Predicted Demand <span className="required">*</span></label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={predictedDemand}
                onChange={(e) => setPredictedDemand(e.target.value)}
                min="1"
                required
              />
            </div>
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
                <option value="">Default (95%)</option>
                <option value="0.90">90% — Z = 1.282</option>
                <option value="0.95">95% — Z = 1.645</option>
                <option value="0.99">99% — Z = 2.326</option>
              </select>
            </div>
          </div>
          <div className="reorder-form-actions">
            <button type="submit" className="reorder-btn reorder-btn-primary" disabled={state === 'loading'}>
              {state === 'loading' ? <><span className="reorder-spinner" /> Processing...</> : <><FiShoppingCart /> Optimize Reorder</>}
            </button>
            <button type="button" className="reorder-btn reorder-btn-outline" onClick={resetForm}>
              Clear
            </button>
          </div>
        </form>
      </div>

      {state === 'success' && result && (
        <div className="reorder-result">
          {!result.itemFound && (
            <div className="reorder-alert reorder-alert-warning">
              <FiAlertCircle />
              <span>Medicine not found in inventory database. Displaying calculation with $0 cost.</span>
            </div>
          )}
          {!result.historicalDataAvailable && (
            <div className="reorder-alert reorder-alert-warning">
              <FiInfo />
              <span>
                No historical demand data for this medicine's product code.
                Safety stock is 0 (no demand variability assumed).
                Medicines with ML codes (M01AB, M01AE, N02BA, N02BE, N05B, N05C, R03, R06) have full variability data.
              </span>
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
                  <span className="reorder-badge info">{result.productCode}</span>
                )}
                <span className={`reorder-badge ${result.historicalDataAvailable ? 'success' : 'warning'}`}>
                  {result.historicalDataAvailable ? 'DYNAMIC SAFETY STOCK' : 'NO HISTORY'}
                </span>
              </div>
            </div>

            {/* ── Primary metrics ─────────────────────────────────────── */}
            <div className="reorder-metrics-grid">
              <div className="reorder-metric-box">
                <div className="reorder-metric-label"><FiPackage /> Current Stock</div>
                <div className="reorder-metric-value">{result.currentStock}</div>
                <div className="reorder-metric-sub">units in database</div>
              </div>
              <div className="reorder-metric-box">
                <div className="reorder-metric-label"><FiTrendingUp /> Predicted Demand</div>
                <div className="reorder-metric-value">{result.predictedDemand}</div>
                <div className="reorder-metric-sub">units (user input)</div>
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
                <div className="reorder-metric-value">${fmt2(result.unitPrice)}</div>
                <div className="reorder-metric-sub">from inventory DB</div>
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
                  <div className="reorder-stat-source">sample std dev, saleshourly.csv</div>
                </div>
                <div className="reorder-stat-item">
                  <div className="reorder-stat-label">Service Level</div>
                  <div className="reorder-stat-value">{fmtPct(result.serviceLevel)}</div>
                  <div className="reorder-stat-source">probability of no stockout</div>
                </div>
                <div className="reorder-stat-item">
                  <div className="reorder-stat-label">Z-Score</div>
                  <div className="reorder-stat-value">{fmt2(result.zScore)}</div>
                  <div className="reorder-stat-source">normal distribution quantile</div>
                </div>
                <div className="reorder-stat-item">
                  <div className="reorder-stat-label">Lead Time</div>
                  <div className="reorder-stat-value">{result.leadTimeHours}h</div>
                  <div className="reorder-stat-source">configurable default</div>
                </div>
                <div className="reorder-stat-item">
                  <div className="reorder-stat-label">Expected Lead-Time Demand</div>
                  <div className="reorder-stat-value">{fmt2(result.expectedLeadTimeDemand)}</div>
                  <div className="reorder-stat-source">avg × lead time</div>
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
              <div className="reorder-note">
                <FiInfo className="reorder-note-icon" />
                <span>{result.calculationNote}</span>
              </div>
            )}

            {/* ── Final result ─────────────────────────────────────────── */}
            <div className="reorder-total-cost">
              <div>
                <div className="reorder-total-cost-label">Recommended Reorder Quantity</div>
                <div style={{ color: '#166534', marginTop: '4px' }}>
                  Based on Target Stock of {fmt2(result.targetStock)} units
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="reorder-total-cost-value">
                  {result.reorderQuantity} <span style={{ fontSize: '18px', opacity: 0.8 }}>units</span>
                </div>
                <div style={{ color: '#15803d', fontWeight: '600', marginTop: '4px' }}>
                  Total Cost: ${fmtCost(result.estimatedCost)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReorderOptimization;
