import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MedicineForm from '../../components/forms/MedicineForm';
import '../../styles/medicines/medicines.css';

const AddMedicine = () => {
  const navigate = useNavigate();

  const handleSubmit = (data) => {
    // In a real app, this would be an API call
    console.log('Submitting new medicine:', data);
    alert('Medicine added successfully!');
    navigate('/medicines');
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
