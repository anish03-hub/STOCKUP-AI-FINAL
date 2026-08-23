import React, { useState } from 'react';
import { FiTrendingUp, FiTrendingDown, FiAlertCircle, FiCheckCircle, FiSettings, FiBarChart2 } from 'react-icons/fi';
import '../../styles/prediction/prediction.css';

const DemandPrediction = () => {
  const [formData, setFormData] = useState({
    Store: 1,
    Dept: 1,
    IsHoliday: 0,
    Temperature: 65.0,
    Fuel_Price: 3.5,
    MarkDown1: 0.0,
    MarkDown2: 0.0,
    MarkDown3: 0.0,
    MarkDown4: 0.0,
    MarkDown5: 0.0,
    CPI: 200.0,
    Unemployment: 5.0,
    Size: 50000.0,
    Year: 2023,
    Month: 1,
    Week: 1,
    Day: 1,
    Quarter: 1,
    Type_B: 0,
    Type_C: 0
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'IsHoliday' || name === 'Type_B' || name === 'Type_C'
        ? parseInt(value)
        : parseFloat(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/predictions/demand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const result = await response.json();
      setPrediction(result);
    } catch (err) {
      setError(err.message);
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prediction-page">
      <div className="prediction-header">
        <h1>
          <FiBarChart2 /> Demand Prediction
        </h1>
        <p className="page-description">
          Enter the required parameters to predict future product/department demand
          using our AI-powered forecasting model.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <FiAlertCircle />
          <span>Error: {error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="prediction-form">
        <div className="form-section">
          <h2>Store & Department Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="store">Store ID</label>
              <input
                type="number"
                id="store"
                name="Store"
                value={formData.Store}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dept">Department ID</label>
              <input
                type="number"
                id="dept"
                name="Dept"
                value={formData.Dept}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  id="isHoliday"
                  name="IsHoliday"
                  checked={formData.IsHoliday === 1}
                  onChange={handleChange}
                />
                Is Holiday
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Environmental Factors</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="temperature">Temperature (°F)</label>
              <input
                type="number"
                id="temperature"
                name="Temperature"
                value={formData.Temperature}
                onChange={handleChange}
                step="0.1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fuelPrice">Fuel Price ($)</label>
              <input
                type="number"
                id="fuelPrice"
                name="Fuel_Price"
                value={formData.Fuel_Price}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Marketing Downs (Promotional Impact)</h2>
          <div className="form-grid">
            {[1, 2, 3, 4, 5].map(num => (
              <div className="form-group" key={num}>
                <label htmlFor={`markDown${num}`}>MarkDown{num} ($)</label>
                <input
                  type="number"
                  id={`markDown${num}`}
                  name={`MarkDown${num}`}
                  value={formData[`MarkDown${num}`]}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h2>Economic Indicators</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="cpi">Consumer Price Index (CPI)</label>
              <input
                type="number"
                id="cpi"
                name="CPI"
                value={formData.CPI}
                onChange={handleChange}
                step="0.1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="unemployment">Unemployment Rate (%)</label>
              <input
                type="number"
                id="unemployment"
                name="Unemployment"
                value={formData.Unemployment}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="100"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Store Characteristics</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="size">Store Size (sq ft)</label>
              <input
                type="number"
                id="size"
                name="Size"
                value={formData.Size}
                onChange={handleChange}
                min="1000"
                step="100"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Time Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="year">Year</label>
              <input
                type="number"
                id="year"
                name="Year"
                value={formData.Year}
                onChange={handleChange}
                min="2020"
                max="2030"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="month">Month</label>
              <input
                type="number"
                id="month"
                name="Month"
                value={formData.Month}
                onChange={handleChange}
                min="1"
                max="12"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="week">Week of Year</label>
              <input
                type="number"
                id="week"
                name="Week"
                value={formData.Week}
                onChange={handleChange}
                min="1"
                max="52"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="day">Day of Month</label>
              <input
                type="number"
                id="day"
                name="Day"
                value={formData.Day}
                onChange={handleChange}
                min="1"
                max="31"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="quarter">Quarter</label>
              <input
                type="number"
                id="quarter"
                name="Quarter"
                value={formData.Quarter}
                onChange={handleChange}
                min="1"
                max="4"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Store Type (One-Hot Encoded)</h2>
          <p className="form-help-text">
            Select the store type. Only one should be selected at a time.
          </p>
          <div className="form-group">
            <label>
              <input
                type="radio"
                name="Type_B"
                value="1"
                checked={formData.Type_B === 1}
                onChange={e => setFormData(prev => ({ ...prev, Type_B: parseInt(e.target.value), Type_C: 0 }))}
              />
              Type B
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="radio"
                name="Type_C"
                value="1"
                checked={formData.Type_C === 1}
                onChange={e => setFormData(prev => ({ ...prev, Type_C: parseInt(e.target.value), Type_B: 0 }))}
              />
              Type C
            </label>
          </div>
          <p className="form-help-text">
            If neither is selected, store type defaults to Type A.
          </p>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading}
          >
            {loading ? 'Predicting...' : 'Predict Demand'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setFormData({
                Store: 1,
                Dept: 1,
                IsHoliday: 0,
                Temperature: 65.0,
                Fuel_Price: 3.5,
                MarkDown1: 0.0,
                MarkDown2: 0.0,
                MarkDown3: 0.0,
                MarkDown4: 0.0,
                MarkDown5: 0.0,
                CPI: 200.0,
                Unemployment: 5.0,
                Size: 50000.0,
                Year: 2023,
                Month: 1,
                Week: 1,
                Day: 1,
                Quarter: 1,
                Type_B: 0,
                Type_C: 0
              });
              setPrediction(null);
              setError(null);
            }}
          >
            Reset Form
          </button>
        </div>
      </form>

      {prediction && (
        <div className="prediction-result">
          <div className="result-header">
            <FiCheckCircle />
            <h2>Prediction Successful</h2>
          </div>
          <div className="result-content">
            <div className="result-item">
              <span>Predicted Demand</span>
              <strong className="result-value">
                {prediction.predictedDemand.toLocaleString()} units
              </strong>
            </div>
            <div className="result-item">
              <span>Model Used</span>
              <strong className="result-value">
                {prediction.model}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemandPrediction;