import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Results = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysisConfig, setAnalysisConfig] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const config = sessionStorage.getItem('analysisConfig');
    const datasetInfo = sessionStorage.getItem('datasetInfo');
    
    if (!config || !datasetInfo) {
      navigate('/');
      return;
    }

    setAnalysisConfig(JSON.parse(config));
    runAnalysis();
  }, [navigate]);

  const runAnalysis = async () => {
    try {
      const response = await fetch('/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        setError(`Analysis failed: ${data.error}`);
      }
    } catch (error) {
      setError(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getR2Interpretation = (r2) => {
    if (r2 >= 0.8) return { level: 'excellent', text: 'Excellent fit' };
    if (r2 >= 0.6) return { level: 'good', text: 'Good fit' };
    if (r2 >= 0.4) return { level: 'moderate', text: 'Moderate fit' };
    if (r2 >= 0.2) return { level: 'weak', text: 'Weak fit' };
    return { level: 'poor', text: 'Poor fit' };
  };

  const downloadResults = () => {
    const datasetInfo = JSON.parse(sessionStorage.getItem('datasetInfo'));
    const reportData = {
      project_title: datasetInfo.project_title,
      dataset: datasetInfo.filename,
      analysis_config: analysisConfig,
      results: results,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vt_analysis_results_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="results loading-state">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Running Virtual Twins Analysis...</h2>
          <p>Please wait while we process your data and validate the model axioms.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results error-state">
        <div className="error-container">
          <h2>Analysis Error</h2>
          <p className="error-message">{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Start Over
          </button>
        </div>
      </div>
    );
  }

  const benchmarkInterpretation = getR2Interpretation(results.benchmark_r2);
  const vtInterpretation = getR2Interpretation(results.vt_method_r2);

  return (
    <div className="results">
      <div className="results-container">
        <h2>Virtual Twins Analysis Results</h2>
        
        <div className="results-summary">
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Benchmark R²</h3>
              <div className={`r2-score ${benchmarkInterpretation.level}`}>
                {results.benchmark_r2}
              </div>
              <span className="interpretation">
                {benchmarkInterpretation.text}
              </span>
            </div>
            
            <div className="summary-card primary">
              <h3>VT Method R²</h3>
              <div className={`r2-score ${vtInterpretation.level}`}>
                {results.vt_method_r2}
              </div>
              <span className="interpretation">
                {vtInterpretation.text}
              </span>
            </div>
          </div>
        </div>

        <div className="performance-comparison">
          <h3>Model Performance Comparison</h3>
          <div className="comparison-chart">
            <div className="chart-bars">
              <div className="bar-group">
                <div className="bar-label">Benchmark</div>
                <div className="bar-container">
                  <div 
                    className="bar benchmark"
                    style={{ width: `${Math.max(results.benchmark_r2 * 100, 5)}%` }}
                  ></div>
                  <span className="bar-value">{results.benchmark_r2}</span>
                </div>
              </div>
              <div className="bar-group">
                <div className="bar-label">VT Method</div>
                <div className="bar-container">
                  <div 
                    className="bar vt-method"
                    style={{ width: `${Math.max(results.vt_method_r2 * 100, 5)}%` }}
                  ></div>
                  <span className="bar-value">{results.vt_method_r2}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="axioms-validation">
          <h3>Axiom Validation</h3>
          <div className="axioms-list">
            {Object.entries(results.axioms).map(([axiom, passed], index) => (
              <div key={index} className={`axiom-item ${passed ? 'passed' : 'failed'}`}>
                <div className="axiom-status">
                  {passed ? '✓' : '✗'}
                </div>
                <div className="axiom-content">
                  <span className="axiom-name">{axiom}</span>
                  <span className={`axiom-result ${passed ? 'pass' : 'fail'}`}>
                    {passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analysis-details">
          <h3>Analysis Details</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Sample Size:</span>
              <span className="detail-value">{results.sample_size.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Features:</span>
              <span className="detail-value">{results.feature_count}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Treatment Groups:</span>
              <span className="detail-value">{results.treatment_groups}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Outcome Column:</span>
              <span className="detail-value">{analysisConfig?.outcome_column}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Intervention Column:</span>
              <span className="detail-value">{analysisConfig?.intervention_column}</span>
            </div>
          </div>
        </div>

        <div className="results-actions">
          <button 
            onClick={downloadResults}
            className="btn btn-secondary"
          >
            Download Results
          </button>
          <button 
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            New Analysis
          </button>
        </div>

        <div className="results-footer">
          <p className="disclaimer">
            <strong>Note:</strong> This is a simplified Virtual Twins implementation for thesis validation. 
            Results are for demonstration and academic purposes. For production use, consider more 
            sophisticated modeling approaches and thorough validation procedures.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Results;