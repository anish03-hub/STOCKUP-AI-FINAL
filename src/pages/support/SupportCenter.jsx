import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RiToolsFill, RiUserFill, RiBox3Fill, RiCustomerService2Fill, RiArrowLeftLine } from 'react-icons/ri';
import '../../styles/support/support.css';

const SupportCenter = () => {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    description: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleIssueSelect = (category) => {
    setSelectedIssue(category);
    setFormData({ ...formData, category });
    setSubmitted(false);
  };

  const handleBack = () => {
    if (selectedIssue) {
      setSelectedIssue(null);
    } else {
      navigate('/login');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Frontend demonstration only
    console.log('Support request submitted locally:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSelectedIssue(null);
      setSubmitted(false);
      setFormData({ name: '', email: '', category: '', description: '' });
    }, 3000);
  };

  return (
    <div className="support-container">
      <div className="support-header">
        <button className="back-btn" onClick={handleBack}>
          <RiArrowLeftLine /> {selectedIssue ? "Back to Categories" : "Back to Login"}
        </button>
        <h1>Support Center</h1>
        <p>How can we help you?</p>
      </div>

      {!selectedIssue && (
        <div className="support-cards-grid">
          <div className="support-card">
            <div className="support-card-icon"><RiToolsFill /></div>
            <h3>Technical Issue</h3>
            <p>Having trouble using StockUp AI?</p>
            <button className="support-btn" onClick={() => handleIssueSelect('Technical Issue')}>Get Help</button>
          </div>

          <div className="support-card">
            <div className="support-card-icon"><RiUserFill /></div>
            <h3>Account / Login Issue</h3>
            <p>Problems signing in or managing your account?</p>
            <button className="support-btn" onClick={() => handleIssueSelect('Account / Login Issue')}>Get Help</button>
          </div>

          <div className="support-card">
            <div className="support-card-icon"><RiBox3Fill /></div>
            <h3>Inventory Issue</h3>
            <p>Need help with inventory, stock, expiry or medicines?</p>
            <button className="support-btn" onClick={() => handleIssueSelect('Inventory Issue')}>Get Help</button>
          </div>

          <div className="support-card">
            <div className="support-card-icon"><RiCustomerService2Fill /></div>
            <h3>Contact Support</h3>
            <p>Need direct assistance from the support team?</p>
            <button className="support-btn" onClick={() => handleIssueSelect('Contact Support')}>Contact Support</button>
          </div>
        </div>
      )}

      {selectedIssue && (
        <div className="support-form-container">
          <h2>Submit a Request</h2>
          <p>Category: <strong>{selectedIssue}</strong></p>
          
          {submitted ? (
            <div className="support-success-message">
              Support request submitted successfully.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="support-form">
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  placeholder="Your full name"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  placeholder="Your email address"
                />
              </div>
              <div className="form-group">
                <label>Issue Category</label>
                <select 
                  name="category" 
                  value={formData.category} 
                  onChange={handleChange} 
                  required
                >
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Account / Login Issue">Account / Login Issue</option>
                  <option value="Inventory Issue">Inventory Issue</option>
                  <option value="Contact Support">Contact Support</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  required 
                  placeholder="Describe your issue in detail..."
                  rows="5"
                ></textarea>
              </div>
              <button type="submit" className="submit-support-btn">Submit Request</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default SupportCenter;
