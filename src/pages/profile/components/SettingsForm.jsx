import React, { useState } from 'react';
import ToggleSwitch from './ToggleSwitch';
import SaveButton from './SaveButton';

const SettingsForm = ({ activeTab }) => {
  const [formData, setFormData] = useState({
    hospitalName: 'City General Hospital',
    hospitalCode: 'HOSP-12345',
    email: 'admin@cityhospital.com',
    phone: '+1 (555) 123-4567',
    address: '123 Health Ave, Medical District',
    timezone: 'America/New_York',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    language: 'English',
    enable2FA: true,
    emailAlerts: true,
    smsAlerts: false,
    lowStock: true,
    expiryAlerts: true,
    aiForecast: true,
    theme: 'light',
    compactSidebar: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleToggle = (name) => {
    setFormData({
      ...formData,
      [name]: !formData[name]
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    console.log('Saved data:', formData);
    // Add success notification logic here
  };

  return (
    <div className="settings-form-container">
      <form onSubmit={handleSave}>
        {activeTab === 'general' && (
          <div>
            <h2 className="settings-section-title">General Settings</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Hospital Name</label>
                <input type="text" className="form-input" name="hospitalName" value={formData.hospitalName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Hospital Code</label>
                <input type="text" className="form-input" name="hospitalCode" value={formData.hospitalCode} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" name="email" value={formData.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-input" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Address</label>
                <input type="text" className="form-input" name="address" value={formData.address} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Timezone</label>
                <select className="form-select" name="timezone" value={formData.timezone} onChange={handleChange}>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-select" name="currency" value={formData.currency} onChange={handleChange}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date Format</label>
                <select className="form-select" name="dateFormat" value={formData.dateFormat} onChange={handleChange}>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Language</label>
                <select className="form-select" name="language" value={formData.language} onChange={handleChange}>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div>
            <h2 className="settings-section-title">Security & Privacy</h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" placeholder="••••••••" />
              </div>
            </div>
            
            <div className="mt-8 mb-6" style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>
              <ToggleSwitch 
                title="Two-Factor Authentication (2FA)" 
                description="Require a security code when logging in."
                checked={formData.enable2FA}
                onChange={() => handleToggle('enable2FA')}
              />
            </div>
            
            <div className="session-history">
              <h3 className="form-label" style={{ marginBottom: '1rem' }}>Login Session History</h3>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  <div>
                    <strong>Mac OS • Chrome</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>IP: 192.168.1.1</div>
                  </div>
                  <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: '500' }}>Active Now</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>Windows 11 • Edge</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>IP: 192.168.1.42</div>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Yesterday, 14:30</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h2 className="settings-section-title">Notification Preferences</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ToggleSwitch 
                title="Email Alerts" 
                description="Receive system alerts via email."
                checked={formData.emailAlerts}
                onChange={() => handleToggle('emailAlerts')}
              />
              <ToggleSwitch 
                title="SMS Alerts" 
                description="Receive urgent notifications via SMS."
                checked={formData.smsAlerts}
                onChange={() => handleToggle('smsAlerts')}
              />
              <ToggleSwitch 
                title="Low Stock Warnings" 
                description="Get notified when inventory falls below threshold."
                checked={formData.lowStock}
                onChange={() => handleToggle('lowStock')}
              />
              <ToggleSwitch 
                title="Expiry Alerts" 
                description="Alerts for medicines nearing expiration."
                checked={formData.expiryAlerts}
                onChange={() => handleToggle('expiryAlerts')}
              />
              <ToggleSwitch 
                title="AI Forecast Insights" 
                description="Receive weekly AI-generated demand predictions."
                checked={formData.aiForecast}
                onChange={() => handleToggle('aiForecast')}
              />
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div>
            <h2 className="settings-section-title">Appearance</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Theme</label>
                <select className="form-select" name="theme" value={formData.theme} onChange={handleChange}>
                  <option value="light">Light Theme (Default)</option>
                  <option value="dark">Dark Theme</option>
                  <option value="system">System Preference</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Font Size</label>
                <select className="form-select" defaultValue="medium">
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <ToggleSwitch 
                title="Compact Sidebar" 
                description="Use a smaller sidebar to maximize screen real estate."
                checked={formData.compactSidebar}
                onChange={() => handleToggle('compactSidebar')}
              />
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div>
            <h2 className="settings-section-title">Backup & Restore</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Manage your hospital data, perform manual backups, or export reports for auditing.
            </p>
            <div className="backup-actions">
              <button type="button" className="btn btn-outline-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⬇️ Export Data (CSV)
              </button>
              <button type="button" className="btn btn-outline-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⬆️ Import Backup
              </button>
              <button type="button" className="btn btn-outline-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📄 Download Audit Reports
              </button>
            </div>
            
            <div style={{ marginTop: '2.5rem', padding: '1.5rem', border: '1px solid #fca5a5', borderRadius: '8px', background: '#fef2f2' }}>
              <h3 style={{ color: '#ef4444', marginBottom: '0.5rem', fontWeight: '600' }}>Danger Zone</h3>
              <p style={{ color: '#7f1d1d', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Once you delete your organization data, there is no going back. Please be certain.
              </p>
              <button type="button" className="btn btn-danger">Reset All System Data</button>
            </div>
          </div>
        )}

        {activeTab !== 'backup' && (
          <div className="form-actions">
            <SaveButton variant="secondary" type="button">Cancel</SaveButton>
            <SaveButton variant="primary" type="submit">Save Changes</SaveButton>
          </div>
        )}
      </form>
    </div>
  );
};

export default SettingsForm;
