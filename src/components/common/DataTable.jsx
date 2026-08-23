import React, { useEffect, useMemo, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiLoader, FiMoreVertical, FiSearch, FiInbox } from 'react-icons/fi';
import '../../styles/common/data-table.css';

const getValue = (row, accessor) => {
  if (!accessor) return '';
  const keys = accessor.split('.');
  let value = row;

  for (const key of keys) {
    if (value == null) return '';
    value = value[key];
  }

  return value ?? '';
};

const resolveText = (row, column) => {
  if (column.render) {
    return column.render(row);
  }

  const value = getValue(row, column.accessor || column.key);

  if (column.type === 'currency') {
    return typeof value === 'number' ? `₹${value.toFixed(2)}` : value;
  }

  if (column.type === 'date') {
    return value ? new Date(value).toLocaleDateString() : '—';
  }

  return value ?? '—';
};

const getStatusClass = (status, statusMap = {}) => {
  const normalized = String(status || '').toLowerCase();
  const mapped = statusMap[normalized] || statusMap[String(status)] || '';

  if (mapped) {
    return `status-badge status-${mapped}`;
  }

  if (['active', 'in stock', 'completed', 'healthy'].includes(normalized)) return 'status-badge status-success';
  if (['pending', 'low stock', 'warning', 'review'].includes(normalized)) return 'status-badge status-warning';
  if (['inactive', 'expired', 'rejected', 'out of stock', 'critical'].includes(normalized)) return 'status-badge status-danger';

  return 'status-badge';
};

const DataTable = ({
  data = [],
  columns = [],
  title,
  subtitle,
  searchPlaceholder = 'Search records...',
  searchable = true,
  filters = [],
  loading = false,
  emptyMessage = 'No records found.',
  emptyIcon = <FiInbox />,
  pageSize = 8,
  pagination = true,
  stickyHeader = true,
  actions = [],
  rowKey = 'id',
  statusMap = {},
  className = '',
  toolbarContent,
  showToolbar = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState(null);
  const [activeFilters, setActiveFilters] = useState(() => Object.fromEntries(filters.map((filter) => [filter.key, filter.defaultValue ?? 'all'])));
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    const nextFilters = Object.fromEntries(filters.map((filter) => [filter.key, filter.defaultValue ?? 'all']));
    setActiveFilters((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(nextFilters)) {
        setCurrentPage(1);
        return nextFilters;
      }
      return prev;
    });
  }, [filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilters]);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchable && searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) =>
        columns.some((column) => {
          const value = resolveText(row, column);
          return String(value).toLowerCase().includes(term);
        })
      );
    }

    filters.forEach((filter) => {
      const selectedValue = activeFilters[filter.key];
      if (selectedValue && selectedValue !== 'all' && selectedValue !== 'All') {
        result = result.filter((row) => {
          const value = getValue(row, filter.accessor || filter.key);
          return String(value).toLowerCase() === String(selectedValue).toLowerCase();
        });
      }
    });

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aValue = getValue(a, sortConfig.key);
        const bValue = getValue(b, sortConfig.key);

        if (aValue == null || bValue == null) return 0;

        const aNum = Number(aValue);
        const bNum = Number(bValue);
        const isNumeric = !Number.isNaN(aNum) && !Number.isNaN(bNum);

        if (isNumeric) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        const left = String(aValue).toLowerCase();
        const right = String(bValue).toLowerCase();
        return sortConfig.direction === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
      });
    }

    return result;
  }, [activeFilters, columns, data, filters, searchTerm, searchable, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    const start = (safePage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, pageSize, pagination, safePage]);

  const handleSort = (column) => {
    if (!column.sortable) return;
    setSortConfig((current) => {
      if (current?.key === column.key) {
        return current.direction === 'asc' ? { key: column.key, direction: 'desc' } : null;
      }
      return { key: column.key, direction: 'asc' };
    });
  };

  const handleFilterChange = (key, value) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  };

  const renderCell = (row, column, rowIndex) => {
    if (column.type === 'status') {
      const value = getValue(row, column.accessor || column.key);
      return <span className={getStatusClass(value, statusMap)}>{value || '—'}</span>;
    }

    if (column.type === 'actions') {
      const rowKeyValue = row[rowKey] ?? `${rowIndex}`;
      return (
        <div className="data-table-row-actions">
          <div className="data-table-menu-wrapper">
            <button
              className="data-table-action-btn"
              onClick={() => setOpenMenu((current) => (current === rowKeyValue ? null : rowKeyValue))}
              title="More actions"
            >
              <FiMoreVertical />
            </button>
            {openMenu === rowKeyValue && (
              <div className="data-table-menu">
                {actions.map((action) => (
                  <button
                    key={action.label}
                    className="data-table-menu-item"
                    onClick={() => {
                      action.onClick(row);
                      setOpenMenu(null);
                    }}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return <span className="data-table-cell-text">{resolveText(row, column)}</span>;
  };

  const renderEmptyState = () => (
    <div className="data-table-empty-state">
      <div className="data-table-empty-icon">{emptyIcon}</div>
      <h4>No records available</h4>
      <p>{emptyMessage}</p>
    </div>
  );

  return (
    <section className={`enterprise-data-table-card ${className}`.trim()}>
      {showToolbar && (
        <div className="enterprise-data-table-toolbar">
          <div>
            {title && <h3 className="enterprise-data-table-title">{title}</h3>}
            {subtitle && <p className="enterprise-data-table-subtitle">{subtitle}</p>}
          </div>

          <div className="enterprise-data-table-controls">
            {searchable && (
              <label className="enterprise-data-table-search">
                <FiSearch />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={searchPlaceholder}
                />
              </label>
            )}

            {filters.map((filter) => (
              <label key={filter.key} className="enterprise-data-table-filter">
                <span>{filter.label}</span>
                <select
                  value={activeFilters[filter.key] ?? 'all'}
                  onChange={(event) => handleFilterChange(filter.key, event.target.value)}
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}

            {toolbarContent}
          </div>
        </div>
      )}

      <div className="enterprise-data-table-scroll">
        {loading ? (
          <div className="data-table-loading-state">
            <FiLoader className="data-table-spinner" />
            <p>Loading records...</p>
          </div>
        ) : filteredData.length === 0 ? (
          renderEmptyState()
        ) : (
          <table className={`enterprise-data-table ${stickyHeader ? 'sticky-header' : ''}`}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={column.sortable ? 'sortable' : ''}>
                    <div className="data-table-th-inner" onClick={() => handleSort(column)}>
                      <span>{column.title}</span>
                      {column.sortable && (
                        <span className="data-table-sort-indicator">
                          {sortConfig?.key === column.key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, rowIndex) => (
                <tr key={row[rowKey] ?? `${rowIndex}-${rowIndex}`}>
                  {columns.map((column) => (
                    <td key={column.key}>{renderCell(row, column, rowIndex)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination && filteredData.length > pageSize && (
        <div className="enterprise-data-table-pagination">
          <button
            className="data-table-page-btn"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={safePage === 1}
          >
            <FiChevronLeft />
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              className={`data-table-page-btn ${page === safePage ? 'active' : ''}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="data-table-page-btn"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={safePage === totalPages}
          >
            <FiChevronRight />
          </button>
        </div>
      )}
    </section>
  );
};

export default DataTable;
