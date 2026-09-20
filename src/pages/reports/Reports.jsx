import React, { useMemo, useState } from 'react';
import { FiDownload, FiFileText, FiTrendingUp, FiTrendingDown, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DataTable from '../../components/common/DataTable';
import '../../styles/reports/reports.css';

const dailyData = [
  { time: '08:00', dispensing: 45, receiving: 0 },
  { time: '10:00', dispensing: 85, receiving: 120 },
  { time: '12:00', dispensing: 65, receiving: 40 },
  { time: '14:00', dispensing: 90, receiving: 0 },
  { time: '16:00', dispensing: 75, receiving: 80 },
  { time: '18:00', dispensing: 40, receiving: 0 },
];

const weeklyData = [
  { day: 'Mon', paracetamol: 400, amoxicillin: 240, ibuprofen: 300 },
  { day: 'Tue', paracetamol: 300, amoxicillin: 139, ibuprofen: 200 },
  { day: 'Wed', paracetamol: 200, amoxicillin: 480, ibuprofen: 278 },
  { day: 'Thu', paracetamol: 278, amoxicillin: 390, ibuprofen: 189 },
  { day: 'Fri', paracetamol: 189, amoxicillin: 480, ibuprofen: 239 },
  { day: 'Sat', paracetamol: 239, amoxicillin: 380, ibuprofen: 349 },
  { day: 'Sun', paracetamol: 349, amoxicillin: 430, ibuprofen: 200 },
];

const inventoryData = [
  { name: 'Antibiotics', value: 400 },
  { name: 'Analgesics', value: 300 },
  { name: 'Cardiovascular', value: 300 },
  { name: 'Vitamins', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('Daily');

  const tabs = ['Daily', 'Weekly', 'Monthly', 'Forecast', 'Inventory'];

  const reportRows = useMemo(() => [
    { id: 'R-104', name: 'Inventory Snapshot', owner: 'Ops Team', status: 'Ready', updated: '2h ago' },
    { id: 'R-105', name: 'Consumption Trend', owner: 'Procurement', status: 'Pending', updated: '1d ago' },
    { id: 'R-106', name: 'Expiry Watchlist', owner: 'Pharmacy', status: 'Ready', updated: '3h ago' },
  ], []);

  const columns = useMemo(() => [
    { key: 'id', title: 'Report ID', accessor: 'id', sortable: true },
    { key: 'name', title: 'Report', accessor: 'name', sortable: true },
    { key: 'owner', title: 'Owner', accessor: 'owner', sortable: true },
    { key: 'status', title: 'Status', accessor: 'status', type: 'status', sortable: true },
    { key: 'updated', title: 'Updated', accessor: 'updated', sortable: true },
    { key: 'actions', title: 'Actions', type: 'actions' },
  ], []);

  const handleExportPDF = () => {
    alert("Exporting report as PDF...");
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Daily':
        return (
          <>
            <div className="report-summary-cards">
              <div className="report-summary-card">
                <div className="card-title">Total Items Dispensed (Today)</div>
                <div className="report-metric">
                  <span className="metric-val">400</span>
                  <span className="metric-trend up"><FiTrendingUp /> +12%</span>
                </div>
              </div>
              <div className="report-summary-card">
                <div className="card-title">Total Items Received (Today)</div>
                <div className="report-metric">
                  <span className="metric-val">240</span>
                  <span className="metric-trend down"><FiTrendingDown /> -5%</span>
                </div>
              </div>
            </div>
            <div className="chart-card">
              <h3>Hourly Transaction Volume</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="dispensing" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="receiving" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        );
      case 'Weekly':
        return (
          <div className="chart-card">
            <h3>Top 3 Medicines Consumption (Past 7 Days)</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="paracetamol" stackId="a" fill="#8884d8" />
                  <Bar dataKey="amoxicillin" stackId="a" fill="#82ca9d" />
                  <Bar dataKey="ibuprofen" stackId="a" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'Inventory':
        return (
          <div className="chart-card">
            <h3>Inventory Distribution by Category</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      default:
        return (
          <div className="chart-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-secondary)' }}>
            <p>Detailed data for {activeTab} report will be available in the next sync.</p>
          </div>
        );
    }
  };

  return (
    <div className="reports-page">
      <div className="report-header">
        <h1>Analytics & Reports</h1>
        <div className="export-btn-group">
          <button className="btn-export">
            <FiDownload /> CSV
          </button>
          <button className="btn-export primary" onClick={handleExportPDF}>
            <FiFileText /> Export PDF
          </button>
        </div>
      </div>

      <div className="report-tabs">
        {tabs.map(tab => (
          <button 
            key={tab} 
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab} Report
          </button>
        ))}
      </div>

      <div className="report-content">
        {renderContent()}
      </div>

      <DataTable
        data={reportRows}
        columns={columns}
        title="Operational Reports"
        subtitle="Track reports, review status, and coordinate exports"
        searchPlaceholder="Search reports"
        searchable
        pageSize={5}
        actions={[
          { label: 'View', icon: <FiEye />, onClick: () => {} },
          { label: 'Edit', icon: <FiEdit2 />, onClick: () => {} },
          { label: 'Archive', icon: <FiTrash2 />, onClick: () => {} },
        ]}
        statusMap={{ ready: 'success', pending: 'warning' }}
      />
    </div>
  );
};

export default Reports;
