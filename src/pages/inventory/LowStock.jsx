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
        setDbMedicines(data || []);
      } catch (err) {
        console.error("Failed to load inventory data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInventory();
  }, []);
  
  // Safe default in case medicines is not defined, mapped to required UI properties
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
        location: m.location || m.storageLocation || 'Main Warehouse'
      };
    });
  }, [dbMedicines]);

  const lowStockItems = useMemo(() => {
    return medicines.filter(m => m.available <= m.minStock);
  }, [medicines]);

  const criticalItems = useMemo(() => {
    return lowStockItems.filter(m => m.available <= m.minStock * 0.3);
  }, [lowStockItems]);

  const warningItems = useMemo(() => {
    return lowStockItems.filter(m => m.available > m.minStock * 0.3);
  }, [lowStockItems]);

  const getFilteredItems = () => {
    if (severityFilter === 'critical') {
      return criticalItems;
    }
    if (severityFilter === 'warning') {
      return warningItems;
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
          <p>Found <strong>{lowStockItems.length}</strong> items below or at minimum safety stock threshold (50 units). Please review and create purchase orders to prevent stockouts.</p>
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
          Critical ({criticalItems.length})
        </button>
        <button 
          className={severityFilter === 'warning' ? 'active' : ''} 
          onClick={() => setSeverityFilter('warning')}
        >
          Warning ({warningItems.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading low stock medicines...</div>
      ) : (
        <InventoryTable data={getFilteredItems()} />
      )}
    </div>
  );
};

export default LowStock;

