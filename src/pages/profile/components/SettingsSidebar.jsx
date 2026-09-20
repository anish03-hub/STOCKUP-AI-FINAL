import React from 'react';
import { 
  FiSliders, 
  FiShield, 
  FiBell, 
  FiLayout, 
  FiGlobe, 
  FiDatabase 
} from 'react-icons/fi';

const navItems = [
  { id: 'general', label: 'General', icon: FiSliders, desc: 'Pharmacy profile & regional' },
  { id: 'security', label: 'Security', icon: FiShield, desc: 'Passwords, 2FA & sessions' },
  { id: 'notifications', label: 'Notifications', icon: FiBell, desc: 'Stock alerts & AI insights' },
  { id: 'appearance', label: 'Appearance', icon: FiLayout, desc: 'Theme & layout density' },
  { id: 'language', label: 'Language', icon: FiGlobe, desc: 'Localization & language' },
  { id: 'backup', label: 'Backup & Restore', icon: FiDatabase, desc: 'Data export & maintenance' },
];

const SettingsSidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="settings-sidebar" aria-label="Settings navigation">
      <div className="settings-sidebar-header">
        <span className="settings-sidebar-title">SETTINGS</span>
      </div>
      <nav className="settings-nav-list" role="tablist">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`settings-panel-${item.id}`}
              id={`settings-tab-${item.id}`}
              className={`settings-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="settings-nav-icon-wrap">
                <Icon className="settings-nav-icon" />
              </span>
              <span className="settings-nav-text-wrap">
                <span className="settings-nav-label">{item.label}</span>
                <span className="settings-nav-desc">{item.desc}</span>
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default SettingsSidebar;
