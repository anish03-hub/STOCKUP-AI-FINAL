import React from 'react';
import '../../styles/auth/auth.css';

const PasswordStrength = ({ password }) => {
  const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    
    if (pass.length >= 8) score += 1;
    if (pass.match(/[A-Z]/)) score += 1;
    if (pass.match(/[0-9]/)) score += 1;
    if (pass.match(/[^A-Za-z0-9]/)) score += 1;
    
    return score;
  };

  const strength = calculateStrength(password);
  
  const getStrengthLabel = (score) => {
    switch (score) {
      case 0: return 'Enter password';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  return (
    <div className={`password-strength strength-${strength}`}>
      <div className="password-bars">
        <div className="strength-bar"></div>
        <div className="strength-bar"></div>
        <div className="strength-bar"></div>
        <div className="strength-bar"></div>
      </div>
      <div className="strength-text">
        {getStrengthLabel(strength)}
      </div>
    </div>
  );
};

export default PasswordStrength;
