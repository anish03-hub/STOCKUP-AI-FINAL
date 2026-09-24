import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBriefcase, FiTag, FiPhone, FiMapPin } from 'react-icons/fi';
import { RiHospitalLine } from 'react-icons/ri';
import AuthInput from '../../components/auth/AuthInput';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import { authApi } from '../../services/api';
import '../../styles/auth/auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Mode: 'choose' (Google primary + Email option) | 'email' (Email+Password Form)
  const [regMode, setRegMode] = useState('choose');

  // Email Registration Form State
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessType: 'Hospital Pharmacy',
  });
  const [regErrors, setRegErrors] = useState({});

  // Google OAuth state for onboarding modal
  const [pendingCredential, setPendingCredential] = useState(null);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [googleUserData, setGoogleUserData] = useState({ email: '', name: '' });
  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    businessType: 'Hospital Pharmacy',
    phone: '',
    address: ''
  });
  const [businessError, setBusinessError] = useState('');

  // Validate Email Registration Form
  const validateRegForm = () => {
    const errs = {};
    if (!regForm.email || !regForm.email.trim()) {
      errs.email = 'Company email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!regForm.phone || !regForm.phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else if (!/^\+?\d{10,15}$/.test(regForm.phone.trim())) {
      errs.phone = 'Phone number must be between 10 and 15 digits.';
    }

    if (!regForm.password || regForm.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }

    if (regForm.password !== regForm.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (!regForm.businessName || !regForm.businessName.trim()) {
      errs.businessName = 'Pharmacy / Business Name is required.';
    }

    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Email + Password Registration
  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setServerError('');
    setRegSuccessMsg('');

    if (!validateRegForm()) return;

    setIsSubmitting(true);
    try {
      await authApi.register({
        fullName: regForm.fullName.trim() || regForm.businessName.trim(),
        email: regForm.email.trim(),
        phone: regForm.phone.trim(),
        password: regForm.password,
        confirmPassword: regForm.confirmPassword,
        businessName: regForm.businessName.trim(),
        businessType: regForm.businessType,
      });

      setRegSuccessMsg('Account created successfully! Please sign in with your credentials.');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      setServerError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google OAuth response
  const handleGoogleSuccess = async (credential) => {
    setIsSubmitting(true);
    setServerError('');

    try {
      const res = await authApi.googleAuth({ credential });
      if (res.status === 'SUCCESS') {
        navigate('/dashboard', { replace: true });
      } else if (res.status === 'BUSINESS_REQUIRED') {
        setPendingCredential(credential);
        setGoogleUserData({ email: res.email || '', name: res.name || '' });
        setBusinessForm({
          businessName: '',
          businessType: 'Hospital Pharmacy',
          phone: '',
          address: ''
        });
        setBusinessError('');
        setShowBusinessModal(true);
      }
    } catch (err) {
      setServerError(err.message || 'Google registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Business Setup for New Google User
  const handleBusinessSubmit = async (e) => {
    e.preventDefault();
    if (!businessForm.businessName.trim()) {
      setBusinessError('Pharmacy / Business Name is required.');
      return;
    }

    setIsSubmitting(true);
    setBusinessError('');

    try {
      const res = await authApi.googleAuth({
        credential: pendingCredential,
        businessName: businessForm.businessName.trim(),
        businessType: businessForm.businessType,
        phone: businessForm.phone.trim(),
        address: businessForm.address.trim(),
      });

      if (res.status === 'SUCCESS') {
        setShowBusinessModal(false);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setBusinessError(err.message || 'Failed to create business account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="auth-illustration">
          <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="transparent"/>
            <path d="M50 250 L350 250 M100 250 L100 100 L180 100 L180 250 M220 250 L220 150 L300 150 L300 250" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M125 150 L155 150 M140 135 L140 165 M245 200 L275 200 M260 185 L260 215" stroke="white" strokeWidth="8" strokeLinecap="round"/>
            <circle cx="200" cy="80" r="40" stroke="white" strokeWidth="12" fill="none"/>
            <path d="M185 80 L215 80 M200 65 L200 95" stroke="white" strokeWidth="8" strokeLinecap="round"/>
          </svg>
          <div className="auth-branding">
            <h1>StockUp AI</h1>
            <p>Empowering hospitals with intelligent medicine demand forecasting and precise inventory management.</p>
          </div>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-card" style={{ maxWidth: '460px', width: '100%' }}>
          <div className="auth-logo">
            <RiHospitalLine />
            <span>StockUp AI</span>
          </div>

          <h2 className="auth-title">Create Your Account</h2>
          <p className="auth-subtitle">Register your pharmacy or hospital business</p>
          
          {serverError && (
            <div style={{
              padding: '10px 14px',
              marginBottom: '16px',
              borderRadius: '8px',
              fontSize: '13px',
              background: '#fde8e8',
              color: '#c53030',
              border: '1px solid #fc8181',
            }}>
              {serverError}
            </div>
          )}

          {regSuccessMsg && (
            <div style={{
              padding: '10px 14px',
              marginBottom: '16px',
              borderRadius: '8px',
              fontSize: '13px',
              background: '#dcfce7',
              color: '#15803d',
              border: '1px solid #86efac',
            }}>
              {regSuccessMsg}
            </div>
          )}

          {regMode === 'choose' ? (
            <>
              {/* Primary Google Registration Call to Action */}
              <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  onError={(msg) => setServerError(msg)}
                  disabled={isSubmitting}
                  text="Continue with Google"
                />
              </div>

              {/* Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '20px 0',
                color: 'var(--text-muted, #94a3b8)',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #e2e8f0)' }} />
                <span style={{ padding: '0 12px', letterSpacing: '1px' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #e2e8f0)' }} />
              </div>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <button
                  type="button"
                  className="auth-btn"
                  onClick={() => setRegMode('email')}
                  style={{
                    background: 'var(--surface-muted, #f1f5f9)',
                    color: 'var(--text-primary, #0f172a)',
                    border: '1px solid var(--border-color, #cbd5e1)'
                  }}
                >
                  Register with Email & Password
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleEmailRegister} style={{ marginTop: '16px' }}>
              <AuthInput
                label="Full Name"
                id="fullName"
                name="fullName"
                placeholder="e.g. Dr. Anish Sah"
                value={regForm.fullName}
                onChange={(e) => setRegForm(prev => ({ ...prev, fullName: e.target.value }))}
              />

              <AuthInput
                label="Company / Work Email *"
                id="regEmail"
                name="regEmail"
                type="email"
                placeholder="e.g. contact@mypharmacy.com"
                value={regForm.email}
                onChange={(e) => setRegForm(prev => ({ ...prev, email: e.target.value }))}
                error={regErrors.email}
                required
              />

              <AuthInput
                label="Phone Number *"
                id="regPhone"
                name="regPhone"
                placeholder="e.g. +91 98765 43210"
                value={regForm.phone}
                onChange={(e) => setRegForm(prev => ({ ...prev, phone: e.target.value }))}
                error={regErrors.phone}
                required
              />

              <AuthInput
                label="Password *"
                id="regPassword"
                name="regPassword"
                type="password"
                placeholder="At least 8 characters"
                value={regForm.password}
                onChange={(e) => setRegForm(prev => ({ ...prev, password: e.target.value }))}
                error={regErrors.password}
                required
              />

              <AuthInput
                label="Confirm Password *"
                id="regConfirmPassword"
                name="regConfirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={regForm.confirmPassword}
                onChange={(e) => setRegForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                error={regErrors.confirmPassword}
                required
              />

              <AuthInput
                label="Pharmacy / Business Name *"
                id="regBusinessName"
                name="regBusinessName"
                placeholder="e.g. StockUp Healthcare Pharmacy"
                value={regForm.businessName}
                onChange={(e) => setRegForm(prev => ({ ...prev, businessName: e.target.value }))}
                error={regErrors.businessName}
                required
              />

              <div className="auth-input-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="regBusinessType" className="auth-label">Business Type</label>
                <div className="auth-input-wrapper">
                  <select
                    id="regBusinessType"
                    name="regBusinessType"
                    className="auth-input"
                    value={regForm.businessType}
                    onChange={(e) => setRegForm(prev => ({ ...prev, businessType: e.target.value }))}
                  >
                    <option value="Hospital Pharmacy">Hospital Pharmacy</option>
                    <option value="Retail Pharmacy">Retail Pharmacy</option>
                    <option value="Wholesale Pharmacy">Wholesale Pharmacy</option>
                    <option value="Clinic / Medical Center">Clinic / Medical Center</option>
                    <option value="Health System / Hospital">Health System / Hospital</option>
                    <option value="Pharmaceutical Distributor">Pharmaceutical Distributor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="auth-btn"
                  onClick={() => setRegMode('choose')}
                  style={{ background: 'var(--surface-muted, #f1f5f9)', color: 'var(--text-primary, #0f172a)', border: '1px solid var(--border-color, #cbd5e1)' }}
                >
                  Back
                </button>
                <button type="submit" className="auth-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Account...' : 'Register Account'}
                </button>
              </div>
            </form>
          )}

          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary, #64748b)',
            textAlign: 'center',
            lineHeight: '1.5',
            marginBottom: '24px'
          }}>
            Secure, passwordless authentication. Click <strong>Continue with Google</strong> above to create and manage your StockUp AI organization.
          </p>

          <div className="auth-footer">
            Already have an account? <Link to="/login" className="auth-link">Sign In with Google</Link>
          </div>
          <div className="auth-footer auth-support-footer">
            Need help? <Link to="/support" className="auth-link">Contact IT Support</Link>
          </div>
        </div>
      </div>

      {/* Business Setup Modal for New Google Registration */}
      {showBusinessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface, #ffffff)',
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color, #e2e8f0)',
            color: 'var(--text-primary, #0f172a)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>
              Complete your StockUp setup
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #475569)', marginBottom: '16px', lineHeight: '1.5' }}>
              Welcome! Please provide your Pharmacy or Business Name to complete setting up your organization.
            </p>

            <div style={{
              background: 'var(--surface-muted, #f8fafc)',
              padding: '12px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.85rem'
            }}>
              <div><strong>Google Account:</strong> {googleUserData.email}</div>
              <div><strong>Owner:</strong> {googleUserData.name}</div>
            </div>

            {businessError && (
              <div style={{
                padding: '10px 14px',
                marginBottom: '16px',
                borderRadius: '8px',
                fontSize: '13px',
                background: '#fde8e8',
                color: '#c53030',
                border: '1px solid #fc8181',
              }}>
                {businessError}
              </div>
            )}

            <form onSubmit={handleBusinessSubmit}>
              <AuthInput
                label="Pharmacy / Business Name *"
                id="modalBusinessName"
                name="modalBusinessName"
                icon={FiBriefcase}
                placeholder="e.g. StockUp Pharmacy"
                value={businessForm.businessName}
                onChange={(e) => setBusinessForm(prev => ({ ...prev, businessName: e.target.value }))}
                required
              />

              <div className="auth-input-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="modalBusinessType" className="auth-label">Business Type</label>
                <div className="auth-input-wrapper">
                  <FiTag className="auth-input-icon" />
                  <select
                    id="modalBusinessType"
                    name="modalBusinessType"
                    className="auth-input"
                    value={businessForm.businessType}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, businessType: e.target.value }))}
                  >
                    <option value="Hospital Pharmacy">Hospital Pharmacy</option>
                    <option value="Retail Pharmacy">Retail Pharmacy</option>
                    <option value="Wholesale Pharmacy">Wholesale Pharmacy</option>
                    <option value="Clinic / Medical Center">Clinic / Medical Center</option>
                    <option value="Health System / Hospital">Health System / Hospital</option>
                    <option value="Pharmaceutical Distributor">Pharmaceutical Distributor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <AuthInput
                label="Phone (optional)"
                id="modalPhone"
                name="modalPhone"
                icon={FiPhone}
                placeholder="e.g. +91 98765 43210"
                value={businessForm.phone}
                onChange={(e) => setBusinessForm(prev => ({ ...prev, phone: e.target.value }))}
              />

              <AuthInput
                label="Address (optional)"
                id="modalAddress"
                name="modalAddress"
                icon={FiMapPin}
                placeholder="e.g. 123 Health Ave, Mumbai"
                value={businessForm.address}
                onChange={(e) => setBusinessForm(prev => ({ ...prev, address: e.target.value }))}
              />

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="auth-btn"
                  onClick={() => setShowBusinessModal(false)}
                  style={{ background: 'var(--surface-muted, #f1f5f9)', color: 'var(--text-primary, #0f172a)', border: '1px solid var(--border-color, #cbd5e1)' }}
                >
                  Cancel
                </button>
                <button type="submit" className="auth-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Pharmacy...' : 'Create Pharmacy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
