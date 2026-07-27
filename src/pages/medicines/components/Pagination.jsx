import React from 'react';

const Pagination = () => {
  return (
    <div className="pagination glass-panel">
      <div style={{color: 'var(--color-text-muted)'}}>
        Showing 1 to 10 of 1,245 entries
      </div>
      <div className="pagination-controls">
        <button className="page-btn">Previous</button>
        <button className="page-btn active">1</button>
        <button className="page-btn">2</button>
        <button className="page-btn">3</button>
        <button className="page-btn">Next</button>
      </div>
    </div>
  );
};

export default Pagination;
