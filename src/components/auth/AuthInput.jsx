import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import '../../styles/auth/auth.css';

const AuthInput = ({
  label,
  icon: Icon,
  type = 'text',
  id,
  error,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="auth-input-group">
      {label && <label htmlFor={id} className="auth-label">{label}</label>}
      <div className="auth-input-wrapper">
        {Icon && <Icon className="auth-input-icon" />}
        <input
          id={id}
          type={inputType}
          className={`auth-input ${error ? 'error' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-toggle-password"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex="-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </div>
      {error && <span className="auth-error-text">{error}</span>}
    </div>
  );
};

export default AuthInput;
