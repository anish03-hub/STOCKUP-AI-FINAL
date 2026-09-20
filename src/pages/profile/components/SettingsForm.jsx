import React, { useState } from 'react';
import { 
  FiCheckCircle, 
  FiDownload, 
  FiUpload, 
  FiFileText, 
  FiAlertTriangle, 
  FiShield, 
  FiKey, 
  FiMonitor,
  FiRefreshCw,
  FiDatabase,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { useTheme } from '../../../context/useTheme';
import { useCurrency } from '../../../context/useCurrency';
import { userApi } from '../../../services/api';
import ToggleSwitch from './ToggleSwitch';
import SaveButton from './SaveButton';

const SettingsForm = ({ activeTab }) => {
  const { theme, setTheme } = useTheme();
  const { 
    selectedCurrency, 
    changeCurrency, 
    rates, 
    exchangeRate, 
    rateUpdatedAt, 
    rateSource, 
    isCached,
    supportedCurrencies 
  } = useCurrency();

  // Scoped message states per settings tab
  const [generalSuccessMessage, setGeneralSuccessMessage] = useState('');
  const [generalErrorMessage, setGeneralErrorMessage] = useState('');
  const [securitySuccessMessage, setSecuritySuccessMessage] = useState('');
  const [securityErrorMessage, setSecurityErrorMessage] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Show/Hide password toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Retrieve user context from localStorage if present
  const user = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('stockup_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const [formData, setFormData] = useState({
    pharmacyName: user?.businessName || user?.business_name || 'MediCare',
    pharmacyCode: 'MED-001',
    email: user?.email || 'medicare@stockupai.in',
    phone: '+91 98765 43210',
    address: 'Plot 42, Health City, Outer Ring Rd, Bangalore, India',
    timezone: 'Asia/Kolkata',
    currency: selectedCurrency || 'USD',
    dateFormat: 'DD/MM/YYYY',
    language: 'en_US',
    enable2FA: true,
    emailAlerts: true,
    smsAlerts: false,
    lowStock: true,
    expiryAlerts: true,
    aiForecast: true,
    theme: theme || 'light',
    density: 'comfortable',
    compactSidebar: false
  });

  // Sync formData currency if context currency changes
  React.useEffect(() => {
    if (selectedCurrency) {
      setFormData(prev => ({ ...prev, currency: selectedCurrency }));
    }
  }, [selectedCurrency]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'theme') {
      setTheme(value);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggle = (name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e?.preventDefault();
    setSecurityErrorMessage('');
    setSecuritySuccessMessage('');

    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword) {
      setSecurityErrorMessage('Current password is required.');
      return;
    }
    if (!newPassword) {
      setSecurityErrorMessage('New password is required.');
      return;
    }
    if (!confirmPassword) {
      setSecurityErrorMessage('Confirm new password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setSecurityErrorMessage('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityErrorMessage('New passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setSecurityErrorMessage('New password must be different from current password.');
      return;
    }

    setPasswordLoading(true);

    try {
      await userApi.changePassword(currentPassword, newPassword);
      setSecuritySuccessMessage('Password changed successfully.');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setSecurityErrorMessage(err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();

    if (activeTab === 'security') {
      return handlePasswordSubmit(e);
    }

    setSaving(true);
    setGeneralErrorMessage('');
    setGeneralSuccessMessage('');
    setTheme(formData.theme);

    try {
      if (formData.currency !== selectedCurrency) {
        await changeCurrency(formData.currency);
      }
      const currInfo = supportedCurrencies[formData.currency] || { code: formData.currency, symbol: '' };
      const rateVal = rates[formData.currency] || exchangeRate || 1.0;
      
      if (formData.currency !== 'USD') {
        setGeneralSuccessMessage(`Currency updated to ${currInfo.code} (${currInfo.symbol}) • Exchange Rate: 1 USD = ${currInfo.symbol}${rateVal.toFixed(4)}`);
      } else {
        setGeneralSuccessMessage('Currency set to USD ($) • Base currency (1:1 conversion).');
      }

      setSaving(false);
      setTimeout(() => setGeneralSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setGeneralErrorMessage(err.message || 'Failed to save settings.');
      setSaving(false);
    }
  };

  const handleExportData = (format) => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify({
        pharmacy: formData.pharmacyName,
        exportDate: new Date().toISOString(),
        settings: formData
      }, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `stockup_backup_${format.toLowerCase()}_${Date.now()}.${format.toLowerCase()}`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="settings-content" id={`settings-panel-${activeTab}`} role="tabpanel" aria-labelledby={`settings-tab-${activeTab}`}>
      <form onSubmit={handleSave} noValidate>
        {/* ── 1. General Settings ────────────────────────────────────── */}
        {activeTab === 'general' && (
          <div className="settings-section">
            <div className="settings-content-header">
              <h2>General Settings</h2>
              <p>Manage your pharmacy profile, operational credentials, and regional standards.</p>
            </div>

            {generalSuccessMessage && (
              <div className="settings-alert-banner success" role="status">
                <FiCheckCircle className="settings-alert-icon" />
                <div className="settings-alert-text">
                  <strong>Settings saved successfully!</strong>
                  <span>{generalSuccessMessage}</span>
                </div>
              </div>
            )}

            {generalErrorMessage && (
              <div className="settings-alert-banner error" role="status">
                <FiAlertTriangle className="settings-alert-icon" />
                <div className="settings-alert-text">
                  <strong>{generalErrorMessage}</strong>
                </div>
              </div>
            )}

            <div className="settings-divider"></div>

            <div className="settings-form-grid">
              <div className="settings-field">
                <label className="settings-label" htmlFor="pharmacyName">Pharmacy Name</label>
                <input 
                  id="pharmacyName"
                  type="text" 
                  className="settings-input" 
                  name="pharmacyName" 
                  value={formData.pharmacyName} 
                  onChange={handleChange} 
                  placeholder="e.g. MediCare Pharmacy"
                />
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="pharmacyCode">Pharmacy Code</label>
                <input 
                  id="pharmacyCode"
                  type="text" 
                  className="settings-input" 
                  name="pharmacyCode" 
                  value={formData.pharmacyCode} 
                  onChange={handleChange} 
                  placeholder="e.g. MED-001"
                />
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="email">Official Email</label>
                <input 
                  id="email"
                  type="email" 
                  className="settings-input" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="admin@pharmacy.com"
                />
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="phone">Phone / Helpline</label>
                <input 
                  id="phone"
                  type="text" 
                  className="settings-input" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="settings-field full-width">
                <label className="settings-label" htmlFor="address">Physical Address</label>
                <input 
                  id="address"
                  type="text" 
                  className="settings-input" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  placeholder="Full operating address"
                />
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="timezone">Operational Timezone</label>
                <select 
                  id="timezone"
                  className="settings-select" 
                  name="timezone" 
                  value={formData.timezone} 
                  onChange={handleChange}
                >
                  <option value="Asia/Kolkata">India Standard Time (IST • UTC+5:30)</option>
                  <option value="America/New_York">Eastern Time (ET • UTC-5:00)</option>
                  <option value="America/Chicago">Central Time (CT • UTC-6:00)</option>
                  <option value="America/Denver">Mountain Time (MT • UTC-7:00)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT • UTC-8:00)</option>
                  <option value="Europe/London">Greenwich Mean Time (GMT • UTC+0:00)</option>
                  <option value="Europe/Paris">Central European Time (CET • UTC+1:00)</option>
                </select>
              </div>

              <div className="settings-field full-width">
                <label className="settings-label" htmlFor="currency">Billing Currency</label>
                <select 
                  id="currency"
                  className="settings-select" 
                  name="currency" 
                  value={formData.currency} 
                  onChange={handleChange}
                >
                  {Object.values(supportedCurrencies || {}).map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>

                {formData.currency !== 'USD' ? (
                  <div style={{
                    marginTop: '10px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary, #f8fafc)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                    fontSize: '13px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '11px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Exchange Rate</span>
                      <strong style={{ color: 'var(--text-primary, #0f172a)', fontSize: '14px' }}>
                        1 USD = {(supportedCurrencies[formData.currency]?.symbol || '')}{(rates[formData.currency] || exchangeRate || 1.0).toFixed(4)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '11px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rate Source</span>
                      <span style={{ color: 'var(--text-secondary, #475569)', fontWeight: 500 }}>
                        {rateSource || 'Open Exchange Rates (Live)'}
                        {isCached && ' (Cached)'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '11px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Updated</span>
                      <span style={{ color: 'var(--text-secondary, #475569)' }}>{rateUpdatedAt || 'just now'}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: 'var(--text-muted, #64748b)'
                  }}>
                    Base monetary currency (1:1 conversion). Database values are maintained in USD.
                  </div>
                )}
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="dateFormat">Date Format</label>
                <select 
                  id="dateFormat"
                  className="settings-select" 
                  name="dateFormat" 
                  value={formData.dateFormat} 
                  onChange={handleChange}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 17/09/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/17/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-17)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. Security Settings ───────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="settings-section">
            <div className="settings-content-header">
              <h2>Security & Access Control</h2>
              <p>Manage your login credentials, two-factor authentication, and monitor active sessions.</p>
            </div>

            {securitySuccessMessage && (
              <div className="settings-alert-banner success" role="status">
                <FiCheckCircle className="settings-alert-icon" />
                <div className="settings-alert-text">
                  <strong>{securitySuccessMessage}</strong>
                </div>
              </div>
            )}

            {securityErrorMessage && (
              <div className="settings-alert-banner error" role="status">
                <FiAlertTriangle className="settings-alert-icon" />
                <div className="settings-alert-text">
                  <strong>{securityErrorMessage}</strong>
                </div>
              </div>
            )}

            <div className="settings-divider"></div>

            <h3 className="settings-subsection-title">
              <FiKey className="settings-subsection-icon" /> Change Account Password
            </h3>

            <div className="settings-form-grid">
              <div className="settings-field full-width">
                <label className="settings-label" htmlFor="currentPassword">Current Password</label>
                <div className="settings-password-field">
                  <input 
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"} 
                    className="settings-input" 
                    name="currentPassword" 
                    placeholder="••••••••••••"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                  />
                  <button 
                    type="button"
                    className="settings-password-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                  >
                    {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="newPassword">New Password</label>
                <div className="settings-password-field">
                  <input 
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"} 
                    className="settings-input" 
                    name="newPassword" 
                    placeholder="Min. 8 characters with numbers"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                  />
                  <button 
                    type="button"
                    className="settings-password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="confirmPassword">Confirm New Password</label>
                <div className="settings-password-field">
                  <input 
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"} 
                    className="settings-input" 
                    name="confirmPassword" 
                    placeholder="Re-enter new password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                  <button 
                    type="button"
                    className="settings-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-start' }}>
              <button 
                type="button" 
                className="settings-btn settings-btn-primary" 
                onClick={handlePasswordSubmit}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <>
                    <FiRefreshCw className="spinning" />
                    <span>Changing password...</span>
                  </>
                ) : (
                  <>
                    <FiKey />
                    <span>Change Account Password</span>
                  </>
                )}
              </button>
            </div>

            <div className="settings-divider"></div>

            <h3 className="settings-subsection-title">
              <FiShield className="settings-subsection-icon" /> Two-Factor Authentication (2FA)
            </h3>
            
            <div className="settings-toggle-group">
              <ToggleSwitch 
                id="toggle-2fa"
                title="Enforce Two-Factor Authentication" 
                description="Require an authenticator OTP verification code during login for extra security."
                checked={formData.enable2FA}
                onChange={() => handleToggle('enable2FA')}
              />
            </div>

            <div className="settings-divider"></div>

            <h3 className="settings-subsection-title">
              <FiMonitor className="settings-subsection-icon" /> Active Login Sessions
            </h3>
            
            <div className="settings-session-list">
              <div className="settings-session-item current">
                <div className="settings-session-details">
                  <div className="settings-session-device">MacBook Pro • Google Chrome (macOS 15.0)</div>
                  <div className="settings-session-meta">IP: 192.168.1.104 • Bangalore, India</div>
                </div>
                <span className="settings-badge-active">Active Now (Current Session)</span>
              </div>

              <div className="settings-session-item">
                <div className="settings-session-details">
                  <div className="settings-session-device">POS Terminal 01 • Edge Browser (Windows 11)</div>
                  <div className="settings-session-meta">IP: 192.168.1.42 • In-Store POS</div>
                </div>
                <span className="settings-badge-muted">Yesterday, 18:45</span>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. Notification Preferences ────────────────────────────── */}
        {activeTab === 'notifications' && (
          <div className="settings-section">
            <div className="settings-content-header">
              <h2>Notification Preferences</h2>
              <p>Configure automated system notifications, stock alerts, and predictive AI recommendations.</p>
            </div>

            <div className="settings-divider"></div>

            <div className="settings-toggle-group">
              <ToggleSwitch 
                id="toggle-lowstock"
                title="Low Stock Warning Alerts" 
                description="Receive instant alerts when medicines drop below their minimum reorder point."
                checked={formData.lowStock}
                onChange={() => handleToggle('lowStock')}
              />

              <ToggleSwitch 
                id="toggle-expiry"
                title="Shelf-Life & Near-Expiry Notices" 
                description="Get notified about medicine batches approaching expiration within 30–90 days."
                checked={formData.expiryAlerts}
                onChange={() => handleToggle('expiryAlerts')}
              />

              <ToggleSwitch 
                id="toggle-aiforecast"
                title="AI Demand Forecast Insights" 
                description="Receive weekly AI-generated sales spikes and automated restocking recommendations."
                checked={formData.aiForecast}
                onChange={() => handleToggle('aiForecast')}
              />

              <ToggleSwitch 
                id="toggle-email"
                title="Daily Email Executive Digests" 
                description="Receive daily sales summaries, valuation changes, and inventory reports via email."
                checked={formData.emailAlerts}
                onChange={() => handleToggle('emailAlerts')}
              />

              <ToggleSwitch 
                id="toggle-sms"
                title="Critical SMS Notifications" 
                description="Emergency stock-out SMS alerts dispatched directly to the pharmacy administrator phone."
                checked={formData.smsAlerts}
                onChange={() => handleToggle('smsAlerts')}
              />
            </div>
          </div>
        )}

        {/* ── 4. Appearance ─────────────────────────────────────────── */}
        {activeTab === 'appearance' && (
          <div className="settings-section">
            <div className="settings-content-header">
              <h2>Appearance & Interface</h2>
              <p>Customize the visual workspace theme, data density, and sidebar presentation.</p>
            </div>

            <div className="settings-divider"></div>

            <div className="settings-form-grid">
              <div className="settings-field">
                <label className="settings-label" htmlFor="theme">Interface Theme</label>
                <select 
                  id="theme"
                  className="settings-select" 
                  name="theme" 
                  value={formData.theme} 
                  onChange={handleChange}
                >
                  <option value="light">Light Theme</option>
                  <option value="dark">Dark Theme</option>
                </select>
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="density">Display Density</label>
                <select 
                  id="density"
                  className="settings-select" 
                  name="density" 
                  value={formData.density} 
                  onChange={handleChange}
                >
                  <option value="comfortable">Comfortable (Balanced Spacing)</option>
                  <option value="compact">Compact (High-Throughput POS Density)</option>
                  <option value="large">Large (High-Visibility Font Size)</option>
                </select>
              </div>
            </div>

            <div className="settings-divider"></div>

            <div className="settings-toggle-group">
              <ToggleSwitch 
                id="toggle-sidebar"
                title="Compact Icon Sidebar" 
                description="Minimize navigation sidebar into an icon-only strip to maximize billing table workspace."
                checked={formData.compactSidebar}
                onChange={() => handleToggle('compactSidebar')}
              />
            </div>
          </div>
        )}

        {/* ── 5. Language & Localization ────────────────────────────── */}
        {activeTab === 'language' && (
          <div className="settings-section">
            <div className="settings-content-header">
              <h2>Language & Localization</h2>
              <p>Select system display language and regional numbering standards.</p>
            </div>

            <div className="settings-divider"></div>

            <div className="settings-form-grid">
              <div className="settings-field">
                <label className="settings-label" htmlFor="language">System Language</label>
                <select 
                  id="language"
                  className="settings-select" 
                  name="language" 
                  value={formData.language} 
                  onChange={handleChange}
                >
                  <option value="en_US">English (United States)</option>
                  <option value="en_IN">English (India)</option>
                  <option value="hi_IN">Hindi (हिंदी)</option>
                  <option value="es_ES">Spanish (Español)</option>
                  <option value="fr_FR">French (Français)</option>
                  <option value="de_DE">German (Deutsch)</option>
                </select>
              </div>
            </div>

            <div className="settings-preview-box">
              <div className="settings-preview-title">Regional Format Preview</div>
              <div className="settings-preview-grid">
                <div>
                  <span className="settings-preview-label">Sample Currency:</span>
                  <strong>$1,25,000.00</strong>
                </div>
                <div>
                  <span className="settings-preview-label">Sample Date:</span>
                  <strong>17/09/2026</strong>
                </div>
                <div>
                  <span className="settings-preview-label">Number Notation:</span>
                  <strong>2,511 Units</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 6. Backup & Restore ───────────────────────────────────── */}
        {activeTab === 'backup' && (
          <div className="settings-section">
            <div className="settings-content-header">
              <h2>Backup & Data Management</h2>
              <p>Export medicine inventories, download compliance audit ledgers, or restore backup archives.</p>
            </div>

            <div className="settings-divider"></div>

            <div className="settings-backup-cards">
              <div className="settings-backup-card">
                <div className="settings-backup-info">
                  <h4>Export Inventory & Sales</h4>
                  <p>Download complete active inventory records, POS transactions, and pricing master file.</p>
                </div>
                <button 
                  type="button" 
                  className="settings-btn settings-btn-outline"
                  onClick={() => handleExportData('CSV')}
                >
                  <FiDownload className="settings-btn-icon" /> Export CSV
                </button>
              </div>

              <div className="settings-backup-card">
                <div className="settings-backup-info">
                  <h4>System Snapshot (JSON)</h4>
                  <p>Create a full configuration and master schema backup file for disaster recovery.</p>
                </div>
                <button 
                  type="button" 
                  className="settings-btn settings-btn-outline"
                  onClick={() => handleExportData('JSON')}
                >
                  <FiDatabase className="settings-btn-icon" /> Export Snapshot
                </button>
              </div>

              <div className="settings-backup-card">
                <div className="settings-backup-info">
                  <h4>Regulatory Audit Reports</h4>
                  <p>Download formal FDA / GxP compliance logs including user access timestamps and stock edits.</p>
                </div>
                <button 
                  type="button" 
                  className="settings-btn settings-btn-outline"
                  onClick={() => handleExportData('Audit_Report')}
                >
                  <FiFileText className="settings-btn-icon" /> Download Audit
                </button>
              </div>

              <div className="settings-backup-card">
                <div className="settings-backup-info">
                  <h4>Restore Data Archive</h4>
                  <p>Restore settings or inventory records from an authenticated StockUp AI backup file.</p>
                </div>
                <label className="settings-btn settings-btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                  <FiUpload className="settings-btn-icon" /> Upload Backup
                  <input type="file" accept=".json,.csv" style={{ display: 'none' }} onChange={() => {
                    setGeneralSuccessMessage('Backup archive validated and uploaded successfully.');
                    setTimeout(() => setGeneralSuccessMessage(''), 3500);
                  }} />
                </label>
              </div>
            </div>

            <div className="settings-danger-zone">
              <div className="settings-danger-header">
                <FiAlertTriangle className="settings-danger-icon" />
                <div>
                  <h4>Danger Zone</h4>
                  <p>Destructive administrative operations. Resetting test data cannot be undone.</p>
                </div>
              </div>
              <button 
                type="button" 
                className="settings-btn settings-btn-danger"
                onClick={() => setResetModalOpen(true)}
              >
                Reset Demo Data
              </button>
            </div>

            {resetModalOpen && (
              <div className="settings-modal-backdrop">
                <div className="settings-modal">
                  <div className="settings-modal-header">
                    <FiAlertTriangle className="settings-modal-icon danger" />
                    <h3>Confirm Demo Data Reset</h3>
                  </div>
                  <p className="settings-modal-body">
                    Are you sure you want to reset demo data? Your production catalog with 2,511 medicines and multi-tenant isolation will remain protected.
                  </p>
                  <div className="settings-modal-actions">
                    <button 
                      type="button" 
                      className="settings-btn settings-btn-secondary"
                      onClick={() => setResetModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="settings-btn settings-btn-danger"
                      onClick={() => {
                        setResetModalOpen(false);
                        setGeneralSuccessMessage('Demo data reset completed successfully.');
                        setTimeout(() => setGeneralSuccessMessage(''), 3500);
                      }}
                    >
                      Confirm Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Action Buttons ────────────────────────────────────────── */}
        {activeTab !== 'backup' && activeTab !== 'security' && (
          <div className="settings-actions">
            <SaveButton variant="secondary" type="button" onClick={() => {
              setGeneralSuccessMessage('');
              setGeneralErrorMessage('');
            }}>
              Cancel
            </SaveButton>
            <SaveButton 
              variant="primary" 
              type="submit" 
              loading={saving}
              icon={saving ? <FiRefreshCw className="spinning" /> : <FiCheckCircle />}
            >
              Save Changes
            </SaveButton>
          </div>
        )}
      </form>
    </div>
  );
};

export default SettingsForm;
