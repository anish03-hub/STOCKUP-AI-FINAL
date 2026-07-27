import React from 'react';

const navItems = [
  { id: 'general', label: 'General', icon: '🏢' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'appearance', label: 'Appearance', icon: '🎨' },
  { id: 'backup', label: 'Backup & Restore', icon: '💾' },
];

const SettingsSidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="settings-sidebar">
      {navItems.map((item) => (
        <div
          key={item.id}
          className={`settings-nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => setActiveTab(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default SettingsSidebar;
