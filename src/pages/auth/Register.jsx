import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBriefcase, FiLock, FiMail, FiPhone, FiUser } from 'react-icons/fi';
import { RiHospitalLine } from 'react-icons/ri';
import AuthInput from '../../components/auth/AuthInput';
import PasswordStrength from '../../components/auth/PasswordStrength';
import { authApi } from '../../services/api';
import '../../styles/auth/auth.css';
import '../../styles/auth/register.css';

const initialFormData = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  businessId: '',
};

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
    if (serverError) setServerError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.fullName.trim()) nextErrors.fullName = 'Full name is required';
    else if (formData.fullName.trim().length > 100) nextErrors.fullName = 'Full name must not exceed 100 characters';

    if (!formData.email.trim()) nextErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) nextErrors.email = 'Enter a valid email address';

    if (!formData.phone.trim()) nextErrors.phone = 'Phone number is required';
    else if (!/^\d{10,15}$/.test(formData.phone)) nextErrors.phone = 'Phone number must be 10 to 15 digits';

    if (!formData.password) nextErrors.password = 'Password is required';
    else if (formData.password.length < 8) nextErrors.password = 'Password must be at least 8 characters long';

    if (!formData.businessId.trim()) nextErrors.businessId = 'Business ID is required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      await authApi.register({
        ...formData,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        businessId: formData.businessId.trim(),
      });
      setIsSuccess(true);
      window.setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setServerError('Unable to reach the server. Please try again shortly.');
      } else if (/email already in use/i.test(error.message)) {
        setServerError('An account with this email already exists. Please sign in instead.');
      } else if (/phone number already in use/i.test(error.message)) {
        setServerError('An account with this phone number already exists.');
      } else {
        setServerError('We could not create your account. Please review your details and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="auth-illustration">
          <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="400" height="300" fill="transparent" />
            <path d="M50 250 L350 250 M100 250 L100 100 L180 100 L180 250 M220 250 L220 150 L300 150 L300 250" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M125 150 L155 150 M140 135 L140 165 M245 200 L275 200 M260 185 L260 215" stroke="white" strokeWidth="8" strokeLinecap="round" />
            <circle cx="200" cy="80" r="40" stroke="white" strokeWidth="12" fill="none" />
            <path d="M185 80 L215 80 M200 65 L200 95" stroke="white" strokeWidth="8" strokeLinecap="round" />
          </svg>
          <div className="auth-branding">
            <h1>StockUp AI</h1>
            <p>Empowering hospitals with intelligent medicine demand forecasting and precise inventory management.</p>
          </div>
        </div>
      </div>

      <div className="auth-right register-right">
        <div className="auth-card register-card">
          <div className="auth-logo"><RiHospitalLine /><span>StockUp AI</span></div>
          <h2 className="auth-title">Create Your Account</h2>
          <p className="auth-subtitle">Set up access for your business</p>

          {isSuccess ? (
            <div className="success-message" role="status">
              <div className="success-icon">✓</div>
              <h3>Account created successfully</h3>
              <p>Please sign in. Redirecting you to the login page…</p>
            </div>
          ) : (
            <>
              {serverError && <div className="auth-server-error" role="alert">{serverError}</div>}
              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <AuthInput label="Full Name" id="fullName" name="fullName" icon={FiUser} placeholder="Enter your full name" value={formData.fullName} onChange={handleChange} error={errors.fullName} autoComplete="name" />
                <AuthInput label="Email" id="email" name="email" type="email" icon={FiMail} placeholder="Enter your email" value={formData.email} onChange={handleChange} error={errors.email} autoComplete="email" />
                <AuthInput label="Phone Number" id="phone" name="phone" type="tel" icon={FiPhone} placeholder="Enter 10 to 15 digit phone number" value={formData.phone} onChange={handleChange} error={errors.phone} autoComplete="tel" inputMode="numeric" />
                <div>
                  <AuthInput label="Password" id="password" name="password" type="password" icon={FiLock} placeholder="Create a password" value={formData.password} onChange={handleChange} error={errors.password} autoComplete="new-password" />
                  <PasswordStrength password={formData.password} />
                </div>
                <AuthInput label="Business ID" id="businessId" name="businessId" icon={FiBriefcase} placeholder="Enter your existing business ID" value={formData.businessId} onChange={handleChange} error={errors.businessId} />
                <p className="register-help">Use the Business ID supplied by your StockUp AI administrator.</p>
                <button type="submit" className="auth-btn" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create Account'}</button>
              </form>
              <div className="auth-footer register-footer">
                Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
