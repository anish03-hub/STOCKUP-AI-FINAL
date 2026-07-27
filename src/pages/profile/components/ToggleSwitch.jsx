import React from 'react';

const ToggleSwitch = ({ checked, onChange, title, description }) => {
  return (
    <div className="toggle-container">
      <div className="toggle-label-wrap">
        <span className="toggle-title">{title}</span>
        {description && <span className="toggle-desc">{description}</span>}
      </div>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="slider"></span>
      </label>
    </div>
  );
};

export default ToggleSwitch;
