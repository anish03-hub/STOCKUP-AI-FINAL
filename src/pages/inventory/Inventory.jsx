import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBox, FiCheckCircle, FiClock, FiDollarSign, FiEdit2, FiShoppingCart, FiSearch, FiFilter } from 'react-icons/fi';
import LowStockAlert from '../../components/inventory/LowStockAlert';
import DataTable from '../../components/common/DataTable';
import '../../styles/inventory/inventory.css';
import { itemsApi } from '../../services/api';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dbMedicines, setDbMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const data = await itemsApi.getAll();
        setDbMedicines(data);
      } catch (err) {
        console.error("Failed to load inventory data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInventory();
  }, []);
  
  // Safe default in case medicines is not defined, mapped to required UI properties
  const mockMedicines = useMemo(() => {
    const raw = dbMedicines || [];
    return raw.map(m => ({
      ...m,
      available: m.available !== undefined ? m.available : (m.quantity || 0),
      reserved: m.reserved !== undefined ? m.reserved : Math.floor((m.quantity || 0) * 0.05),
      value: m.value !== undefined ? m.value : ((m.price || m.purchasePrice || 0) * (m.quantity || 0)),
      unit: m.unit || 'units',
      minStock: m.minStock || 0,
      location: m.location || m.storageLocation || 'N/A'
    }));
  }, [dbMedicines]);

  const lowStockItems = mockMedicines.filter(m => m.available < m.minStock);

  const columns = useMemo(() => [
    { key: 'name', title: 'Medicine', accessor: 'name', sortable: true },
    { key: 'code', title: 'Code', accessor: 'code', sortable: true },
    { key: 'category', title: 'Category', accessor: 'category', sortable: true },
    { key: 'available', title: 'Available', accessor: 'available', sortable: true, render: (row) => <strong>{row.available} {row.unit}</strong> },
    { key: 'reserved', title: 'Reserved', accessor: 'reserved', sortable: true },
    { key: 'minStock', title: 'Min Stock', accessor: 'minStock', sortable: true },
    { key: 'value', title: 'Value', accessor: 'value', type: 'currency', sortable: true },
    { key: 'location', title: 'Location', accessor: 'location', sortable: true },
    { key: 'status', title: 'Status', accessor: 'status', type: 'status', sortable: true, render: (row) => (row.available < row.minStock ? 'Low Stock' : 'Healthy') },
    { key: 'actions', title: 'Actions', type: 'actions' },
  ], []);

  const filteredData = mockMedicines.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <h1>Inventory Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/inventory/low-stock">
            <button className="action-btn warning">Low Stock</button>
          </Link>
          <Link to="/inventory/near-expiry">
            <button className="action-btn">Near Expiry</button>
          </Link>
          <Link to="/inventory/history">
            <button className="action-btn">Stock History</button>
          </Link>
        </div>
      </div>

      <LowStockAlert items={lowStockItems} />

      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-icon primary"><FiBox /></div>
          <div className="stat-content">
            <h3>Total Items</h3>
            <p>{mockMedicines.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><FiCheckCircle /></div>
          <div className="stat-content">
            <h3>Available Stock Units</h3>
            <p>{mockMedicines.reduce((acc, curr) => acc + curr.available, 0)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><FiClock /></div>
          <div className="stat-content">
            <h3>Reserved Stock Units</h3>
            <p>{mockMedicines.reduce((acc, curr) => acc + curr.reserved, 0)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><FiDollarSign /></div>
          <div className="stat-content">
            <h3>Total Value</h3>
            <p>₹{mockMedicines.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="inventory-filter-bar">
        <div style={{ position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: '10px', top: '10px', color: '#999' }} />
          <input 
            type="text" 
            placeholder="Search medicines, code..." 
            style={{ paddingLeft: '32px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select>
          <option value="all">All Categories</option>
          <option value="analgesic">Analgesic</option>
          <option value="antibiotic">Antibiotic</option>
        </select>
        <button className="action-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
          <FiFilter /> Filter
        </button>
      </div>

      <DataTable
        data={filteredData}
        columns={columns}
        title="Inventory Ledger"
        subtitle="Track stock levels, thresholds, and replenishment"        
        searchPlaceholder="Search medicine or code"
        searchable
        filters={[
          { key: 'category', label: 'Category', defaultValue: 'all', options: [{ value: 'all', label: 'All Categories' }, { value: 'Analgesic', label: 'Analgesic' }, { value: 'Antibiotic', label: 'Antibiotic' }] }
        ]}
        pageSize={6}
        actions={[
          { label: 'Edit', icon: <FiEdit2 />, onClick: () => {} },
          { label: 'Reorder', icon: <FiShoppingCart />, onClick: () => {} },
        ]}
        statusMap={{ healthy: 'success', 'low stock': 'warning' }}
      />
    </div>
  );
};

export default Inventory;
