import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  RiMenuLine, 
  RiUserLine, 
  RiSettings4Line, 
  RiLogoutBoxRLine 
} from 'react-icons/ri';
import '../../styles/layout/layout.css';

const Navbar = ({ collapsed, setCollapsed }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    const parts = path.split('/').filter(Boolean);
    if (parts.length > 0) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).replace('-', ' ');
    }
    return 'Dashboard';
  };

  return (
    <div className={`navbar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="navbar-left">
        <button 
          className="navbar-toggle" 
          onClick={() => setCollapsed(!collapsed)}
        >
          <RiMenuLine />
        </button>
        <h1 className="navbar-title">{getPageTitle()}</h1>
      </div>

      <div className="navbar-actions">
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button 
            className="navbar-action-btn"
            style={{ padding: '4px' }}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.875rem' }}>
              AD
            </div>
          </button>
          
          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="user-avatar" style={{ width: '40px', height: '40px' }}>
                  AD
                </div>
                <div className="profile-dropdown-info">
                  <span className="profile-dropdown-name">Admin User</span>
                  <span className="profile-dropdown-email">admin@stockup.ai</span>
                </div>
              </div>
              <div className="profile-dropdown-menu">
                <button className="profile-dropdown-item" onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}>
                  <RiUserLine /> Profile
                </button>
                <button className="profile-dropdown-item" onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}>
                  <RiSettings4Line /> Settings
                </button>
                <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }}></div>
                <button className="profile-dropdown-item" onClick={() => { 
                  localStorage.removeItem('stockup_user');
                  localStorage.removeItem('stockup_token');
                  navigate('/login', { replace: true }); 
                  setShowProfileMenu(false); 
                }}>
                  <RiLogoutBoxRLine /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
