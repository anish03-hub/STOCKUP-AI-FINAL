import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { RiHospitalLine } from 'react-icons/ri';
import AuthInput from '../../components/auth/AuthInput';
import '../../styles/auth/auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email address is invalid');
      return false;
    }
    setError('');
    return true;
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
              <h2 className="auth-title">Reset Password</h2>
              <p className="auth-subtitle">Enter your email address and we'll send you a link to reset your password.</p>
              
              <form className="auth-form" onSubmit={handleSubmit}>
                <AuthInput
                  label="Email Address"
                  id="email"
                  name="email"
                  type="email"
                  icon={FiMail}
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  error={error}
                />
                
                <button 
                  type="submit" 
                  className="auth-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="success-message">
              <div className="success-icon">
                <FiCheckCircle />
              </div>
              <h3>Check your email</h3>
              <p>We've sent a password reset link to<br/><strong>{email}</strong></p>
            </div>
          )}
          
          <div className="auth-footer" style={{ marginTop: '2rem' }}>
            <button 
              className="auth-link" 
              onClick={() => navigate('/auth/login')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '0.5rem' }}
            >
              <FiArrowLeft /> Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
