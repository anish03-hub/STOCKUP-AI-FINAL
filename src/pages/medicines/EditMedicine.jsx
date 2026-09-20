import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import MedicineForm from '../../components/forms/MedicineForm';
import { itemApi, itemsApi } from '../../services/api';
import '../../styles/medicines/medicines.css';

const EditMedicine = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setLoading(true);
        setError(null);
        const api = itemApi || itemsApi;
        const foundMedicine = await api.getById(id);
        if (foundMedicine) {
          setMedicine(foundMedicine);
        }
      } catch (err) {
        console.error('Failed to load medicine for editing:', err);
        setError(err.message || 'Medicine not found in database.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchMedicine();
    }
  }, [id]);

  const handleSubmit = async (data) => {
    try {
      const api = itemApi || itemsApi;
      const targetId = medicine.id || id;
      await api.update(targetId, data);
      alert('Medicine updated successfully!');
      navigate('/medicines');
    } catch (err) {
      console.error('Update failed:', err);
      alert(err.message || 'Failed to update medicine record.');
    }
  };

  const handleCancel = () => {
    navigate('/medicines');
  };

  if (loading) return <div className="p-8 text-center" style={{ padding: '60px 20px', color: 'var(--text-secondary)' }}>Loading medicine data...</div>;
  
  if (error || !medicine) {
    return (
      <div className="p-8 text-center" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2 className="text-xl font-semibold mb-4" style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '12px' }}>Medicine not found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error || 'Unable to find this medicine record in PostgreSQL.'}</p>
        <Link to="/medicines" className="btn-primary" style={{ display: 'inline-flex', padding: '10px 20px' }}>Back to Medicines</Link>
      </div>
    );
  }

  return (
    <div className="medicines-page">
      <div className="mb-6" style={{ marginBottom: '24px' }}>
        <nav className="text-sm mb-2" style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          <Link to="/medicines" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Medicines</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--text-primary)' }}>Edit Medicine</span>
        </nav>
        <h1 className="text-2xl font-semibold" style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Edit Medicine</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Update details for {medicine.name}</p>
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
