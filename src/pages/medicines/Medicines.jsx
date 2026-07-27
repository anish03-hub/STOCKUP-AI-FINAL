import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import '../../styles/medicines/medicine-inventory.css';

import SummaryCards from './components/SummaryCards';
import DataTable from '../../components/common/DataTable';

const mockData = [
  {
    name: "Paracetamol 500mg",
    code: "MED-001",
    category: "Analgesic",
    manufacturer: "PharmaCorp",
    batchNumber: "B12345",
    currentStock: 350,
    purchasePrice: 2.50,
    sellingPrice: 5.00,
    expiryDate: "2026-12-01",
    status: "In Stock"
  },
  {
    name: "Amoxicillin 250mg",
    code: "MED-002",
    category: "Antibiotic",
    manufacturer: "HealthBio",
    batchNumber: "B98765",
    currentStock: 15,
    purchasePrice: 8.00,
    sellingPrice: 15.00,
    expiryDate: "2026-08-15",
    status: "Low Stock"
  },
  {
    name: "Ibuprofen 400mg",
    code: "MED-003",
    category: "NSAID",
    manufacturer: "MedLife",
    batchNumber: "B45678",
    currentStock: 0,
    purchasePrice: 4.20,
    sellingPrice: 8.50,
    expiryDate: "2027-01-20",
    status: "Out of Stock"
  },
  {
    name: "Cetirizine 10mg",
    code: "MED-004",
    category: "Antihistamine",
    manufacturer: "AllergyFree",
    batchNumber: "B11223",
    currentStock: 120,
    purchasePrice: 1.50,
    sellingPrice: 3.50,
    expiryDate: "2026-07-30",
    status: "In Stock"
  },
  {
    name: "Azithromycin 500mg",
    code: "MED-005",
    category: "Antibiotic",
    manufacturer: "HealthBio",
    batchNumber: "B33445",
    currentStock: 45,
    purchasePrice: 12.00,
    sellingPrice: 22.00,
    expiryDate: "2024-05-10",
    status: "Expired"
  }
];

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
    { key: 'currentStock', title: 'Stock', accessor: 'currentStock', sortable: true, render: (row) => <span>{row.currentStock} units</span> },
    { key: 'sellingPrice', title: 'Price', accessor: 'sellingPrice', type: 'currency', sortable: true },
    { key: 'status', title: 'Status', accessor: 'status', type: 'status', sortable: true },
    { key: 'expiryDate', title: 'Expiry', accessor: 'expiryDate', type: 'date', sortable: true },
    { key: 'actions', title: 'Actions', type: 'actions' },
  ], []);

  const filteredData = mockData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="medicine-inventory">
      <h1 className="page-title">Pharmacy: <span className="highlight">Medicine</span></h1>

      <SummaryCards />

      <DataTable
        data={filteredData}
        columns={columns}
        title="Medicine Inventory"
        subtitle="Monitor medicine availability and expiry trends"
        searchPlaceholder="Search medicines"
        searchable
        filters={[
          { key: 'category', label: 'Category', defaultValue: '', options: [{ value: '', label: 'All Categories' }, ...categoryOptions] },
          { key: 'status', label: 'Status', defaultValue: '', options: [{ value: '', label: 'All Statuses' }, ...statusOptions] },
        ]}
        pageSize={6}
        actions={[
          { label: 'View', icon: <FiEye />, onClick: (row) => navigate(`/medicines/${row.code}`) },
          { label: 'Edit', icon: <FiEdit2 />, onClick: (row) => navigate(`/medicines/edit/${row.code}`) },
          { label: 'Delete', icon: <FiTrash2 />, onClick: () => {} },
        ]}
        statusMap={{ in_stock: 'success', low_stock: 'warning', out_of_stock: 'danger', expired: 'danger' }}
        toolbarContent={(
          <button className="btn btn-primary" onClick={() => navigate('/medicines/add')}>
            <FiPlus /> Add Medicine
          </button>
        )}
      />
    </div>
  );
};

export default Medicines;
