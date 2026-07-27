import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import MedicineForm from '../../components/forms/MedicineForm';
import { medicines } from '../../data/mockData';
import '../../styles/medicines/medicines.css';

const EditMedicine = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const fetchMedicine = () => {
      const foundMedicine = medicines.find(m => m.id === id);
      if (foundMedicine) {
        setMedicine(foundMedicine);
      }
      setLoading(false);
    };
    
    fetchMedicine();
  }, [id]);

  const handleSubmit = (data) => {
    // In a real app, this would be an API call
    console.log('Updating medicine:', id, data);
    alert('Medicine updated successfully!');
    navigate('/medicines');
  };

  const handleCancel = () => {
    navigate('/medicines');
  };

  if (loading) return <div className="p-8">Loading...</div>;
  
  if (!medicine) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Medicine not found</h2>
        <Link to="/medicines" className="btn-primary">Back to Medicines</Link>
      </div>
    );
  }

  return (
    <div className="medicines-page">
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <Link to="/medicines" className="hover:text-blue-600">Medicines</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800">Edit Medicine</span>
        </nav>
        <h1 className="text-2xl font-semibold text-gray-800">Edit Medicine</h1>
        <p className="text-sm text-gray-500 mt-1">Update details for {medicine.name}</p>
      </div>
      
      <MedicineForm 
        initialData={medicine}
        onSubmit={handleSubmit} 
        onCancel={handleCancel} 
      />
    </div>
  );
};

export default EditMedicine;
