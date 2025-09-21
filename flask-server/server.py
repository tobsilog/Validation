from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
import io
import os

app = Flask(__name__)
CORS(app)

# Global variable to store uploaded dataset
uploaded_data = None
project_config = {}

@app.route("/upload", methods=["POST"])
def upload_file():
    global uploaded_data, project_config
    
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    project_title = request.form.get('project_title', 'Untitled Project')
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    try:
        # Read CSV file
        file_content = file.read()
        uploaded_data = pd.read_csv(io.StringIO(file_content.decode('utf-8')))
        
        # Store project configuration
        project_config['title'] = project_title
        project_config['filename'] = file.filename
        project_config['shape'] = uploaded_data.shape
        
        # Return dataset info
        return jsonify({
            "message": "File uploaded successfully",
            "project_title": project_title,
            "filename": file.filename,
            "columns": list(uploaded_data.columns),
            "shape": uploaded_data.shape,
            "preview": uploaded_data.head().to_dict('records')
        })
    
    except Exception as e:
        return jsonify({"error": f"Error processing file: {str(e)}"}), 400

@app.route("/configure", methods=["POST"])
def configure_analysis():
    global project_config
    
    data = request.get_json()
    outcome_column = data.get('outcome_column')
    intervention_column = data.get('intervention_column')
    
    if not outcome_column or not intervention_column:
        return jsonify({"error": "Both outcome and intervention columns must be specified"}), 400
    
    project_config['outcome_column'] = outcome_column
    project_config['intervention_column'] = intervention_column
    
    return jsonify({
        "message": "Configuration saved",
        "outcome_column": outcome_column,
        "intervention_column": intervention_column
    })

@app.route("/analyze", methods=["POST"])
def run_analysis():
    global uploaded_data, project_config
    
    if uploaded_data is None:
        return jsonify({"error": "No dataset uploaded"}), 400
    
    try:
        outcome_col = project_config['outcome_column']
        intervention_col = project_config['intervention_column']
        
        # Prepare data
        features = uploaded_data.drop([outcome_col], axis=1)
        target = uploaded_data[outcome_col]
        
        # Convert categorical variables to numeric if needed
        for col in features.select_dtypes(include=['object']).columns:
            features[col] = pd.factorize(features[col])[0]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            features, target, test_size=0.2, random_state=42
        )
        
        # Benchmark Model (Random Forest without Virtual Twins)
        benchmark_model = RandomForestRegressor(n_estimators=100, random_state=42)
        benchmark_model.fit(X_train, y_train)
        benchmark_pred = benchmark_model.predict(X_test)
        benchmark_r2 = r2_score(y_test, benchmark_pred)
        
        # Virtual Twins Method (simplified implementation)
        # Create treatment groups based on intervention column
        treatment_groups = uploaded_data[intervention_col].unique()
        
        # For demonstration, we'll create a simple VT method
        vt_predictions = []
        vt_r2_scores = []
        
        for group in treatment_groups:
            group_mask = uploaded_data[intervention_col] == group
            group_data = uploaded_data[group_mask]
            
            if len(group_data) > 10:  # Minimum samples for training
                group_features = group_data.drop([outcome_col], axis=1)
                group_target = group_data[outcome_col]
                
                # Convert categorical variables
                for col in group_features.select_dtypes(include=['object']).columns:
                    group_features[col] = pd.factorize(group_features[col])[0]
                
                if len(group_data) > 20:
                    X_train_g, X_test_g, y_train_g, y_test_g = train_test_split(
                        group_features, group_target, test_size=0.2, random_state=42
                    )
                    
                    group_model = RandomForestRegressor(n_estimators=50, random_state=42)
                    group_model.fit(X_train_g, y_train_g)
                    group_pred = group_model.predict(X_test_g)
                    group_r2 = r2_score(y_test_g, group_pred)
                    vt_r2_scores.append(group_r2)
        
        # Calculate overall VT method R²
        vt_method_r2 = np.mean(vt_r2_scores) if vt_r2_scores else 0.0
        
        # Axiom validation (simplified)
        axioms = {
            "Axiom 1: Consistency": vt_method_r2 > 0.3,
            "Axiom 2: Stability": abs(benchmark_r2 - vt_method_r2) < 0.5,
            "Axiom 3: Interpretability": len(treatment_groups) <= 10
        }
        
        results = {
            "benchmark_r2": round(benchmark_r2, 4),
            "vt_method_r2": round(vt_method_r2, 4),
            "axioms": axioms,
            "treatment_groups": len(treatment_groups),
            "sample_size": len(uploaded_data),
            "feature_count": len(features.columns)
        }
        
        return jsonify(results)
    
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

@app.route("/project-info", methods=["GET"])
def get_project_info():
    global project_config
    return jsonify(project_config)

# Keep the original members route for testing
@app.route("/members")
def members():
    return {"members": ["Member1", "Member2", "Member3"]}

if __name__ == "__main__":
    app.run(debug=True)