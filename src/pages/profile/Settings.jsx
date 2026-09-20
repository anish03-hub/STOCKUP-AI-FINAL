import React, { useState } from 'react';
import '../../styles/profile/settings-premium.css';
import SettingsSidebar from './components/SettingsSidebar';
import SettingsForm from './components/SettingsForm';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <h1 className="settings-page-title">Settings</h1>
        <p className="settings-page-description">
          Manage your StockUp AI account, pharmacy profile, security, notifications and system preferences.
        </p>
      </div>

      <div className="settings-workspace">
        <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <SettingsForm activeTab={activeTab} />
      </div>
    </div>
  );
};

export default Settings;
