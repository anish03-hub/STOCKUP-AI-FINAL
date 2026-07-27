import React from 'react';
import '../../styles/dashboard/dashboard.css';

const expiryData = [
  { id: 1, name: 'Insulin Glargine', batch: 'INS-092', expiry: '2026-07-28', qty: 50, days: 4 },
  { id: 2, name: 'Ceftriaxone 1g', batch: 'CEF-112', expiry: '2026-07-30', qty: 200, days: 6 },
  { id: 3, name: 'Diazepam 5mg', batch: 'DIA-441', expiry: '2026-08-05', qty: 120, days: 12 },
  { id: 4, name: 'Salbutamol Inhaler', batch: 'SAL-009', expiry: '2026-08-10', qty: 45, days: 17 },
  { id: 5, name: 'Heparin Sodium', batch: 'HEP-332', expiry: '2026-08-15', qty: 80, days: 22 },
  { id: 6, name: 'Morphine Sulfate', batch: 'MOR-101', expiry: '2026-08-25', qty: 30, days: 32 },
  { id: 7, name: 'Epinephrine Auto-injector', batch: 'EPI-998', expiry: '2026-09-01', qty: 15, days: 39 },
  { id: 8, name: 'Naloxone HCl', batch: 'NAL-456', expiry: '2026-09-10', qty: 25, days: 48 },
];

const getDaysBadge = (days) => {
  if (days < 7) return 'badge badge-red';
  if (days <= 30) return 'badge badge-orange';
  return 'badge badge-yellow';
};

const ExpiryAlertTable = () => {
  return (
    <div className="table-card">
      <h3>Upcoming Expiries</h3>
      <table>
        <thead>
          <tr>
            <th>Medicine Name</th>
            <th>Batch No.</th>
            <th>Expiry Date</th>
            <th>Quantity</th>
            <th>Days Left</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {expiryData.map(item => (
            <tr key={item.id}>
              <td><strong>{item.name}</strong></td>
              <td>{item.batch}</td>
              <td>{item.expiry}</td>
              <td>{item.qty}</td>
              <td><span className={getDaysBadge(item.days)}>{item.days} days</span></td>
              <td><button className="btn-action">Review</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExpiryAlertTable;
