import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProjectSetup = () => {
  const [projectTitle, setProjectTitle] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!projectTitle.trim()) {
      setMessage('Please enter a project title');
      return;
    }
    
    if (!file) {
      setMessage('Please select a dataset file');
      return;
    }

    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_title', projectTitle);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Store dataset info in sessionStorage for other components
        sessionStorage.setItem('datasetInfo', JSON.stringify(data));
        navigate('/config');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Upload failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-setup">
      <div className="setup-container">
        <h2>Project Setup</h2>
        <p className="setup-description">
          Start your Virtual Twins analysis by setting up your project and uploading your dataset.
        </p>
        
        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label htmlFor="projectTitle">Project Title</label>
            <input
              type="text"
              id="projectTitle"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Enter your project title..."
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dataset">Upload Dataset</label>
            <div className="file-upload">
              <input
                type="file"
                id="dataset"
                accept=".csv"
                onChange={handleFileChange}
                className="file-input"
              />
              <div className="file-info">
                {file ? (
                  <span className="file-selected">
                    Selected: {file.name}
                  </span>
                ) : (
                  <span className="file-placeholder">
                    Choose a CSV file...
                  </span>
                )}
              </div>
            </div>
          </div>

          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Uploading...' : 'Upload Dataset'}
          </button>
        </form>

        <div className="setup-info">
          <h3>Requirements</h3>
          <ul>
            <li>Dataset should be in CSV format</li>
            <li>Include clear column headers</li>
            <li>Ensure outcome and intervention columns are present</li>
            <li>Missing values should be handled appropriately</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProjectSetup;