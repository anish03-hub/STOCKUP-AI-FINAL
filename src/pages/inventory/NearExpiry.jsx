import React, { useState, useEffect, useMemo } from 'react';
import { FiClock } from 'react-icons/fi';
import ExpiryTable from '../../components/inventory/ExpiryTable';
import '../../styles/inventory/inventory.css';
import { itemsApi } from '../../services/api';

const NearExpiry = () => {
  const [dbMedicines, setDbMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await itemsApi.getAll();
        setDbMedicines(data || []);
      } catch (err) {
        console.error("Failed to load near expiry items:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const nearExpiryItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (dbMedicines || []).map(m => {
      let daysLeft = 999;
      if (m.expiryDate) {
        const exp = new Date(m.expiryDate);
        daysLeft = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
      }
      return {
        id: m.id,
        name: m.name,
        batch: m.batchNumber || m.batch || 'BAT-' + (m.id ? m.id.toString().slice(-4) : '001'),
        manufacturedDate: m.manufactureDate || m.createdAt ? String(m.manufactureDate || m.createdAt).split('T')[0] : '2024-01-01',
        expiryDate: m.expiryDate ? String(m.expiryDate).split('T')[0] : 'N/A',
        daysLeft: daysLeft,
        quantity: m.quantity ?? 0,
        unit: m.unit || 'units',
        storage: m.storageLocation || m.storageCondition || 'Room Temp (15-25°C)'
      };
    }).filter(m => m.daysLeft > 0 && m.daysLeft <= 90);
  }, [dbMedicines]);

  const thisWeek = useMemo(() => nearExpiryItems.filter(i => i.daysLeft <= 7), [nearExpiryItems]);
  const thisMonth = useMemo(() => nearExpiryItems.filter(i => i.daysLeft > 7 && i.daysLeft <= 30), [nearExpiryItems]);
  const nextMonth = useMemo(() => nearExpiryItems.filter(i => i.daysLeft > 30 && i.daysLeft <= 90), [nearExpiryItems]);

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <h1>Near Expiry Tracking</h1>
      </div>

      <div className="expiry-warning-banner warning">
        <div className="icon"><FiClock /></div>
        <div>
          <h4>Upcoming Expiries ({nearExpiryItems.length} items within 90 days)</h4>
          <p>The following items are approaching expiration. Prioritize dispensing these items or initiate supplier returns/discounts to prevent inventory spoilage.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary, #666)' }}>Loading near-expiry batches...</div>
      ) : (
        <>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: 'var(--text-primary)' }}>Expiring This Week ({thisWeek.length})</h3>
            <ExpiryTable data={thisWeek} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: 'var(--text-primary)' }}>Expiring This Month ({thisMonth.length})</h3>
            <ExpiryTable data={thisMonth} />
          </div>
          
          <div>
            <h3 style={{ color: 'var(--text-primary)' }}>Expiring in 31–90 Days ({nextMonth.length})</h3>
            <ExpiryTable data={nextMonth} />
          </div>
        </>
      )}

    </div>
  );
};

export default NearExpiry;

