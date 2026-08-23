import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MedicineForm from '../../components/forms/MedicineForm';
import { itemsApi } from '../../services/api';
import '../../styles/medicines/medicines.css';

const AddMedicine = () => {
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    try {
      // Map MedicineForm fields → ItemDTO fields expected by Spring Boot
      const payload = {
        name: data.name,
        code: data.code,
        category: data.category,
        manufacturer: data.manufacturer,
        description: data.description || '',
        price: parseFloat(data.price) || 0,
        sellingPrice: parseFloat(data.price) || 0,
        quantity: parseInt(data.quantity, 10) || 0,
        expiryDate: data.expiryDate || null,
        status: data.status || 'Active',
      };
      await itemsApi.create(payload);
      alert('Medicine added successfully!');
      navigate('/medicines');
    } catch (error) {
      console.error('Failed to add medicine:', error);
      alert('Failed to add medicine: ' + error.message);
    }
  };

  const handleCancel = () => {
    navigate('/medicines');
  };

  return (
    <div className="medicines-page">
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <Link to="/medicines" className="hover:text-blue-600">Medicines</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800">Add Medicine</span>
        </nav>
        <h1 className="text-2xl font-semibold text-gray-800">Add New Medicine</h1>
        <p className="text-sm text-gray-500 mt-1">Enter details to add a new medicine to inventory</p>
      </div>
      
      <MedicineForm 
        onSubmit={handleSubmit} 
        onCancel={handleCancel} 
      />
    </div>
  );
};

export default AddMedicine;
