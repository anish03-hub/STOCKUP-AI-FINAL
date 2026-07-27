import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import DataTable from '../../components/common/DataTable';
import '../../styles/suppliers/suppliers.css';

// Mock Data inline for standalone demo purposes
const mockSuppliers = [
  { id: 'SUP-001', name: 'MedLife Distributors', contactPerson: 'Alice Smith', phone: '+1 234-567-8901', email: 'orders@medlife.com', address: '123 Health Ave', city: 'New York', state: 'NY', status: 'Active', rating: 4.5, totalOrders: 156, suppliedMedicines: ['Paracetamol', 'Aspirin', 'Ibuprofen'] },
  { id: 'SUP-002', name: 'PharmaCorp Global', contactPerson: 'Bob Johnson', phone: '+1 345-678-9012', email: 'sales@pharmacorp.com', address: '456 Wellness Blvd', city: 'Chicago', state: 'IL', status: 'Active', rating: 4.8, totalOrders: 342, suppliedMedicines: ['Amoxicillin', 'Azithromycin'] },
  { id: 'SUP-003', name: 'CarePlus Medicals', contactPerson: 'Charlie Davis', phone: '+1 456-789-0123', email: 'info@careplus.net', address: '789 Care Lane', city: 'Boston', state: 'MA', status: 'Inactive', rating: 3.2, totalOrders: 45, suppliedMedicines: ['Vitamin C', 'Zinc'] },
  { id: 'SUP-004', name: 'HealthFirst Supplies', contactPerson: 'Diana Prince', phone: '+1 567-890-1234', email: 'diana@healthfirst.com', address: '101 First St', city: 'Seattle', state: 'WA', status: 'Active', rating: 4.0, totalOrders: 89, suppliedMedicines: ['Metformin', 'Lisinopril'] },
  { id: 'SUP-005', name: 'BioGen Therapeutics', contactPerson: 'Evan Wright', phone: '+1 678-901-2345', email: 'contact@biogen.com', address: '202 Bio Way', city: 'San Diego', state: 'CA', status: 'Active', rating: 4.9, totalOrders: 210, suppliedMedicines: ['Insulin', 'Glipizide'] },
  { id: 'SUP-006', name: 'MediQuick Logistics', contactPerson: 'Fiona Gallagher', phone: '+1 789-012-3456', email: 'support@mediquick.com', address: '303 Quick Rd', city: 'Austin', state: 'TX', status: 'Active', rating: 3.8, totalOrders: 120, suppliedMedicines: ['Omeprazole', 'Pantoprazole'] },
  { id: 'SUP-007', name: 'Zenith Pharmaceuticals', contactPerson: 'George Miller', phone: '+1 890-123-4567', email: 'sales@zenithpharma.com', address: '404 Zenith Pkwy', city: 'Denver', state: 'CO', status: 'Active', rating: 4.2, totalOrders: 175, suppliedMedicines: ['Atorvastatin', 'Simvastatin'] },
  { id: 'SUP-008', name: 'Apex Medical Supplies', contactPerson: 'Hannah Lee', phone: '+1 901-234-5678', email: 'orders@apexmedical.com', address: '505 Apex Cir', city: 'Miami', state: 'FL', status: 'Inactive', rating: 2.5, totalOrders: 12, suppliedMedicines: ['Levothyroxine'] },
];

const SupplierList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredSuppliers = mockSuppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          supplier.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = useMemo(() => [
    { key: 'id', title: 'Supplier ID', accessor: 'id', sortable: true },
    { key: 'name', title: 'Supplier', accessor: 'name', sortable: true },
    { key: 'contactPerson', title: 'Contact', accessor: 'contactPerson', sortable: true, render: (row) => <div><div>{row.contactPerson}</div><div className="text-muted">{row.email}</div></div> },
    { key: 'city', title: 'Region', accessor: 'city', sortable: true, render: (row) => `${row.city}, ${row.state}` },
    { key: 'status', title: 'Status', accessor: 'status', type: 'status', sortable: true },
    { key: 'totalOrders', title: 'Orders', accessor: 'totalOrders', sortable: true },
    { key: 'actions', title: 'Actions', type: 'actions' },
  ], []);

  return (
    <div className="suppliers-page">
      <div className="suppliers-header">
        <h1>Supplier Management</h1>
        <div className="suppliers-controls">
          <Link to="/suppliers/add" className="btn-primary">
            <FiPlus /> Add Supplier
          </Link>
        </div>
      </div>

      <DataTable
        data={filteredSuppliers}
        columns={columns}
        title="Supplier Network"
        subtitle="Track supplier performance, compliance, and order activity"
        searchPlaceholder="Search suppliers"
        searchable
        filters={[
          { key: 'status', label: 'Status', defaultValue: 'All', options: [{ value: 'All', label: 'All Status' }, { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }] }
        ]}
        pageSize={6}
        actions={[
          { label: 'View', icon: <FiEye />, onClick: (row) => window.location.href = `/suppliers/${row.id}` },
          { label: 'Edit', icon: <FiEdit2 />, onClick: () => {} },
          { label: 'Archive', icon: <FiTrash2 />, onClick: () => {} },
        ]}
        statusMap={{ active: 'success', inactive: 'warning' }}
      />
    </div>
  );
};

export default SupplierList;
