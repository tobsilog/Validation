import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import ProjectSetup from './components/ProjectSetup';
import DatasetConfig from './components/DatasetConfig';
import Results from './components/Results';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <h1>Virtual Twins Validation Platform</h1>
          <p>Thesis Implementation - Data Analysis & Validation</p>
        </header>
        <Routes>
          <Route path="/" element={<ProjectSetup />} />
          <Route path="/config" element={<DatasetConfig />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;