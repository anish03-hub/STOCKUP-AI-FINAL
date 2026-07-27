import React from 'react';
import { FiPlus, FiEdit2, FiShoppingCart, FiCpu } from 'react-icons/fi';
import '../../styles/dashboard/dashboard.css';

const activities = [
  { id: 1, icon: <FiPlus color="#3b82f6" />, title: 'New medicine added', user: 'Dr. Smith', time: '10 mins ago' },
  { id: 2, icon: <FiEdit2 color="#10b981" />, title: 'Stock updated for Paracetamol', user: 'Pharmacist Jane', time: '1 hour ago' },
  { id: 3, icon: <FiShoppingCart color="#f59e0b" />, title: 'Purchase order #PO-203 created', user: 'Admin', time: '3 hours ago' },
  { id: 4, icon: <FiCpu color="#8b5cf6" />, title: 'AI demand forecast generated', user: 'System', time: '5 hours ago' },
  { id: 5, icon: <FiPlus color="#3b82f6" />, title: 'Batch #B-102 added to Amoxicillin', user: 'Pharmacist Jane', time: 'Yesterday' },
  { id: 6, icon: <FiEdit2 color="#10b981" />, title: 'Supplier details updated', user: 'Admin', time: 'Yesterday' },
];

const RecentActivities = () => {
  return (
    <div className="chart-card">
      <h3>Recent Activities</h3>
      <div className="activity-section">
        {activities.map(activity => (
          <div key={activity.id} className="activity-item">
            <div className="activity-icon">
              {activity.icon}
            </div>
            <div className="activity-content">
              <h4 className="activity-title">{activity.title}</h4>
              <div className="activity-meta">
                <span>{activity.user}</span>
                <span>•</span>
                <span>{activity.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivities;
