import React from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { 
  RiDashboardLine, 
  RiMedicineBottleLine, 
  RiInboxArchiveLine,
  RiLineChartLine,
  RiFileTextLine,
  RiTruckLine,
  RiShoppingCartLine,
  RiRobot2Line,
  RiUserLine,
  RiSettings4Line,
  RiLogoutBoxRLine,
  RiHospitalLine,
  RiBarChartBoxLine,
  RiAlertLine,
  RiAlarmWarningLine
} from 'react-icons/ri';
import '../../styles/layout/layout.css';

const Sidebar = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navGroups = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: <RiDashboardLine /> }
      ]
    },
    {
      title: 'Medicine',
      items: [
        { label: 'Medicines', path: '/medicines', icon: <RiMedicineBottleLine /> },
        { label: 'Inventory', path: '/inventory', icon: <RiInboxArchiveLine /> }
      ]
    },
    {
      title: 'Analytics',
      items: [
        { label: 'Forecast', path: '/forecast', icon: <RiLineChartLine /> },
        { label: 'Demand Prediction', path: '/prediction', icon: <RiBarChartBoxLine />, exact: true },
        { label: 'Medicine Demand Prediction', path: '/prediction/medicine-demand', icon: <RiMedicineBottleLine /> },
        { label: 'Stock-out Prediction', path: '/stockout', icon: <RiAlertLine /> },
        { label: 'Reorder Optimization', path: '/reorder', icon: <RiShoppingCartLine /> },
        { label: 'Expiry Alerts', path: '/expiry', icon: <RiAlarmWarningLine /> },
        { label: 'Reports', path: '/reports', icon: <RiFileTextLine /> }
      ]
    },
    {
      title: 'Operations',
      items: [
        { label: 'Suppliers', path: '/suppliers', icon: <RiTruckLine /> },
        { label: 'Purchase Orders', path: '/purchase-orders', icon: <RiShoppingCartLine /> }
      ]
    },
    {
      title: 'AI',
      items: [
        { label: 'AI Assistant', path: '/ai-assistant', icon: <RiRobot2Line /> }
      ]
    },
    {
      title: 'Account',
      items: [
        { label: 'Profile', path: '/profile', icon: <RiUserLine /> },
        { label: 'Settings', path: '/settings', icon: <RiSettings4Line /> }
      ]
    }
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <RiHospitalLine className="sidebar-logo-icon" />
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span>StockUp AI</span>
            <span className="sidebar-logo-subtitle">Hospital ERP</span>
          </div>
        )}
      </div>

      <div className="sidebar-nav">
        {navGroups.map((group, index) => (
          <div key={index}>
            {!collapsed && <div className="nav-section-title">{group.title}</div>}
            {group.items.map((item, itemIndex) => (
              <NavLink
                key={itemIndex}
                to={item.path}
                end={item.exact}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <span className="nav-item-icon">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="user-avatar">AD</div>
        {!collapsed && (
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <span className="user-role">System Administrator</span>
          </div>
        )}
        {!collapsed && (
          <button className="logout-btn" onClick={() => {
            localStorage.removeItem('stockup_user');
            localStorage.removeItem('stockup_token');
            navigate('/login', { replace: true });
          }} title="Logout">
            <RiLogoutBoxRLine size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
