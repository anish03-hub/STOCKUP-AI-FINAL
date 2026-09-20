import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SupplierForm from '../../components/suppliers/SupplierForm';
import { supplierApi } from '../../services/api';
import '../../styles/suppliers/suppliers.css';

const EditSupplier = () => {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchSupplier = async () => {
      try {
        setLoading(true);
        const data = await supplierApi.getById(id);
        if (active) setSupplier(data);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load distributor details');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchSupplier();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="suppliers-page">
        <div className="loading-state">Loading distributor…</div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="suppliers-page">
        <div className="alert alert-error">{error || 'Distributor not found'}</div>
      </div>
    );
  }

  return (
    <div className="suppliers-page">
      <div className="suppliers-header">
        <h1>Edit Distributor: {supplier.name}</h1>
      </div>
      <SupplierForm initialData={supplier} isEdit={true} />
    </div>
  );
};

export default EditSupplier;
