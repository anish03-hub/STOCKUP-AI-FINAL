import React, { useState, useEffect } from 'react';
import { BsStars } from 'react-icons/bs';
import { FiAlertTriangle, FiTrendingUp, FiClock, FiCheckCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import '../../styles/dashboard/dashboard.css';

const ACTION_ROUTES = {
  'Create PO': '/purchase-orders/create',
  'Review Forecast': '/forecast',
  'View Expiry': '/inventory/near-expiry',
  'Optimize PO': '/purchase-orders',
};

const AIRecommendationCard = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/insights');
        if (response.ok) {
          const data = await response.json();
          setRecommendations(data.insights);
        } else {
          throw new Error('Failed to fetch');
        }
      } catch (err) {
        console.error("Failed to fetch AI insights", err);
        // Fallback dummy data if backend is completely down
        setRecommendations([
          { id: 1, icon: 'alert', text: 'Reorder Paracetamol - Stock critically low (23 units left against 100 min requirement).', action: 'Create PO' },
          { id: 2, icon: 'trending', text: 'Amoxicillin demand is predicted to spike 40% next week based on current flu trends.', action: 'Review Forecast' },
          { id: 3, icon: 'clock', text: '5 critical medicines are expiring in 7 days. Action required to prevent wastage.', action: 'View Expiry' },
          { id: 4, icon: 'check', text: 'AI can optimize your current pending purchase order for 12 items to save 15% costs.', action: 'Optimize PO' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  const getIcon = (name) => {
    switch (name?.toLowerCase()) {
      case 'alert': return <FiAlertTriangle />;
      case 'trending': return <FiTrendingUp />;
      case 'clock': return <FiClock />;
      case 'check': return <FiCheckCircle />;
      default: return <FiAlertTriangle />;
    }
  };

  return (
    <div className="ai-card">
      <div className="ai-card-header">
        <BsStars />
        <span>StockUp AI Insights {loading && <span style={{fontSize:'12px', marginLeft:'10px', color:'#94a3b8', fontWeight:'normal'}}>(Generating live insights...)</span>}</span>
      </div>
      <div className="ai-recommendation-list">
        {!loading && recommendations.map(rec => (
          <div key={rec.id} className="ai-recommendation-item">
            <div className="icon">
              {getIcon(rec.icon)}
            </div>
            <div className="content">
              <p>{rec.text}</p>
              <button onClick={() => navigate(ACTION_ROUTES[rec.action] || '/purchase-orders')}>
                {rec.action}
              </button>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '14px'}}>
            <div style={{marginBottom: '10px'}}><BsStars size={24} color="#3b82f6" style={{animation: 'pulse 2s infinite'}} /></div>
            Analyzing hospital inventory data...
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommendationCard;
