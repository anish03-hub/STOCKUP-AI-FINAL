import React from 'react';

const ToggleSwitch = ({ checked, onChange, title, description, id }) => {
  const switchId = id || (title ? `switch-${title.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="settings-toggle-row">
      <div className="settings-toggle-info">
        <label htmlFor={switchId} className="settings-toggle-title">{title}</label>
        {description && <span className="settings-toggle-desc">{description}</span>}
      </div>
      <label className="settings-switch" htmlFor={switchId}>
        <input 
          id={switchId}
          type="checkbox" 
          checked={checked} 
          onChange={onChange} 
          aria-label={title}
        />
        <span className="settings-slider"></span>
      </label>
    </div>
  );
};

export default ToggleSwitch;
