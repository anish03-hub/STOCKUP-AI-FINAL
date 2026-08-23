import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiLock } from 'react-icons/fi';
import { RiHospitalLine } from 'react-icons/ri';
import AuthInput from '../../components/auth/AuthInput';
import { authApi } from '../../services/api';
import '../../styles/auth/auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      // Try real Spring Boot auth
      const data = await authApi.login(formData.username, formData.password);
      // authApi.login already stores token + user in localStorage
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // If backend is completely unreachable, offer offline/demo mode
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setServerError(
          'Backend server is not running. Starting in demo mode...'
        );
        // Fallback: demo mode (store mock user so routes work)
        setTimeout(() => {
          localStorage.setItem(
            'stockup_user',
            JSON.stringify({ fullName: 'Dr. Admin (Demo)', role: 'Administrator', email: formData.username })
          );
          navigate('/dashboard', { replace: true });
        }, 1500);
      } else {
        setServerError(err.message || 'Login failed. Please check your credentials.');
      }
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
        <div className="auth-card">
          <div className="auth-logo">
            <RiHospitalLine />
            <span>StockUp AI</span>
          </div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Intelligent Medicine Forecasting</p>
          
          {serverError && (
            <div style={{
              padding: '10px 14px',
              marginBottom: '16px',
              borderRadius: '8px',
              fontSize: '13px',
              background: serverError.includes('demo mode') ? '#fef3cd' : '#fde8e8',
              color: serverError.includes('demo mode') ? '#856404' : '#c53030',
              border: `1px solid ${serverError.includes('demo mode') ? '#ffc107' : '#fc8181'}`,
            }}>
              {serverError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <AuthInput
              label="Username or Email"
              id="username"
              name="username"
              icon={FiUser}
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
            />
            
            <AuthInput
              label="Password"
              id="password"
              name="password"
              type="password"
              icon={FiLock}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />
            
            <div className="auth-options">
              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                Remember me
              </label>
              <button 
                type="button" 
                className="auth-link"
                onClick={() => navigate('/auth/forgot-password')}
              >
                Forgot Password?
              </button>
            </div>
            
            <button 
              type="submit" 
              className="auth-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="auth-footer">
            Don't have an account? <Link to="/register" className="auth-link">Create Account</Link>
          </div>
          <div className="auth-footer auth-support-footer">
            Need help? <Link to="/support" className="auth-link">Contact IT Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
