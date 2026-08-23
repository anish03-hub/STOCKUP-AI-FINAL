import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash2, FiPlus, FiUpload, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { itemsApi } from '../../services/api';
import '../../styles/medicines/medicine-inventory.css';

import SummaryCards from './components/SummaryCards';
import DataTable from '../../components/common/DataTable';

const categoryOptions = [
  { value: 'Analgesic', label: 'Analgesic' },
  { value: 'Antibiotic', label: 'Antibiotic' },
  { value: 'NSAID', label: 'NSAID' },
  { value: 'Antihistamine', label: 'Antihistamine' }
];

const statusOptions = [
  { value: 'In Stock', label: 'In Stock' },
  { value: 'Low Stock', label: 'Low Stock' },
  { value: 'Out of Stock', label: 'Out of Stock' },
  { value: 'Expired', label: 'Expired' }
];

const Medicines = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState(null);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const data = await itemsApi.getAll();
      setMedicines(data);
    } catch (err) {
      console.error("Failed to fetch medicines:", err);
      setError(err.message || "Failed to load medicines from the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

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
      const stats = await itemsApi.importCsv(selectedFile);
      setImportStats(stats);
      setSelectedFile(null);
      await fetchMedicines();
    } catch (err) {
      console.error("Import failed:", err);
      setError(err.message || "Failed to import CSV file. Please check structure.");
    } finally {
      setImporting(false);
    }
  };

  const columns = useMemo(() => [
    { key: 'name', title: 'Medicine', accessor: 'name', sortable: true, render: (row) => (
      <div className="medicine-name-cell">
        <div className="medicine-avatar">{row.name.charAt(0).toUpperCase()}</div>
        <div>
          <div className="medicine-name-text">{row.name}</div>
          <div className="medicine-category-text">{row.code}</div>
        </div>
      </div>
    )},
    { key: 'category', title: 'Category', accessor: 'category', sortable: true },
    { key: 'manufacturer', title: 'Manufacturer', accessor: 'manufacturer', sortable: true },
    { key: 'quantity', title: 'Stock', accessor: 'quantity', sortable: true, render: (row) => <span>{row.quantity} units</span> },
    { key: 'sellingPrice', title: 'Price', accessor: 'sellingPrice', type: 'currency', sortable: true },
    { key: 'status', title: 'Status', accessor: 'status', type: 'status', sortable: true },
    { key: 'expiryDate', title: 'Expiry', accessor: 'expiryDate', type: 'date', sortable: true },
    { key: 'actions', title: 'Actions', type: 'actions' },
  ], []);

  const filteredData = medicines.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="medicine-inventory">
      <h1 className="page-title">Pharmacy: <span className="highlight">Medicine</span></h1>

      <SummaryCards medicines={medicines} />
      
      {error && (
        <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', border: '1px solid #f87171', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiAlertCircle size={20} />
          <span><strong>Error:</strong> {error}</span>
        </div>
      )}

      {importStats && (
        <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontWeight: 'bold' }}>
            <FiCheckCircle size={20} color="#10b981" />
            <span>Import Completed Successfully</span>
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
            <span><strong>Processed:</strong> {importStats.totalRecords}</span>
            <span><strong>Imported:</strong> {importStats.imported}</span>
            <span><strong>Updated:</strong> {importStats.updated}</span>
            <span><strong>Skipped:</strong> {importStats.skipped}</span>
          </div>
          {importStats.errors && importStats.errors.length > 0 && (
            <div style={{ marginTop: '10px', fontSize: '13px', color: '#991b1b', borderTop: '1px solid #fca5a5', paddingTop: '8px' }}>
              <strong>Row Errors:</strong>
              <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                {importStats.errors.slice(0, 5).map((err, idx) => <li key={idx}>{err}</li>)}
                {importStats.errors.length > 5 && <li>...and {importStats.errors.length - 5} more errors</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      <DataTable
        data={filteredData}
        columns={columns}
        title="Medicine Inventory"
        subtitle="Monitor medicine availability and expiry trends"
        searchPlaceholder="Search medicines"
        searchable
        loading={loading}
        filters={[
          { key: 'category', label: 'Category', defaultValue: '', options: [{ value: '', label: 'All Categories' }, ...categoryOptions] },
          { key: 'status', label: 'Status', defaultValue: '', options: [{ value: '', label: 'All Statuses' }, ...statusOptions] },
        ]}
        pageSize={10}
        actions={[
          { label: 'View', icon: <FiEye />, onClick: (row) => navigate(`/medicines/${row.code}`) },
          { label: 'Edit', icon: <FiEdit2 />, onClick: (row) => navigate(`/medicines/edit/${row.code}`) },
          { label: 'Delete', icon: <FiTrash2 />, onClick: () => {} },
        ]}
        statusMap={{ in_stock: 'success', low_stock: 'warning', out_of_stock: 'danger', expired: 'danger' }}
        toolbarContent={(
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc', fontSize: '14px', fontWeight: '500' }}>
              <FiUpload /> Choose CSV File
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </label>
            {selectedFile && (
              <span style={{ fontSize: '13px', color: '#64748b', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={selectedFile.name}>
                {selectedFile.name}
              </span>
            )}
            {selectedFile && (
              <button className="btn btn-success" onClick={handleImport} disabled={importing} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                {importing ? 'Importing...' : 'Import'}
              </button>
            )}
            <button className="btn btn-primary" onClick={() => navigate('/medicines/add')} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiPlus /> Add Medicine
            </button>
          </div>
        )}
      />
    </div>
  );
};

export default Medicines;
