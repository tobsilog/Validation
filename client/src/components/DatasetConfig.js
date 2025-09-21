import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DatasetConfig = () => {
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [outcomeColumn, setOutcomeColumn] = useState('');
  const [interventionColumn, setInterventionColumn] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get dataset info from session storage
    const storedInfo = sessionStorage.getItem('datasetInfo');
    if (storedInfo) {
      setDatasetInfo(JSON.parse(storedInfo));
    } else {
      navigate('/'); // Redirect back if no dataset info
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!outcomeColumn || !interventionColumn) {
      setMessage('Please select both outcome and intervention columns');
      return;
    }

    if (outcomeColumn === interventionColumn) {
      setMessage('Outcome and intervention columns must be different');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outcome_column: outcomeColumn,
          intervention_column: interventionColumn,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store configuration
        const config = {
          outcome_column: outcomeColumn,
          intervention_column: interventionColumn,
        };
        sessionStorage.setItem('analysisConfig', JSON.stringify(config));
        navigate('/results');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Configuration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!datasetInfo) {
    return <div className="loading">Loading dataset information...</div>;
  }

  return (
    <div className="dataset-config">
      <div className="config-container">
        <h2>Dataset Configuration</h2>
        <p className="config-description">
          Configure your analysis by selecting the outcome and intervention columns from your dataset.
        </p>

        <div className="dataset-overview">
          <h3>Dataset Overview</h3>
          <div className="dataset-stats">
            <div className="stat">
              <span className="stat-label">Project:</span>
              <span className="stat-value">{datasetInfo.project_title}</span>
            </div>
            <div className="stat">
              <span className="stat-label">File:</span>
              <span className="stat-value">{datasetInfo.filename}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Rows:</span>
              <span className="stat-value">{datasetInfo.shape[0].toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Columns:</span>
              <span className="stat-value">{datasetInfo.shape[1]}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="config-form">
          <div className="columns-selection">
            <div className="form-group">
              <label htmlFor="outcomeColumn">Outcome Column</label>
              <select
                id="outcomeColumn"
                value={outcomeColumn}
                onChange={(e) => setOutcomeColumn(e.target.value)}
                className="form-select"
              >
                <option value="">Select outcome column...</option>
                {datasetInfo.columns.map((column, index) => (
                  <option key={index} value={column}>
                    {column}
                  </option>
                ))}
              </select>
              <small className="help-text">
                The dependent variable you want to predict or analyze
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="interventionColumn">Intervention Column</label>
              <select
                id="interventionColumn"
                value={interventionColumn}
                onChange={(e) => setInterventionColumn(e.target.value)}
                className="form-select"
              >
                <option value="">Select intervention column...</option>
                {datasetInfo.columns.map((column, index) => (
                  <option key={index} value={column}>
                    {column}
                  </option>
                ))}
              </select>
              <small className="help-text">
                The treatment or intervention variable for Virtual Twins analysis
              </small>
            </div>
          </div>

          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/')}
              className="btn btn-secondary"
            >
              Back
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Configuring...' : 'Proceed to Analysis'}
            </button>
          </div>
        </form>

        <div className="columns-preview">
          <h3>Available Columns</h3>
          <div className="columns-list">
            {datasetInfo.columns.map((column, index) => (
              <div key={index} className="column-item">
                <span className="column-name">{column}</span>
                <span className="column-index">#{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {datasetInfo.preview && (
          <div className="data-preview">
            <h3>Data Preview</h3>
            <div className="preview-table">
              <table>
                <thead>
                  <tr>
                    {datasetInfo.columns.map((column, index) => (
                      <th key={index}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datasetInfo.preview.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {datasetInfo.columns.map((column, colIndex) => (
                        <td key={colIndex}>{String(row[column])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetConfig;