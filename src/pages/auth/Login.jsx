import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiTag, FiPhone, FiMapPin, FiLock, FiArrowLeft, FiMail } from 'react-icons/fi';
import { RiHospitalLine } from 'react-icons/ri';
import AuthInput from '../../components/auth/AuthInput';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import StockUpSupportBot from '../../components/support/StockUpSupportBot';
import { authApi } from '../../services/api';
import '../../styles/auth/auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState('choose'); // 'choose' | 'email'
  
  // Email/Password Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google OAuth state for modals
  const [pendingCredential, setPendingCredential] = useState(null);

  // Link Account Modal State (for existing legacy email accounts)
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linkError, setLinkError] = useState('');

  // New Business Setup Modal State
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [googleUserData, setGoogleUserData] = useState({ email: '', name: '' });
  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    businessType: 'Hospital Pharmacy',
    phone: '',
    address: ''
  });
  const [businessError, setBusinessError] = useState('');

  // Validate Email / Password before API call
  const validateForm = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email || !email.trim()) {
      setEmailError('Please enter your email.');
      valid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError('Please enter a valid email address.');
        valid = false;
      }
    }

    if (!password) {
      setPasswordError('Please enter your password.');
      valid = false;
    }

    return valid;
  };

  // Submit Email + Password Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setServerError('');
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.login(email.trim(), password);
      localStorage.setItem('stockup_returning_user', 'true');
      navigate('/dashboard', { replace: true });
    } catch (_err) {
      setServerError('Invalid email or password.');
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
        localStorage.setItem('stockup_returning_user', 'true');
        navigate('/dashboard', { replace: true });
      } else if (res.status === 'LINK_REQUIRED') {
        setPendingCredential(credential);
        setLinkEmail(res.email || '');
        setLinkError('');
        setShowLinkModal(true);
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
      setServerError(err.message || 'Google authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Password for Account Linking (Legacy Accounts)
  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!linkPassword) {
      setLinkError('Password is required to link accounts.');
      return;
    }

    setIsSubmitting(true);
    setLinkError('');

    try {
      const res = await authApi.googleAuth({
        credential: pendingCredential,
        password: linkPassword,
      });

      if (res.status === 'SUCCESS') {
        localStorage.setItem('stockup_returning_user', 'true');
        setShowLinkModal(false);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setLinkError(err.message || 'Linking failed. Invalid password.');
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
        localStorage.setItem('stockup_returning_user', 'true');
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
        <div className="auth-card" style={{ maxWidth: '440px', width: '100%' }}>
          <div className="auth-logo">
            <RiHospitalLine />
            <span>StockUp AI</span>
          </div>

          {authMode === 'choose' ? (
            <>
              <h2 className="auth-title">Welcome to StockUp AI</h2>
              <p className="auth-subtitle">Intelligent Medicine Forecasting & Inventory Management</p>
              
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

              {/* Primary Google Sign-In Call to Action */}
              <div style={{ marginTop: '24px', marginBottom: '20px' }}>
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
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary, #0f172a)', marginBottom: '8px' }}>
                  Already have an account?
                </div>
                <button
                  type="button"
                  className="auth-btn"
                  onClick={() => {
                    setAuthMode('email');
                    setServerError('');
                    setEmailError('');
                    setPasswordError('');
                  }}
                  style={{
                    background: 'var(--surface-muted, #f1f5f9)',
                    color: 'var(--text-primary, #0f172a)',
                    border: '1px solid var(--border-color, #cbd5e1)'
                  }}
                >
                  Login
                </button>
              </div>

              <p style={{
                fontSize: '0.825rem',
                color: 'var(--text-secondary, #64748b)',
                textAlign: 'center',
                lineHeight: '1.5',
                marginBottom: '24px'
              }}>
                New to StockUp AI? Continue with Google to set up your pharmacy or hospital account.
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('choose');
                  setServerError('');
                  setEmailError('');
                  setPasswordError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  padding: 0
                }}
              >
                <FiArrowLeft size={16} /> Back
              </button>

              <h2 className="auth-title">Welcome back to StockUp AI</h2>
              <p className="auth-subtitle">Sign in to continue to your pharmacy or hospital account.</p>

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

              <form onSubmit={handleEmailLogin}>
                <AuthInput
                  label="Email"
                  id="email"
                  name="email"
                  type="email"
                  icon={FiMail}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  error={emailError}
                />

                <AuthInput
                  label="Password"
                  id="password"
                  name="password"
                  type="password"
                  icon={FiLock}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  error={passwordError}
                />

                <div style={{ marginTop: '20px' }}>
                  <button type="submit" className="auth-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing in...' : 'Login'}
                  </button>
                </div>
              </form>

              <div style={{
                marginTop: '20px',
                textAlign: 'center',
                fontSize: '0.85rem',
                color: 'var(--text-secondary, #64748b)',
                marginBottom: '16px'
              }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('choose');
                    setServerError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  Continue with Google
                </button>
              </div>
            </>
          )}

        </div>
      </div>


      {/* Account Linking Modal (For legacy email account holders) */}
      {showLinkModal && (
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
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color, #e2e8f0)',
            color: 'var(--text-primary, #0f172a)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>
              Link Google Account
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #475569)', marginBottom: '16px', lineHeight: '1.5' }}>
              An existing StockUp AI account was found for <strong>{linkEmail}</strong>. To link your Google account, please enter your existing password.
            </p>

            {linkError && (
              <div style={{
                padding: '10px 14px',
                marginBottom: '16px',
                borderRadius: '8px',
                fontSize: '13px',
                background: '#fde8e8',
                color: '#c53030',
                border: '1px solid #fc8181',
              }}>
                {linkError}
              </div>
            )}

            <form onSubmit={handleLinkSubmit}>
              <AuthInput
                label="Existing Password"
                id="linkPassword"
                name="linkPassword"
                type="password"
                icon={FiLock}
                placeholder="Enter your existing StockUp AI password"
                value={linkPassword}
                onChange={(e) => setLinkPassword(e.target.value)}
              />

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="auth-btn"
                  onClick={() => setShowLinkModal(false)}
                  style={{ background: 'var(--surface-muted, #f1f5f9)', color: 'var(--text-primary, #0f172a)', border: '1px solid var(--border-color, #cbd5e1)' }}
                >
                  Cancel
                </button>
                <button type="submit" className="auth-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Linking...' : 'Link Google Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
      {/* Floating StockUp AI Support Assistant Chatbot */}
      <StockUpSupportBot onNavigateToLogin={() => setAuthMode('email')} />
    </div>
  );
};

export default Login;
