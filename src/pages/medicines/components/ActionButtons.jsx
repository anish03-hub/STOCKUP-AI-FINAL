import React from 'react';

const ActionButtons = () => {
  return (
    <div className="action-buttons">
      <button className="action-btn action-view" title="View">👁️</button>
      <button className="action-btn action-edit" title="Edit">✏️</button>
      <button className="action-btn action-delete" title="Delete">🗑️</button>
    </div>
  );
};

export default ActionButtons;
