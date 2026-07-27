import React from 'react';
import { FiClock } from 'react-icons/fi';
import ExpiryTable from '../../components/inventory/ExpiryTable';
import '../../styles/inventory/inventory.css';
import { nearExpiryData } from '../../data/mockData';

const NearExpiry = () => {
  const mockNearExpiry = nearExpiryData || [
    { id: 1, name: 'Amoxicillin 500mg', batch: 'B-4492', manufacturedDate: '2023-01-10', expiryDate: '2024-08-01', daysLeft: 5, quantity: 50, unit: 'tabs', storage: 'Room Temp' },
    { id: 2, name: 'Ciprofloxacin 500mg', batch: 'B-8831', manufacturedDate: '2022-11-20', expiryDate: '2024-08-15', daysLeft: 19, quantity: 200, unit: 'tabs', storage: 'Room Temp' }
  ];

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <h1>Near Expiry Tracking</h1>
      </div>

      <div className="expiry-warning-banner warning">
        <div className="icon"><FiClock /></div>
        <div>
          <h4>Upcoming Expiries</h4>
          <p>The following items are expiring within the next 60 days. Prioritize dispensing these items or return to supplier if applicable.</p>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--text-dark)' }}>Expiring This Week</h3>
        <ExpiryTable data={mockNearExpiry.filter(item => item.daysLeft <= 7)} />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--text-dark)' }}>Expiring This Month</h3>
        <ExpiryTable data={mockNearExpiry.filter(item => item.daysLeft > 7 && item.daysLeft <= 30)} />
      </div>
      
      <div>
        <h3 style={{ color: 'var(--text-dark)' }}>Expiring Next Month</h3>
        <ExpiryTable data={mockNearExpiry.filter(item => item.daysLeft > 30 && item.daysLeft <= 60)} />
      </div>

    </div>
  );
};

export default NearExpiry;
