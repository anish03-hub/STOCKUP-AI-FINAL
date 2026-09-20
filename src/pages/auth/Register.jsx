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
        <div className="auth-card" style={{ maxWidth: '440px', width: '100%' }}>
          <div className="auth-logo">
            <RiHospitalLine />
            <span>StockUp AI</span>
          </div>
          <h2 className="auth-title">Create Your Account</h2>
          <p className="auth-subtitle">Continue with Google to register your pharmacy or hospital business</p>
          
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

          {/* Primary Google Registration Call to Action */}
          <div style={{ marginTop: '24px', marginBottom: '20px' }}>
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={(msg) => setServerError(msg)}
              disabled={isSubmitting}
              text="Continue with Google"
            />
          </div>

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
