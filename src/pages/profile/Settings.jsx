import React, { useState } from 'react';
import '../../styles/profile/settings-premium.css';
import SettingsCard from './components/SettingsCard';
import SettingsSidebar from './components/SettingsSidebar';
import SettingsForm from './components/SettingsForm';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');

  const cards = [
    { id: 'general', title: 'General', description: 'Basic hospital details and regional settings', icon: '🏢' },
    { id: 'security', title: 'Security', description: 'Password, 2FA, and active sessions', icon: '🔒' },
    { id: 'notifications', title: 'Notifications', description: 'Manage alerts, emails, and AI forecasts', icon: '🔔' },
    { id: 'appearance', title: 'Appearance', description: 'Theme, layout, and display preferences', icon: '🎨' },
    { id: 'general', title: 'Language', description: 'System language and localization', icon: '🌐' }, 
    { id: 'backup', title: 'Backup & Restore', description: 'Data export, import, and system reset', icon: '💾' },
  ];

  return (
    <div className="settings-premium-container">
      <div className="settings-header">
        <h1 className="settings-title">⚙ Settings</h1>
        <p className="settings-subtitle">Manage your hospital ERP preferences and system settings.</p>
      </div>

      <div className="settings-cards-grid">
        {cards.map((card, index) => (
          <SettingsCard
            key={index}
            title={card.title}
            description={card.description}
            icon={card.icon}
            onClick={() => setActiveTab(card.id)}
          />
        ))}
      </div>

      <div className="settings-content-wrapper">
        <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <SettingsForm activeTab={activeTab} />
      </div>
    </div>
  );
};

export default Settings;
