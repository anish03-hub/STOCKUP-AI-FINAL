import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
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
  RiAlarmWarningLine,
  RiTeamLine
} from 'react-icons/ri';
import '../../styles/layout/layout.css';

const Sidebar = ({ collapsed }) => {
  const navigate = useNavigate();

  const user = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('stockup_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const businessName = user?.businessName || user?.business_name || 'StockUp Enterprise';
  const userName = user?.fullName || user?.name || user?.email || 'Administrator';
  const userRole = user?.role || 'ADMIN';
  const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AD';

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
      title: 'Sales & POS',
      items: [
        { label: 'POS Billing', path: '/billing', icon: <RiShoppingCartLine /> },
        { label: 'Sales History', path: '/sales/history', icon: <RiFileTextLine /> },
        { label: 'Sales Analytics', path: '/sales-analytics', icon: <RiLineChartLine /> },
      ]
    },
    {
      title: 'Analytics & AI',
      items: [
        { label: 'Forecast', path: '/forecast', icon: <RiBarChartBoxLine /> },
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
        { label: 'Users', path: '/users', icon: <RiTeamLine /> },
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
            <span className="sidebar-logo-subtitle">{businessName}</span>
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
        <div className="user-avatar">{initials}</div>
        {!collapsed && (
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <span className="user-role" style={{ fontSize: '0.75rem', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {businessName} • {userRole}
            </span>
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
