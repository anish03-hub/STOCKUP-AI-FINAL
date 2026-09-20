import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiBox, 
  FiCheckCircle, 
  FiClock, 
  FiDollarSign, 
  FiEdit2, 
  FiShoppingCart, 
  FiSearch, 
  FiPackage, 
  FiAlertTriangle, 
  FiLayers 
} from 'react-icons/fi';
import LowStockAlert from '../../components/inventory/LowStockAlert';
import DataTable from '../../components/common/DataTable';
import '../../styles/inventory/inventory.css';
import { itemsApi } from '../../services/api';
import { useCurrency } from '../../context/useCurrency';

const Inventory = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dbMedicines, setDbMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const data = await itemsApi.getAll();
        setDbMedicines(data || []);
      } catch (err) {
        console.error("Failed to load inventory data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInventory();
  }, []);
  
  // Safe default mapped to required UI properties
  const medicines = useMemo(() => {
    const raw = dbMedicines || [];
    return raw.map(m => {
      const qty = m.quantity ?? m.available ?? 0;
      const minStock = (m.minStock && m.minStock > 0) ? m.minStock : 50;
      const price = m.price || m.purchasePrice || 0;
      return {
        ...m,
        available: qty,
        reserved: m.reserved !== undefined ? m.reserved : Math.floor(qty * 0.05),
        value: m.value !== undefined ? m.value : (price * qty),
        unit: m.unit || 'units',
        minStock: minStock,
        location: m.location || m.storageLocation || 'Main Warehouse',
        category: m.category || 'General'
      };
    });
  }, [dbMedicines]);

  const lowStockItems = useMemo(() => {
    return medicines.filter(m => m.available <= m.minStock);
  }, [medicines]);

  const categories = useMemo(() => {
    const set = new Set(medicines.map(m => m.category).filter(Boolean));
    return Array.from(set).sort();
  }, [medicines]);

  const columns = useMemo(() => [
    { key: 'name', title: 'Medicine', accessor: 'name', sortable: true },
    { key: 'code', title: 'Code', accessor: 'code', sortable: true },
    { key: 'category', title: 'Category', accessor: 'category', sortable: true },
    { key: 'available', title: 'Available', accessor: 'available', sortable: true, render: (_val, row) => <strong>{row.available} {row.unit}</strong> },
    { key: 'reserved', title: 'Reserved', accessor: 'reserved', sortable: true },
    { key: 'minStock', title: 'Min Stock', accessor: 'minStock', sortable: true },
    { key: 'value', title: 'Value', accessor: 'value', type: 'currency', sortable: true },
    { key: 'location', title: 'Location', accessor: 'location', sortable: true },
    { key: 'status', title: 'Status', accessor: 'status', type: 'status', sortable: true, render: (_val, row) => (row.available <= row.minStock ? 'Low Stock' : 'Healthy') },
    { key: 'actions', title: 'Actions', type: 'actions' },
  ], []);

  const filteredData = useMemo(() => {
    return medicines.filter(m => {
      const matchesSearch = 
        (m.name && m.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.code && m.code.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [medicines, searchTerm, selectedCategory]);

  return (
    <div className="inventory-page">
      <div className="inventory-dashboard-header">
        <div className="inventory-header-title">
          <h1>Inventory Dashboard</h1>
        </div>
        <div className="inventory-dashboard-actions">
          <Link to="/inventory/low-stock" className="inventory-dashboard-action warning">
            <FiAlertTriangle className="action-icon" />
            <span>Low Stock ({lowStockItems.length})</span>
          </Link>
          <Link to="/inventory/near-expiry" className="inventory-dashboard-action alert">
            <FiClock className="action-icon" />
            <span>Near Expiry</span>
          </Link>
          <Link to="/inventory/history" className="inventory-dashboard-action neutral">
            <FiLayers className="action-icon" />
            <span>Stock History</span>
          </Link>
        </div>
      </div>

      <LowStockAlert items={lowStockItems} />

      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-icon primary"><FiBox /></div>
          <div className="stat-content">
            <h3>Total Items</h3>
            <p>{medicines.length.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><FiCheckCircle /></div>
          <div className="stat-content">
            <h3>Available Stock Units</h3>
            <p>{medicines.reduce((acc, curr) => acc + curr.available, 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><FiClock /></div>
          <div className="stat-content">
            <h3>Low Stock Items</h3>
            <p>{lowStockItems.length.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><FiDollarSign /></div>
          <div className="stat-content">
            <h3>Total Valuation</h3>
            <p>{formatCurrency(medicines.reduce((acc, curr) => acc + curr.value, 0))}</p>
          </div>
        </div>
      </div>

      <div className="inventory-filter-bar">
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted, #999)' }} />
          <input 
            type="text" 
            placeholder="Search medicines, code..." 
            style={{ paddingLeft: '32px', width: '100%', background: 'var(--input-bg, #ffffff)', color: 'var(--text-primary, #0f172a)', border: '1px solid var(--input-border, #cbd5e1)' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--input-border, #ddd)', background: 'var(--input-bg, #ffffff)', color: 'var(--text-primary, #0f172a)' }}
        >
          <option value="all">All Categories ({categories.length})</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary, #666)' }}>Loading inventory...</div>
      ) : (
        <DataTable
          data={filteredData}
          columns={columns}
          title="Inventory Ledger"
          subtitle={`Showing ${filteredData.length} of ${medicines.length} total medicines in live inventory`}        
          searchPlaceholder="Search medicine or code"
          searchable={false}
          pageSize={10}
          actions={[
            { label: 'Sell', icon: <FiShoppingCart />, onClick: (row) => navigate(`/billing?medicine=${encodeURIComponent(row.name)}`) },
            { label: 'Reorder', icon: <FiPackage />, onClick: (row) => navigate(`/reorder?medicine=${encodeURIComponent(row.name)}`) },
            { label: 'Edit', icon: <FiEdit2 />, onClick: (row) => navigate(`/medicines/${row.id || row.code}/edit`) },
          ]}
          statusMap={{ healthy: 'success', 'low stock': 'warning' }}
        />
      )}
    </div>
  );
};

export default Inventory;

