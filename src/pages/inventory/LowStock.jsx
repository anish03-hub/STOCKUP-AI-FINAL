import React, { useState } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import InventoryTable from '../../components/inventory/InventoryTable';
import '../../styles/inventory/inventory.css';
import { medicines } from '../../data/mockData';

const LowStock = () => {
  const [severityFilter, setSeverityFilter] = useState('all');
  
  const mockMedicines = medicines || [
    { id: 2, name: 'Amoxicillin 250mg', code: 'MED-002', category: 'Antibiotic', available: 200, reserved: 50, minStock: 400, maxStock: 2000, unit: 'caps', value: 45.00, location: 'B-2-1' }
  ];

  const lowStockItems = mockMedicines.filter(m => m.available < m.minStock);

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
