import React from 'react';
import SupplierForm from '../../components/suppliers/SupplierForm';
import '../../styles/suppliers/suppliers.css';

const AddSupplier = () => {
  return (
    <div className="suppliers-page">
      <div className="suppliers-header">
        <h1>Add New Supplier</h1>
      </div>
      <SupplierForm isEdit={false} />
    </div>
  );
};

export default AddSupplier;
