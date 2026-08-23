import React, { useState, useMemo, useEffect } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import InventoryTable from '../../components/inventory/InventoryTable';
import '../../styles/inventory/inventory.css';
import { itemsApi } from '../../services/api';

const LowStock = () => {
  const [severityFilter, setSeverityFilter] = useState('all');
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

  const lowStockItems = useMemo(() => {
    return mockMedicines.filter(m => m.available < m.minStock);
  }, [mockMedicines]);

  const getFilteredItems = () => {
    if (severityFilter === 'critical') {
      return lowStockItems.filter(m => m.available < m.minStock * 0.3);
    }
    if (severityFilter === 'warning') {
      return lowStockItems.filter(m => m.available >= m.minStock * 0.3);
    }
    return lowStockItems;
  };

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <h1>Low Stock Alerts</h1>
      </div>

      <div className="expiry-warning-banner critical">
        <div className="icon"><FiAlertCircle /></div>
        <div>
          <h4>Action Required</h4>
          <p>Please review and create purchase orders for these critical items to prevent stockouts.</p>
        </div>
      </div>

      <div className="filter-tabs">
        <button 
          className={severityFilter === 'all' ? 'active' : ''} 
          onClick={() => setSeverityFilter('all')}
        >
          All Low Stock ({lowStockItems.length})
        </button>
        <button 
          className={severityFilter === 'critical' ? 'active' : ''} 
          onClick={() => setSeverityFilter('critical')}
        >
          Critical
        </button>
        <button 
          className={severityFilter === 'warning' ? 'active' : ''} 
          onClick={() => setSeverityFilter('warning')}
        >
          Warning
        </button>
      </div>

      <InventoryTable data={getFilteredItems()} />
    </div>
  );
};

export default LowStock;
