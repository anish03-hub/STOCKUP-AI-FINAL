import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  RiHospitalLine
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

  const handleNavigate = (path) => {
    navigate(path);
  };

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
              <div
                key={itemIndex}
                className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                onClick={() => handleNavigate(item.path)}
                title={collapsed ? item.label : ''}
              >
                <span className="nav-item-icon">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </div>
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
            navigate('/login', { replace: true });
            if (window.innerWidth <= 768) setCollapsed(true);
          }} title="Logout">
            <RiLogoutBoxRLine size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
