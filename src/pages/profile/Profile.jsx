import React, { useState, useEffect } from 'react';
import { 
  FiMail, 
  FiPhone, 
  FiUser, 
  FiArrowLeft, 
  FiShield, 
  FiCalendar, 
  FiBriefcase, 
  FiCheckCircle, 
  FiSettings 
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import '../../styles/profile/profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await authApi.profile();
        setUser(data);
      } catch (err) {
        // Fallback to local storage if API fails
        const localUser = JSON.parse(localStorage.getItem('stockup_user'));
        if (localUser) {
          setUser(localUser);
        } else {
          setError(err.message || 'Failed to load profile. Please try logging in again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="profile-page-loading">
        <div className="profile-spinner"></div>
        <p>Loading profile details...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="profile-page error-state">
        <div className="profile-error-card">
          <FiAlertCircle size={40} className="error-icon" />
          <h2>Failed to Load Profile</h2>
          <p>{error}</p>
          <Link to="/dashboard" className="btn btn-outline">
            <FiArrowLeft /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="profile-container">
      {/* Back Navigation & Page Title */}
      <div className="profile-top-bar">
        <Link to="/dashboard" className="profile-back-link">
          <FiArrowLeft /> <span>Back to Dashboard</span>
        </Link>
        <Link to="/settings" className="profile-settings-btn">
          <FiSettings /> <span>Account Settings</span>
        </Link>
      </div>

      {/* Main Profile Card */}
      <div className="profile-main-card">
        {/* Decorative Top Banner */}
        <div className="profile-card-banner">
          <div className="banner-pattern"></div>
        </div>

        {/* Profile Identity Block */}
        <div className="profile-identity-section">
          <div className="profile-avatar-outer">
            <div className="profile-avatar-inner">
              {getInitials(user?.fullName)}
            </div>
            <div className="avatar-status-badge"></div>
          </div>
          
          <div className="profile-identity-info">
            <h1 className="profile-name">{user?.fullName || 'User Profile'}</h1>
            <div className="profile-badges-row">
              <span className="profile-badge-role">
                <FiShield className="badge-icon" /> {user?.role || 'User'}
              </span>
              {user?.businessId && (
                <span className="profile-badge-business">
                  <FiBriefcase className="badge-icon" /> {user.businessId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info Details Grid */}
        <div className="profile-content-section">
          <div className="profile-info-grid">
            
            {/* General Info Card */}
            <div className="info-section-card">
              <h3>General Information</h3>
              <div className="info-list">
                <div className="info-item">
                  <div className="info-icon-wrapper"><FiUser /></div>
                  <div className="info-text">
                    <span className="info-label">Full Name</span>
                    <span className="info-value">{user?.fullName || '—'}</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-wrapper"><FiMail /></div>
                  <div className="info-text">
                    <span className="info-label">Email Address</span>
                    <span className="info-value">{user?.email || '—'}</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-wrapper"><FiPhone /></div>
                  <div className="info-text">
                    <span className="info-label">Phone Number</span>
                    <span className="info-value">{user?.phone || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Info Card */}
            <div className="info-section-card">
              <h3>System & Security</h3>
              <div className="info-list">
                <div className="info-item">
                  <div className="info-icon-wrapper"><FiShield /></div>
                  <div className="info-text">
                    <span className="info-label">System Role</span>
                    <span className="info-value role-highlight">{user?.role || '—'}</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-wrapper"><FiBriefcase /></div>
                  <div className="info-text">
                    <span className="info-label">Business Account ID</span>
                    <span className="info-value">{user?.businessId || '—'}</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-wrapper"><FiCalendar /></div>
                  <div className="info-text">
                    <span className="info-label">Member Since</span>
                    <span className="info-value">{formatDate(user?.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Metrics / Stats Cards */}
          <div className="profile-quick-stats">
            <div className="quick-stat-card">
              <div className="stat-icon-bg green"><FiCheckCircle /></div>
              <div className="stat-info">
                <span className="stat-label">Account Status</span>
                <span className="stat-value text-green">Active</span>
              </div>
            </div>

            <div className="quick-stat-card">
              <div className="stat-icon-bg blue"><FiBriefcase /></div>
              <div className="stat-info">
                <span className="stat-label">Enterprise Access</span>
                <span className="stat-value text-blue">{user?.businessId || 'Standard'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
