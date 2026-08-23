import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';
import { medicines, inventoryHistory, forecastData, suppliers } from '../../data/mockData';
import '../../styles/medicines/medicines.css';

const MedicineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [history, setHistory] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [supplierInfo, setSupplierInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const med = medicines.find(m => m.id === id);
    if (med) {
      setMedicine(med);
      setHistory(inventoryHistory.filter(h => h.medicine === med.name));
      setForecast(forecastData.find(f => f.medicineId === med.id));
      setSupplierInfo(suppliers.find(s => s.id === med.supplier));
    }
    setLoading(false);
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;

  if (!medicine) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Medicine not found</h2>
        <Link to="/medicines" className="btn-primary">Back to Medicines</Link>
      </div>
    );
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Inactive': return 'status-inactive';
      case 'Expired': return 'status-expired';
      default: return '';
    }
  };

  const isLowStock = medicine.quantity <= medicine.minStock;

  return (
    <div className="medicines-page">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <nav className="text-sm text-gray-500 mb-2">
            <Link to="/medicines" className="hover:text-blue-600">Medicines</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-800">{medicine.name}</span>
          </nav>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/medicines')} className="btn-secondary">
            <FiArrowLeft /> Back
          </button>
          <Link to={`/medicines/edit/${medicine.id}`} className="btn-primary">
            <FiEdit2 /> Edit Details
          </Link>
        </div>
      </div>

      <div className="medicine-detail-card">
        <div className="detail-header">
          <div className="detail-header-info">
            <div className="detail-avatar">
              {medicine.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="detail-title">
                <h1>{medicine.name}</h1>
                <div className="detail-badges">
                  <span className="medicine-code-badge">{medicine.code}</span>
                  <span className={`status-badge ${getStatusClass(medicine.status)}`}>
                    {medicine.status}
                  </span>
                  {isLowStock && (
                    <span className="status-badge status-expired flex items-center gap-1">
                      <FiAlertCircle /> Low Stock
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-content">
          <div className="detail-section-title">General Information</div>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Category</span>
              <span className="detail-value">{medicine.category}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Manufacturer</span>
              <span className="detail-value">{medicine.manufacturer}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Batch Number</span>
              <span className="detail-value">{medicine.batchNumber}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Price</span>
              <span className="detail-value">₹{medicine.price.toFixed(2)}</span>
            </div>
          </div>

          <div className="detail-section-title mt-8">Inventory Status</div>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Current Stock</span>
              <span className={`detail-value text-xl ${isLowStock ? 'text-red-600 font-bold' : ''}`}>
                {medicine.quantity} units
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Minimum Stock Level</span>
              <span className="detail-value">{medicine.minStock} units</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Storage Location</span>
              <span className="detail-value">{medicine.storageLocation || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Supplier</span>
              <span className="detail-value text-blue-600">
                {supplierInfo ? supplierInfo.name : medicine.supplier}
              </span>
            </div>
          </div>

          <div className="detail-section-title mt-8">Dates</div>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Manufacturing Date</span>
              <span className="detail-value">{new Date(medicine.manufacturingDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Expiry Date</span>
              <span className="detail-value">{new Date(medicine.expiryDate).toLocaleDateString()}</span>
            </div>
          </div>

          {forecast && (
            <>
              <div className="detail-section-title mt-8 text-blue-700">
                <FiTrendingUp className="mr-2" /> AI Demand Forecast
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="detail-grid mb-0">
                  <div className="detail-item">
                    <span className="detail-label text-blue-800">Predicted Demand (Next 30 days)</span>
                    <span className="detail-value text-lg text-blue-900">{forecast.predictedDemand} units</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label text-blue-800">Confidence Score</span>
                    <span className="detail-value text-blue-900">{forecast.confidenceScore}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label text-blue-800">Trend</span>
                    <span className="detail-value text-blue-900">{forecast.nextMonthTrend}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-200">
                  <span className="detail-label text-blue-800 block mb-1">Recommended Action:</span>
                  <span className="text-blue-900 font-medium">{forecast.recommendedAction}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="medicine-detail-card mt-6">
        <div className="detail-header p-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Inventory History</h3>
        </div>
        <div className="table-responsive">
          <table className="medicine-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Quantity Change</th>
                <th>User</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((record) => (
                  <tr key={record.id}>
                    <td>{new Date(record.date).toLocaleString()}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        record.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {record.action}
                      </span>
                    </td>
                    <td className={record.quantity > 0 ? 'text-green-600 font-medium' : 'text-gray-800'}>
                      {record.quantity > 0 ? `+${record.quantity}` : record.quantity}
                    </td>
                    <td>{record.user}</td>
                    <td className="text-gray-500">{record.notes}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-gray-500">
                    No recent history available for this medicine.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MedicineDetails;
