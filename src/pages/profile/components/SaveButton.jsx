import React from 'react';

const SaveButton = ({ 
  variant = 'primary', 
  children, 
  onClick, 
  type = 'button',
  disabled = false,
  loading = false,
  icon = null
}) => {
  const className = `settings-btn settings-btn-${variant}`;
  return (
    <button 
      type={type} 
      className={className} 
      onClick={onClick}
      disabled={disabled || loading}
    >
      {icon && <span className="settings-btn-icon">{icon}</span>}
      <span>{loading ? 'Saving...' : children}</span>
    </button>
  );
};

export default SaveButton;
