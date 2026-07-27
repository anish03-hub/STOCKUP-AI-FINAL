import React from 'react';
import PurchaseOrderForm from '../../components/purchase/PurchaseOrderForm';
import '../../styles/purchase/purchase.css';

const CreatePurchaseOrder = () => {
  return (
    <div className="purchase-page">
      <div className="purchase-header">
        <h1>Create Purchase Order</h1>
      </div>
      <PurchaseOrderForm />
    </div>
  );
};

export default CreatePurchaseOrder;
