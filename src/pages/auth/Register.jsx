import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBriefcase, FiGlobe, FiLock, FiMail, FiMapPin, FiPhone, FiTag, FiUser } from 'react-icons/fi';
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
  businessName: '',
  businessType: 'Hospital Pharmacy',
  address: '',
  city: '',
  state: '',
  country: 'India',
  pincode: '',
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
    else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) nextErrors.email = 'Enter a valid email address';

    if (!formData.phone.trim()) nextErrors.phone = 'Phone number is required';
    else if (!/^\d{10,15}$/.test(formData.phone.trim())) nextErrors.phone = 'Phone number must be 10 to 15 digits';

    if (!formData.password) nextErrors.password = 'Password is required';
    else if (formData.password.length < 8) nextErrors.password = 'Password must be at least 8 characters long';

    if (!formData.businessName.trim()) nextErrors.businessName = 'Business name is required';
    else if (formData.businessName.trim().length > 100) nextErrors.businessName = 'Business name must not exceed 100 characters';

    if (!formData.businessType.trim()) nextErrors.businessType = 'Business type is required';

    if (!formData.address.trim()) nextErrors.address = 'Address is required';
    else if (formData.address.trim().length > 200) nextErrors.address = 'Address must not exceed 200 characters';

    if (!formData.city.trim()) nextErrors.city = 'City is required';
    else if (formData.city.trim().length > 50) nextErrors.city = 'City must not exceed 50 characters';

    if (!formData.state.trim()) nextErrors.state = 'State is required';
    else if (formData.state.trim().length > 50) nextErrors.state = 'State must not exceed 50 characters';

    if (!formData.country.trim()) nextErrors.country = 'Country is required';
    else if (formData.country.trim().length > 50) nextErrors.country = 'Country must not exceed 50 characters';

    if (!formData.pincode.trim()) nextErrors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(formData.pincode.trim())) nextErrors.pincode = 'Pincode must be exactly 6 digits';

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
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        businessName: formData.businessName.trim(),
        ownerName: formData.fullName.trim(),
        businessType: formData.businessType.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        pincode: formData.pincode.trim(),
      });
      setIsSuccess(true);
      window.setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setServerError('Unable to reach the server. Please try again shortly.');
      } else if (/email already in use/i.test(error.message) || /business with this email/i.test(error.message)) {
        setServerError('An account or business with this email already exists. Please sign in instead.');
      } else if (/phone number already in use/i.test(error.message) || /business with this phone/i.test(error.message)) {
        setServerError('An account or business with this phone number already exists.');
      } else {
        setServerError(error.message || 'We could not create your account. Please review your details and try again.');
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
            <p>Empowering hospitals and pharmacies with intelligent demand forecasting, stock-out prevention, and automated reorders.</p>
          </div>
        </div>
      </div>

      <div className="auth-right register-right">
        <div className="auth-card register-card">
          <div className="auth-logo"><RiHospitalLine /><span>StockUp AI</span></div>
          <h2 className="auth-title">Create Business Account</h2>
          <p className="auth-subtitle">Register your business and set up administrator access</p>

          {isSuccess ? (
            <div className="success-message" role="status">
              <div className="success-icon">✓</div>
              <h3>Account created successfully</h3>
              <p>Your business and administrator profile have been registered. Redirecting to login…</p>
            </div>
          ) : (
            <>
              {serverError && <div className="auth-server-error" role="alert">{serverError}</div>}
              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-section-divider">Account Details</div>

                <AuthInput
                  label="Full Name"
                  id="fullName"
                  name="fullName"
                  icon={FiUser}
                  placeholder="Enter administrator full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  error={errors.fullName}
                  autoComplete="name"
                />

                <AuthInput
                  label="Email Address"
                  id="email"
                  name="email"
                  type="email"
                  icon={FiMail}
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  autoComplete="email"
                />

                <AuthInput
                  label="Phone Number"
                  id="phone"
                  name="phone"
                  type="tel"
                  icon={FiPhone}
                  placeholder="Enter 10 to 15 digit phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  autoComplete="tel"
                  inputMode="numeric"
                />

                <div>
                  <AuthInput
                    label="Password"
                    id="password"
                    name="password"
                    type="password"
                    icon={FiLock}
                    placeholder="Create a strong password (min. 8 characters)"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    autoComplete="new-password"
                  />
                  <PasswordStrength password={formData.password} />
                </div>

                <div className="auth-section-divider">Business Details</div>

                <AuthInput
                  label="Business / Pharmacy Name"
                  id="businessName"
                  name="businessName"
                  icon={FiBriefcase}
                  placeholder="e.g., City Central Hospital Pharmacy"
                  value={formData.businessName}
                  onChange={handleChange}
                  error={errors.businessName}
                />

                <div className="auth-input-group">
                  <label htmlFor="businessType" className="auth-label">Business Type</label>
                  <div className="auth-input-wrapper">
                    <FiTag className="auth-input-icon" />
                    <select
                      id="businessType"
                      name="businessType"
                      className={`auth-input ${errors.businessType ? 'error' : ''}`}
                      value={formData.businessType}
                      onChange={handleChange}
                    >
                      <option value="Hospital Pharmacy">Hospital Pharmacy</option>
                      <option value="Retail Pharmacy">Retail Pharmacy</option>
                      <option value="Wholesale Pharmacy">Wholesale Pharmacy</option>
                      <option value="Clinic">Clinic</option>
                      <option value="Health Center">Health Center</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {errors.businessType && <span className="auth-error-text">{errors.businessType}</span>}
                </div>

                <AuthInput
                  label="Business Address"
                  id="address"
                  name="address"
                  icon={FiMapPin}
                  placeholder="Street address, building, suite"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                />

                <div className="auth-grid-2col">
                  <AuthInput
                    label="City"
                    id="city"
                    name="city"
                    icon={FiMapPin}
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                    error={errors.city}
                  />

                  <AuthInput
                    label="State / Province"
                    id="state"
                    name="state"
                    icon={FiMapPin}
                    placeholder="State"
                    value={formData.state}
                    onChange={handleChange}
                    error={errors.state}
                  />
                </div>

                <div className="auth-grid-2col">
                  <AuthInput
                    label="Country"
                    id="country"
                    name="country"
                    icon={FiGlobe}
                    placeholder="Country"
                    value={formData.country}
                    onChange={handleChange}
                    error={errors.country}
                  />

                  <AuthInput
                    label="Pincode / ZIP"
                    id="pincode"
                    name="pincode"
                    icon={FiMapPin}
                    placeholder="6-digit pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    error={errors.pincode}
                    inputMode="numeric"
                  />
                </div>

                <button type="submit" className="auth-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Business Account…' : 'Create Business Account'}
                </button>
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
