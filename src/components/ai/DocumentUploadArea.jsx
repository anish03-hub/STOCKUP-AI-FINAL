import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiFileText, FiCheckCircle, FiAlertCircle, FiX, FiCpu } from 'react-icons/fi';
import { aiDocumentApi } from '../../services/api';

const DocumentUploadArea = ({ onAnalysisComplete, onCancel }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    if (!file) return false;
    const name = file.name.toLowerCase();
    const isPdf = name.endsWith('.pdf') || file.type === 'application/pdf';
    const isCsv = name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';

    if (!isPdf && !isCsv) {
      setError('Invalid file format. Please upload a PDF (.pdf) or CSV (.csv) document.');
      return false;
    }

    // 15 MB limit
    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds the 15 MB limit.');
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    setError(null);
    setUploading(true);
    try {
      // Step 1: Upload document
      const uploadRes = await aiDocumentApi.upload(selectedFile);
      setUploading(false);
      setAnalyzing(true);

      // Step 2: Analyze & extract structured data
      const analysisRes = await aiDocumentApi.analyze(uploadRes.documentId);
      setAnalyzing(false);

      if (onAnalysisComplete) {
        onAnalysisComplete(analysisRes);
      }
    } catch (err) {
      setUploading(false);
      setAnalyzing(false);
      setError(err.message || 'Failed to process document with AI pipeline.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="doc-upload-container">
      <div className="doc-upload-header">
        <div className="doc-upload-title-wrap">
          <div className="doc-upload-icon-badge">
            <FiCpu />
          </div>
          <div>
            <h3>AI Document Intelligence & Processing</h3>
            <p>Upload PDF invoices, CSV medicine masters, or sales bills for automated extraction & inventory sync</p>
          </div>
        </div>
        {onCancel && (
          <button className="doc-btn-close" onClick={onCancel} title="Close upload">
            <FiX />
          </button>
        )}
      </div>

      {error && (
        <div className="doc-alert-error">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      {!selectedFile ? (
        <div
          className={`doc-dropzone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.csv,application/pdf,text/csv"
            style={{ display: 'none' }}
            onChange={handleChange}
          />
          <div className="dropzone-inner">
            <div className="dropzone-icon">
              <FiUploadCloud />
            </div>
            <h4>Drag and drop your document here</h4>
            <p>Supports <strong>PDF Invoices/Datasheets</strong> and <strong>CSV Master Lists</strong> up to 15MB</p>
            <button
              type="button"
              className="btn-browse"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse Files
            </button>
          </div>
        </div>
      ) : (
        <div className="doc-selected-card">
          <div className="doc-file-info">
            <div className="doc-file-icon">
              <FiFileText />
            </div>
            <div className="doc-file-meta">
              <span className="doc-file-name">{selectedFile.name}</span>
              <span className="doc-file-size">
                {formatFileSize(selectedFile.size)} • {selectedFile.name.endsWith('.pdf') ? 'PDF Document' : 'CSV Spreadsheet'}
              </span>
            </div>
            {!uploading && !analyzing && (
              <button
                className="doc-btn-remove"
                onClick={() => setSelectedFile(null)}
                title="Remove file"
              >
                <FiX />
              </button>
            )}
          </div>

          {(uploading || analyzing) && (
            <div className="doc-processing-status">
              <div className="doc-spinner-pulse" />
              <span>
                {uploading && 'Uploading document to secure tenant storage...'}
                {analyzing && 'AI Data Engine parsing, classifying, and matching inventory...'}
              </span>
            </div>
          )}

          <div className="doc-actions-bar">
            <button
              type="button"
              className="doc-btn-cancel"
              disabled={uploading || analyzing}
              onClick={() => setSelectedFile(null)}
            >
              Change File
            </button>
            <button
              type="button"
              className="doc-btn-process"
              disabled={uploading || analyzing}
              onClick={handleUploadAndAnalyze}
            >
              <FiCpu />
              {uploading || analyzing ? 'Processing...' : 'Analyze & Extract with AI'}
            </button>
          </div>
        </div>
      )}

      <div className="doc-features-hint">
        <div className="doc-hint-item">
          <FiCheckCircle className="hint-icon" />
          <span><strong>Auto-Classification:</strong> Detects purchase orders, sales bills, or medicine masters</span>
        </div>
        <div className="doc-hint-item">
          <FiCheckCircle className="hint-icon" />
          <span><strong>Inventory Diff:</strong> Matches live SKU catalog, shows stock & price deltas</span>
        </div>
        <div className="doc-hint-item">
          <FiCheckCircle className="hint-icon" />
          <span><strong>Atomic Safety:</strong> Safe preview stage before applying any database updates</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadArea;
