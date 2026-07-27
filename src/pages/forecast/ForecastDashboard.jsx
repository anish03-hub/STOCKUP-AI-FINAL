import React, { useMemo, useState } from 'react';
import PredictionCard from '../../components/forecast/PredictionCard';
import ForecastChart from '../../components/forecast/ForecastChart';
import DataTable from '../../components/common/DataTable';
import { FiDownload, FiBox, FiCalendar, FiTrendingUp, FiEye, FiEdit2 } from 'react-icons/fi';
import '../../styles/forecast/forecast.css';

const ForecastDashboard = () => {
  const [selectedMedicine, setSelectedMedicine] = useState('Paracetamol 500mg');

  const forecastRows = useMemo(() => [
    { id: 'F-101', name: 'Paracetamol 500mg', period: '7 Days', demand: '1,250 units', status: 'Healthy', confidence: '94%' },
    { id: 'F-102', name: 'Amoxicillin 250mg', period: '14 Days', demand: '430 units', status: 'Watch', confidence: '88%' },
    { id: 'F-103', name: 'Ibuprofen 400mg', period: '30 Days', demand: '760 units', status: 'Healthy', confidence: '91%' },
  ], []);

  const columns = useMemo(() => [
    { key: 'id', title: 'Forecast ID', accessor: 'id', sortable: true },
    { key: 'name', title: 'Medicine', accessor: 'name', sortable: true },
    { key: 'period', title: 'Period', accessor: 'period', sortable: true },
    { key: 'demand', title: 'Demand', accessor: 'demand', sortable: true },
    { key: 'status', title: 'Status', accessor: 'status', type: 'status', sortable: true },
    { key: 'confidence', title: 'Confidence', accessor: 'confidence', sortable: true },
    { key: 'actions', title: 'Actions', type: 'actions' },
  ], []);

  return (
    <div className="forecast-page">
      <div className="forecast-header">
        <h1>Demand Forecasting</h1>
        <button className="btn-export">
          <FiDownload /> Export Report
        </button>
      </div>

      <div className="medicine-selector">
        <label htmlFor="medicine-select" style={{ fontWeight: 500, color: '#475569' }}>
          Select Item:
        </label>
        <select 
          id="medicine-select"
          value={selectedMedicine}
          onChange={(e) => setSelectedMedicine(e.target.value)}
        >
          <option value="Paracetamol 500mg">Paracetamol 500mg</option>
          <option value="Amoxicillin 250mg">Amoxicillin 250mg</option>
          <option value="Ibuprofen 400mg">Ibuprofen 400mg</option>
          <option value="Omeprazole 20mg">Omeprazole 20mg</option>
          <option value="Cetirizine 10mg">Cetirizine 10mg</option>
        </select>
      </div>

      <div className="metrics-row">
        <div className="forecast-metric">
          <div className="metric-icon blue">
            <FiTrendingUp />
          </div>
          <div className="metric-content">
            <span>Expected 7-Day Demand</span>
            <strong>1,250 Units</strong>
          </div>
        </div>
        <div className="forecast-metric">
          <div className="metric-icon purple">
            <FiBox />
          </div>
          <div className="metric-content">
            <span>Suggested Reorder Qty</span>
            <strong>500 Units</strong>
          </div>
        </div>
        <div className="forecast-metric">
          <div className="metric-icon green">
            <FiCalendar />
          </div>
          <div className="metric-content">
            <span>Optimal Reorder Date</span>
            <strong>Oct 12, 2023</strong>
          </div>
        </div>
      </div>

      <div className="forecast-grid">
        <PredictionCard medicineName={selectedMedicine} />
        <ForecastChart />
      </div>

      <DataTable
        data={forecastRows}
        columns={columns}
        title="Forecast History"
        subtitle="Review demand planning outcomes and confidence levels"
        searchPlaceholder="Search forecast"
        searchable
        pageSize={5}
        actions={[
          { label: 'View', icon: <FiEye />, onClick: () => {} },
          { label: 'Adjust', icon: <FiEdit2 />, onClick: () => {} },
        ]}
        statusMap={{ healthy: 'success', watch: 'warning' }}
      />
    </div>
  );
};

export default ForecastDashboard;
