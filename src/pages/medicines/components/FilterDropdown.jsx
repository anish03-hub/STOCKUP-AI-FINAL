import React from 'react';

const FilterDropdown = ({ options, placeholder, value, onChange }) => {
  return (
    <div className="filter-dropdown">
      <select value={value} onChange={onChange}>
        <option value="">{placeholder}</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

export default FilterDropdown;
