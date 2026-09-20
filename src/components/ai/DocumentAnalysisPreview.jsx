import React, { useState } from 'react';
import { 
  FiCheck, FiAlertTriangle, FiAlertCircle, FiCheckCircle, 
  FiFileText, FiX
} from 'react-icons/fi';
import { useCurrency } from '../../context/useCurrency';
import { aiDocumentApi } from '../../services/api';

const DocumentAnalysisPreview = ({ analysis, onApplied, onDismiss }) => {
  const { formatCurrency } = useCurrency();
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState(null);
  const [applyError, setApplyError] = useState(null);

  const [overrideExisting, setOverrideExisting] = useState(false);
  const [updatePrices, setUpdatePrices] = useState(true);

  if (!analysis) return null;

  const {
    documentId,
    fileName,
    documentType,
    status,
    detectedSupplier,
    detectedCustomer,
    detectedInvoiceNumber,
    detectedDate,
    detectedGrandTotal,
    items = [],
    warnings = [],
    duplicateDetected,
    duplicateInvoiceInfo
  } = analysis;

  const handleApply = async () => {
    setIsApplying(true);
    setApplyError(null);
    try {
      const res = await aiDocumentApi.apply(documentId, {
        overrideExisting,
        updatePrices,
        matchThreshold: 0.65
      });
      setApplyResult(res);
      setIsApplying(false);
      if (onApplied) {
        onApplied(res);
      }
    } catch (err) {
      setIsApplying(false);
      setApplyError(err.message || 'Failed to apply document changes to inventory.');
    }
  };

  const getDocTypeBadge = (type) => {
    switch (type) {
      case 'PURCHASE_INVOICE':
        return <span className="doc-badge badge-purchase">Purchase Invoice (Stock In)</span>;
      case 'SALES_BILL':
        return <span className="doc-badge badge-sales">Sales Bill (Stock Out)</span>;
      case 'MEDICINE_MASTER':
        return <span className="doc-badge badge-master">Medicine Master List</span>;
      default:
        return <span className="doc-badge badge-generic">Inventory Document</span>;
    }
  };

  const getStatusBadge = (itemStatus, action) => {
    switch (itemStatus) {
      case 'MATCHED':
        return <span className="item-badge status-matched">✓ Matched</span>;
      case 'NEW_MEDICINE':
        return <span className="item-badge status-new">+ New Medicine</span>;
      case 'INSUFFICIENT_STOCK':
        return <span className="item-badge status-error">⚠️ Low Stock</span>;
      default:
        return <span className="item-badge status-review">Review ({action || 'CHECK'})</span>;
    }
  };

  return (
    <div className="doc-preview-card">
      {/* Header Bar */}
      <div className="doc-preview-header">
        <div className="doc-header-main">
          <div className="doc-icon-wrap">
            <FiFileText />
          </div>
          <div>
            <div className="doc-title-row">
              <h3>{fileName}</h3>
              {getDocTypeBadge(documentType)}
              <span className={`doc-state-pill state-${status?.toLowerCase()}`}>{status}</span>
            </div>
            <p className="doc-subtitle">
              AI Data Engine extracted <strong>{items.length} items</strong> with live inventory cross-matching
            </p>
          </div>
        </div>
        <div className="doc-header-actions">
          {onDismiss && (
            <button className="btn-icon-dim" onClick={onDismiss} title="Close preview">
              <FiX />
            </button>
          )}
        </div>
      </div>

      {/* Duplicate Warning */}
      {duplicateDetected && (
        <div className="doc-alert-warning">
          <FiAlertTriangle className="alert-icon" />
          <div className="alert-text">
            <strong>Duplicate Invoice Detected:</strong> An invoice with number{' '}
            <code>{detectedInvoiceNumber}</code> was already processed on{' '}
            {duplicateInvoiceInfo?.createdAt ? new Date(duplicateInvoiceInfo.createdAt).toLocaleString() : 'a previous date'}.
            Applying this document again may cause duplicate stock adjustments.
          </div>
        </div>
      )}

      {/* General Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="doc-alert-info">
          <FiAlertCircle className="alert-icon" />
          <div className="alert-text">
            <strong>Extraction Notes:</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Metadata Highlights Grid */}
      <div className="doc-meta-grid">
        {detectedSupplier && (
          <div className="meta-card">
            <span className="meta-label">Supplier / Vendor</span>
            <span className="meta-value">{detectedSupplier}</span>
          </div>
        )}
        {detectedCustomer && (
          <div className="meta-card">
            <span className="meta-label">Customer / Patient</span>
            <span className="meta-value">{detectedCustomer}</span>
          </div>
        )}
        {detectedInvoiceNumber && (
          <div className="meta-card">
            <span className="meta-label">Invoice / Bill #</span>
            <span className="meta-value font-mono">{detectedInvoiceNumber}</span>
          </div>
        )}
        {detectedDate && (
          <div className="meta-card">
            <span className="meta-label">Document Date</span>
            <span className="meta-value">{detectedDate}</span>
          </div>
        )}
        <div className="meta-card">
          <span className="meta-label">Total Items</span>
          <span className="meta-value">{items.length} Extracted</span>
        </div>
        {detectedGrandTotal != null && (
          <div className="meta-card highlight">
            <span className="meta-label">Extracted Grand Total</span>
            <span className="meta-value font-semibold">
              {formatCurrency(detectedGrandTotal)}
            </span>
          </div>
        )}
      </div>

      {/* Apply Error */}
      {applyError && (
        <div className="doc-alert-error" style={{ marginTop: '16px' }}>
          <FiAlertCircle className="alert-icon" />
          <span>{applyError}</span>
        </div>
      )}

      {/* Success Result Banner */}
      {applyResult && (
        <div className="doc-apply-success-box">
          <div className="success-header">
            <FiCheckCircle className="success-icon" />
            <div>
              <h4>{applyResult.message}</h4>
              <p>All stock updates and transaction records have been atomically committed.</p>
            </div>
          </div>
          <div className="apply-stats-grid">
            <div className="stat-pill">
              <span>Items Created:</span> <strong>{applyResult.itemsCreated || 0}</strong>
            </div>
            <div className="stat-pill">
              <span>Items Updated:</span> <strong>{applyResult.itemsUpdated || 0}</strong>
            </div>
            <div className="stat-pill">
              <span>Stock Deltas:</span> <strong>{applyResult.stockDeltasApplied || 0}</strong>
            </div>
            {applyResult.salesTransactionsCreated > 0 && (
              <div className="stat-pill">
                <span>Sales Recorded:</span> <strong>{applyResult.salesTransactionsCreated}</strong>
              </div>
            )}
            {applyResult.purchaseOrdersCreated > 0 && (
              <div className="stat-pill">
                <span>Purchase Orders:</span> <strong>{applyResult.purchaseOrdersCreated}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extracted Items Diff Table */}
      <div className="doc-table-section">
        <div className="table-header-row">
          <h4>Extracted Line Items & Inventory Diff Preview</h4>
          <span className="table-count-badge">{items.length} items</span>
        </div>

        <div className="doc-table-wrapper">
          <table className="doc-diff-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine / Product</th>
                <th>Code / NDC</th>
                <th>Current Stock</th>
                <th>Change</th>
                <th>Expected New</th>
                <th>Unit Price</th>
                <th>Line Total</th>
                <th>Match Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const isPositive = (item.quantityChange || 0) > 0;
                const isNegative = (item.quantityChange || 0) < 0;
                const deltaSign = isPositive ? `+${item.quantityChange}` : `${item.quantityChange}`;
                const hasExisting = item.matchedItemId != null;

                return (
                  <tr key={idx} className={`row-status-${item.status?.toLowerCase()}`}>
                    <td className="cell-muted">{item.rowIndex || idx + 1}</td>
                    <td>
                      <div className="item-name-cell">
                        <span className="med-title">{item.medicineName}</span>
                        {item.matchedItemName && item.matchedItemName !== item.medicineName && (
                          <span className="med-matched-alias">Matched: {item.matchedItemName}</span>
                        )}
                        {item.category && <span className="med-cat">{item.category}</span>}
                      </div>
                    </td>
                    <td className="font-mono text-sm">{item.medicineCode || '—'}</td>
                    <td>
                      {hasExisting ? (
                        <span className="stock-current">{item.currentStock ?? 0}</span>
                      ) : (
                        <span className="stock-none">Not In DB</span>
                      )}
                    </td>
                    <td>
                      <span className={`stock-delta ${isPositive ? 'delta-add' : isNegative ? 'delta-sub' : ''}`}>
                        {deltaSign}
                      </span>
                    </td>
                    <td>
                      <span className="stock-proposed">
                        {item.proposedStock != null ? item.proposedStock : '—'}
                      </span>
                    </td>
                    <td>{formatCurrency(item.unitPrice || 0)}</td>
                    <td className="font-medium">{formatCurrency(item.totalPrice || 0)}</td>
                    <td>{getStatusBadge(item.status, item.action)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Control Options & Actions Footer (Only if not already applied) */}
      {!applyResult && (
        <div className="doc-preview-footer">
          <div className="doc-options-group">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={updatePrices}
                onChange={(e) => setUpdatePrices(e.target.checked)}
              />
              <span>Update unit prices in inventory database</span>
            </label>
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={overrideExisting}
                onChange={(e) => setOverrideExisting(e.target.checked)}
              />
              <span>Force create items if fuzzy match confidence is low</span>
            </label>
          </div>

          <div className="doc-actions-group">
            {onDismiss && (
              <button
                type="button"
                className="btn-secondary"
                disabled={isApplying}
                onClick={onDismiss}
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              className="btn-primary btn-apply"
              disabled={isApplying || items.length === 0}
              onClick={handleApply}
            >
              {isApplying ? (
                <>
                  <div className="btn-spinner" />
                  <span>Applying Changes to Database...</span>
                </>
              ) : (
                <>
                  <FiCheck />
                  <span>Confirm & Apply to Inventory ({items.length} items)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentAnalysisPreview;
