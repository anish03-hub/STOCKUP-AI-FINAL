import React from 'react';

const SaveButton = ({ variant = 'primary', children, onClick, type = 'button' }) => {
  // variant: 'primary' (Save), 'secondary' (Cancel), 'danger' (Reset)
  const className = `btn btn-${variant}`;
  return (
    <button type={type} className={className} onClick={onClick}>
      {children}
    </button>
  );
};

export default SaveButton;
