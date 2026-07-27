import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiCheckCircle } from 'react-icons/fi';
import { RiHospitalLine } from 'react-icons/ri';
import AuthInput from '../../components/auth/AuthInput';
import PasswordStrength from '../../components/auth/PasswordStrength';
import '../../styles/auth/auth.css';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      // Simulate API call
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
      }, 1000);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-right" style={{ flex: 'none', margin: '0 auto', width: '100%' }}>
        <div className="auth-card">
          <div className="auth-logo">
            <RiHospitalLine />
            <span>StockUp AI</span>
          </div>
          
          {!isSuccess ? (
            <>
              <h2 className="auth-title">Change Password</h2>
              <p className="auth-subtitle">Please create a new secure password for your account.</p>
              
              <form className="auth-form" onSubmit={handleSubmit}>
                <AuthInput
                  label="Current Password"
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  icon={FiLock}
                  placeholder="Enter current password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  error={errors.currentPassword}
                />
                
                <div>
                  <AuthInput
                    label="New Password"
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    icon={FiLock}
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    error={errors.newPassword}
                  />
                  <PasswordStrength password={formData.newPassword} />
                </div>
                
                <AuthInput
                  label="Confirm New Password"
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  icon={FiLock}
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                />
                
                <button 
                  type="submit" 
                  className="auth-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          ) : (
            <div className="success-message">
              <div className="success-icon">
                <FiCheckCircle />
              </div>
              <h3>Password Updated!</h3>
              <p>Your password has been successfully changed.</p>
              <button 
                className="auth-btn"
                onClick={() => navigate('/dashboard')}
                style={{ marginTop: '1rem' }}
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
