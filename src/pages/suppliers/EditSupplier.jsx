import React from 'react';
import { useParams } from 'react-router-dom';
import SupplierForm from '../../components/suppliers/SupplierForm';
import '../../styles/suppliers/suppliers.css';

const EditSupplier = () => {
  const { id } = useParams();
  
  // Mock fetching supplier data
  const mockSupplier = {
    id: id,
    name: 'MedLife Distributors',
    contactPerson: 'Alice Smith',
    phone: '+1 234-567-8901',
    email: 'orders@medlife.com',
    address: '123 Health Ave',
    city: 'New York',
    state: 'NY',
    pin: '10001',
    status: 'Active',
    paymentTerms: 'Net 30',
    rating: 4.5,
    suppliedMedicines: ['Paracetamol', 'Aspirin', 'Ibuprofen']
  };

  return (
    <div className="suppliers-page">
      <div className="suppliers-header">
        <h1>Edit Supplier: {mockSupplier.name}</h1>
      </div>
      <SupplierForm initialData={mockSupplier} isEdit={true} />
    </div>
  );
};

export default EditSupplier;
