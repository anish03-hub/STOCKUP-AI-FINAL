import React, { useState } from 'react';
import { FiCamera, FiMail, FiPhone, FiMapPin, FiBriefcase, FiEdit2, FiActivity, FiPackage, FiFileText } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import '../../styles/profile/profile.css';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const user = JSON.parse(localStorage.getItem('stockup_user')) || { name: 'Dr. Admin', role: 'Administrator' };

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            <span>{user.name.charAt(0)}</span>
            <div className="profile-avatar-overlay">
              <FiCamera size={20} />
              <span>Upload Photo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-info-card">
        <h2>{user.name}</h2>
        <p className="profile-role">{user.role}</p>

        <div className="profile-actions">
          <button className="btn btn-outline" onClick={() => setIsEditing(!isEditing)}>
            <FiEdit2 /> Edit Profile
          </button>
          <Link to="/change-password" className="btn btn-primary">
            Change Password
          </Link>
        </div>

        <div className="profile-details-grid">
          <div className="profile-detail-item">
            <span className="profile-detail-label">Email</span>
            <span className="profile-detail-value"><FiMail /> admin@cityhospital.com</span>
          </div>
          <div className="profile-detail-item">
            <span className="profile-detail-label">Phone</span>
            <span className="profile-detail-value"><FiPhone /> +1 (555) 123-4567</span>
          </div>
          <div className="profile-detail-item">
            <span className="profile-detail-label">Hospital</span>
            <span className="profile-detail-value"><FiMapPin /> City General Hospital</span>
          </div>
          <div className="profile-detail-item">
            <span className="profile-detail-label">Department</span>
            <span className="profile-detail-value"><FiBriefcase /> Pharmacy</span>
          </div>
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat-card">
          <div className="profile-stat-icon"><FiActivity /></div>
          <div className="profile-stat-content">
            <h4>Medicines Managed</h4>
            <p>234</p>
          </div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-icon"><FiPackage /></div>
          <div className="profile-stat-content">
            <h4>Orders Created</h4>
            <p>48</p>
          </div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-icon"><FiFileText /></div>
          <div className="profile-stat-content">
            <h4>Reports Generated</h4>
            <p>12</p>
          </div>
        </div>
      </div>
      
      <div className="profile-info-card" style={{textAlign: 'left'}}>
        <h3 style={{marginBottom: '1rem', fontSize: '1.2rem'}}>Account Information</h3>
        <div className="profile-details-grid" style={{borderTop: 'none', paddingTop: 0}}>
          <div className="profile-detail-item">
            <span className="profile-detail-label">Member Since</span>
            <span className="profile-detail-value">January 2024</span>
          </div>
          <div className="profile-detail-item">
            <span className="profile-detail-label">Last Login</span>
            <span className="profile-detail-value">Today, 09:30 AM</span>
          </div>
          <div className="profile-detail-item">
            <span className="profile-detail-label">Account Type</span>
            <span className="profile-detail-value">Enterprise Admin</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Profile;
