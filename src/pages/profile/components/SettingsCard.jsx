import React from 'react';

const SettingsCard = ({ title, description, icon, onClick }) => {
  return (
    <div className="settings-card" onClick={onClick}>
      <div className="settings-card-icon">{icon}</div>
      <h3 className="settings-card-title">{title}</h3>
      <p className="settings-card-desc">{description}</p>
    </div>
  );
};

export default SettingsCard;
