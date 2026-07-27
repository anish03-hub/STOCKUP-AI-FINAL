import React from 'react';
import { FiBox, FiCheckCircle, FiAlertCircle, FiClock, FiActivity, FiShoppingCart } from 'react-icons/fi';
import StatCard from '../../components/dashboard/StatCard';
import MedicineUsageChart from '../../components/dashboard/MedicineUsageChart';
import InventoryStatusChart from '../../components/dashboard/InventoryStatusChart';
import DemandForecastChart from '../../components/dashboard/DemandForecastChart';
import AIRecommendationCard from '../../components/dashboard/AIRecommendationCard';
import RecentActivities from '../../components/dashboard/RecentActivities';
import LowStockTable from '../../components/dashboard/LowStockTable';
import ExpiryAlertTable from '../../components/dashboard/ExpiryAlertTable';
import '../../styles/dashboard/dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Good Morning, Dr. Admin</h1>
          <p>Thursday, 24 July 2026 | StockUp AI Dashboard</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard 
          title="Total Medicines" 
          value="4,250" 
          icon={<FiBox />} 
          trend={5.2} 
          trendLabel="vs last month" 
          color="#3b82f6" 
          bgColor="#eff6ff" 
        />
        <StatCard 
          title="Available Stock" 
          value="8,500" 
          icon={<FiCheckCircle />} 
          trend={2.1} 
          trendLabel="vs last month" 
          color="#10b981" 
          bgColor="#ecfdf5" 
        />
        <StatCard 
          title="Low Stock Items" 
          value="124" 
          icon={<FiAlertCircle />} 
          trend={-12.5} 
          trendLabel="vs last month" 
          color="#f59e0b" 
          bgColor="#fffbeb" 
        />
        <StatCard 
          title="Near Expiry" 
          value="45" 
          icon={<FiClock />} 
          trend={4.3} 
          trendLabel="vs last month" 
          color="#ef4444" 
          bgColor="#fef2f2" 
        />
        <StatCard 
          title="Today's Usage" 
          value="892" 
          icon={<FiActivity />} 
          trend={15.4} 
          trendLabel="vs yesterday" 
          color="#8b5cf6" 
          bgColor="#f5f3ff" 
        />
        <StatCard 
          title="Pending POs" 
          value="12" 
          icon={<FiShoppingCart />} 
          trend={-2.4} 
          trendLabel="vs last week" 
          color="#14b8a6" 
          bgColor="#f0fdfa" 
        />
      </div>

      <AIRecommendationCard />

      <div className="charts-grid">
        <MedicineUsageChart />
        <InventoryStatusChart />
      </div>

      <DemandForecastChart />

      <div className="charts-grid" style={{ marginTop: '24px' }}>
        <RecentActivities />
        <LowStockTable />
      </div>

      <div style={{ marginTop: '24px' }}>
        <ExpiryAlertTable />
      </div>
    </div>
  );
};

export default Dashboard;
