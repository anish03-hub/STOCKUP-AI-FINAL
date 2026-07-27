import React from 'react';
import MedicineRow from './MedicineRow';

const MedicineTable = ({ data }) => {
  return (
    <div className="table-container glass-panel">
      <table className="medicine-table">
        <thead>
          <tr>
            <th>Medicine Name</th>
            <th>Medicine Code</th>
            <th>Category</th>
            <th>Manufacturer</th>
            <th>Batch No.</th>
            <th>Current Stock</th>
            <th>Purchase Price</th>
            <th>Selling Price</th>
            <th>Expiry Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <MedicineRow key={idx} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MedicineTable;
