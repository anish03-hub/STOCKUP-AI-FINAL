import React, { useState, useEffect } from 'react';
import { FiFileText, FiTrash2, FiEye, FiClock, FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { useCurrency } from '../../context/useCurrency';
import { aiDocumentApi } from '../../services/api';

const RecentDocumentsList = ({ onSelectDocument, refreshTrigger }) => {
  const { formatCurrency } = useCurrency();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiDocumentApi.getAll(20);
      setDocuments(data || []);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch recent documents');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document record?')) {
      return;
    }
    try {
      await aiDocumentApi.delete(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert(`Error deleting document: ${err.message}`);
    }
  };

  const handleReview = async (docSummary) => {
    try {
      const fullDoc = await aiDocumentApi.getById(docSummary.id);
      if (onSelectDocument) {
        onSelectDocument(fullDoc);
      }
    } catch (err) {
      alert(`Error loading document details: ${err.message}`);
    }
  };

  const getDocTypeBadge = (type) => {
    switch (type) {
      case 'PURCHASE_INVOICE':
        return <span className="doc-badge badge-purchase">Purchase Invoice</span>;
      case 'SALES_BILL':
        return <span className="doc-badge badge-sales">Sales Bill</span>;
      case 'MEDICINE_MASTER':
        return <span className="doc-badge badge-master">Medicine Master</span>;
      default:
        return <span className="doc-badge badge-generic">Inventory</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPLIED':
        return <span className="doc-state-pill state-applied">✓ Applied</span>;
      case 'PARSED':
        return <span className="doc-state-pill state-parsed">Ready for Review</span>;
      case 'FAILED':
        return <span className="doc-state-pill state-failed">Failed</span>;
      default:
        return <span className="doc-state-pill state-uploaded">{status}</span>;
    }
  };

  return (
    <div className="recent-docs-panel">
      <div className="recent-docs-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h4>Processed Documents History</h4>
          <span className="count-pill">{documents.length}</span>
        </div>
        <button className="btn-refresh" onClick={fetchDocuments} title="Refresh documents list">
          <FiRefreshCw className={loading ? 'spin' : ''} />
        </button>
      </div>

      {loading && documents.length === 0 ? (
        <div className="recent-docs-loading">
          <div className="doc-spinner-pulse" />
          <span>Loading processed documents...</span>
        </div>
      ) : error ? (
        <div className="recent-docs-error">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="recent-docs-empty">
          <FiFileText className="empty-icon" />
          <p>No documents uploaded yet for this tenant.</p>
          <span>Upload PDF invoices or CSV inventory lists to see processing history here.</span>
        </div>
      ) : (
        <div className="recent-docs-list">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="recent-doc-item"
              onClick={() => handleReview(doc)}
            >
              <div className="recent-doc-icon">
                <FiFileText />
              </div>
              <div className="recent-doc-info">
                <div className="recent-doc-top">
                  <span className="recent-doc-title">{doc.fileName}</span>
                  {getStatusBadge(doc.status)}
                </div>
                <div className="recent-doc-meta">
                  {getDocTypeBadge(doc.documentType)}
                  <span>•</span>
                  <span>{doc.itemsCount || 0} items</span>
                  {doc.detectedGrandTotal != null && (
                    <>
                      <span>•</span>
                      <strong>{formatCurrency(doc.detectedGrandTotal)}</strong>
                    </>
                  )}
                  {doc.detectedSupplier && (
                    <>
                      <span>•</span>
                      <span className="doc-supplier-txt">{doc.detectedSupplier}</span>
                    </>
                  )}
                </div>
                <div className="recent-doc-date">
                  <FiClock size={12} />
                  <span>{doc.createdAt ? new Date(doc.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recently'}</span>
                </div>
              </div>
              <div className="recent-doc-actions">
                <button
                  type="button"
                  className="btn-doc-action"
                  title="View / Review Document Diff"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReview(doc);
                  }}
                >
                  <FiEye />
                </button>
                <button
                  type="button"
                  className="btn-doc-action delete"
                  title="Delete Document Record"
                  onClick={(e) => handleDelete(e, doc.id)}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentDocumentsList;
