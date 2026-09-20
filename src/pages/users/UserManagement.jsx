import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FiUsers, 
  FiSearch, 
  FiFilter, 
  FiRefreshCw, 
  FiShield, 
  FiCheckCircle, 
  FiChevronLeft, 
  FiChevronRight,
  FiMail,
  FiLock,
  FiGlobe
} from 'react-icons/fi';
import { RiGoogleFill } from 'react-icons/ri';
import { userApi } from '../../services/api';
import '../../styles/users/users.css';

const UserManagement = () => {
  const [summary, setSummary] = useState({
    totalUsers: 0,
    googleUsers: 0,
    localUsers: 0,
    bothUsers: 0
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [authFilter, setAuthFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sumData, listData] = await Promise.all([
        userApi.getSummary(),
        userApi.getUsers({ search: searchTerm, authProvider: authFilter })
      ]);
      setSummary(sumData || { totalUsers: 0, googleUsers: 0, localUsers: 0, bothUsers: 0 });
      setUsers(Array.isArray(listData) ? listData : []);
    } catch (err) {
      console.error('Failed to load user management data:', err);
      setError('Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, authFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, authFilter]);

  // Filtered users for client-side search refinement
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchTerm.trim() || 
        (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.businessName && user.businessName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const provider = (user.authProvider || 'LOCAL').toUpperCase();
      const matchesProvider = authFilter === 'ALL' || provider === authFilter;

      return matchesSearch && matchesProvider;
    });
  }, [users, searchTerm, authFilter]);

  // Pagination slice
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const renderAuthProviderBadge = (provider) => {
    const p = (provider || 'LOCAL').toUpperCase();
    if (p === 'GOOGLE') {
      return (
        <span className="auth-badge auth-badge-google">
          <RiGoogleFill size={13} style={{ marginRight: '5px' }} /> Google
        </span>
      );
    }
    if (p === 'BOTH') {
      return (
        <span className="auth-badge auth-badge-both">
          <FiGlobe size={13} style={{ marginRight: '5px' }} /> Google + Email
        </span>
      );
    }
    return (
      <span className="auth-badge auth-badge-local">
        <FiMail size={13} style={{ marginRight: '5px' }} /> Email &amp; Password
      </span>
    );
  };

  return (
    <div className="users-container">
      {/* Header */}
      <div className="users-header">
        <div>
          <h1 className="users-title">User Management</h1>
          <p className="users-subtitle">Manage registered StockUp AI accounts and authentication information.</p>
        </div>
        <button className="btn-refresh" onClick={loadData} disabled={loading}>
          <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-total">
            <FiUsers size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Users</span>
            <h3 className="kpi-value">{loading ? '—' : summary.totalUsers}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-google">
            <RiGoogleFill size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Google Users</span>
            <h3 className="kpi-value">{loading ? '—' : summary.googleUsers}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-email">
            <FiMail size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Email / Password Users</span>
            <h3 className="kpi-value">{loading ? '—' : summary.localUsers}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-both">
            <FiGlobe size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Google + Email Users</span>
            <h3 className="kpi-value">{loading ? '—' : summary.bothUsers}</h3>
          </div>
        </div>
      </div>

      {/* Table Toolbar */}
      <div className="toolbar-container">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name, email, business..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-box">
          <FiFilter className="filter-icon" />
          <select
            value={authFilter}
            onChange={(e) => setAuthFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Login Methods</option>
            <option value="GOOGLE">Google Only</option>
            <option value="LOCAL">Email &amp; Password</option>
            <option value="BOTH">Google + Email</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="error-card">
          <p>{error}</p>
          <button className="btn-retry" onClick={loadData}>Retry</button>
        </div>
      )}

      {/* Table Content */}
      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Login Method</th>
              <th>Business</th>
              <th>Role</th>
              <th>Created</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="skeleton-row">
                  <td colSpan={7}>
                    <div className="skeleton-line" />
                  </td>
                </tr>
              ))
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  <FiUsers size={36} style={{ color: '#64748b', marginBottom: '10px' }} />
                  <h4>No users found</h4>
                  <p>There are no registered accounts matching your filter criteria.</p>
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {(u.fullName || u.email || 'U')[0].toUpperCase()}
                      </div>
                      <div className="user-details">
                        <span className="user-name">{u.fullName || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="user-email">{u.email}</td>
                  <td>{renderAuthProviderBadge(u.authProvider)}</td>
                  <td className="user-business">{u.businessName || u.businessId || '—'}</td>
                  <td>
                    <span className={`role-badge role-${(u.role || 'STAFF').toLowerCase()}`}>
                      <FiShield size={11} style={{ marginRight: '4px' }} /> {u.role || 'STAFF'}
                    </span>
                  </td>
                  <td className="user-date">{formatDate(u.createdAt)}</td>
                  <td>
                    <span className="status-badge status-active">
                      <FiCheckCircle size={12} style={{ marginRight: '4px' }} /> Active
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && filteredUsers.length > 0 && (
        <div className="pagination-footer">
          <span className="pagination-info">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} accounts
          </span>
          <div className="pagination-controls">
            <button
              className="btn-page"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              <FiChevronLeft /> Previous
            </button>
            <span className="page-indicator">Page {currentPage} of {totalPages}</span>
            <button
              className="btn-page"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
