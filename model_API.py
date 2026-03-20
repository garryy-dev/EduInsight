from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from database import init_db
import sqlite3





# Initialize the Flask application
app=Flask(__name__)
CORS(app) # Enable CORS for frontend integration



# Initialize the database   
init_db()

#  Base directory resolution
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

import joblib
import sys
from train_risk_model_v2 import HeuristicRiskModel

# Fix for joblib unpickling error: module '__main__' has no attribute 'HeuristicRiskModel'
sys.modules['__main__'].HeuristicRiskModel = HeuristicRiskModel

# Load the trained model architecture containing our exact heuristic engine
model = joblib.load(os.path.join(BASE_DIR, 'risk_model_v3.pkl'))

# Define the prediction endpoint
@app.route("/predict", methods=["POST"])




# Function to handle prediction requests
def predict():
    # Get JSON data from the request
    data = request.get_json()
    
    # Identify the weak subjects dynamically
    subjects = {
        "maths_marks": float(data.get("maths_marks", 0)),
        "physics_marks": float(data.get("physics_marks", 0)),
        "python_marks": float(data.get("python_marks", 0)),
        "dsa_marks": float(data.get("dsa_marks", 0)),
        "dbms_marks": float(data.get("dbms_marks", 0))
    }
    
    # Threshold logic: Every subject below 65 is considered a critical weak topic
    weak_subjects_raw = [subj for subj, score in subjects.items() if score < 65]
    
    # Only fallback to lowest if the lowest is actually "risky" (e.g. < 80)
    # If everything is > 80, we consider it a solid foundation (no weak subjects)
    if not weak_subjects_raw:
        lowest_score = min(subjects.values())
        if lowest_score < 80:
            weak_subjects_raw = [min(subjects.keys(), key=lambda k: subjects[k])]
        
    weak_subjects_formatted = [w.replace("_marks", "").upper() for w in weak_subjects_raw]
    weak_subject = ", ".join(weak_subjects_formatted)
    
    # Calculate risk using the serialized heuristic model object
    risk_level, risk_score, behavioral_warnings = model.predict_single(data)


    # Store the data and prediction in the database
    
    conn = sqlite3.connect("students.db")
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO students (
            maths_marks, physics_marks, python_marks, dsa_marks, dbms_marks,
            attendance_percentage, study_hours_per_week, sleep_hours,
            risk_level, weak_subject
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["maths_marks"],
        data["physics_marks"],
        data["python_marks"],
        data["dsa_marks"],
        data["dbms_marks"],
        data["attendance_percentage"],
        data["study_hours_per_week"],
        data["sleep_hours"],
        risk_level,
        weak_subject
    ))

    conn.commit()
    conn.close()



    
    
    # FINAL ACTION SUMMARY
    if not weak_subjects_formatted and not behavioral_warnings:
        action_summary = "ELITE FOUNDATION: You are maintaining a perfect balance of academics and professional habits. Keep this elite momentum!"
    elif not weak_subjects_formatted and behavioral_warnings:
        action_summary = "FOUNDATION STABLE: Your technical knowledge is solid, but your current habits are unsustainable. See the Habit Recovery Plan."
    else:
        # Standard logic for technical gaps
        action_summary = "Industry readiness identified. Optimize your domain-specific foundations."
        if len(weak_subjects_formatted) > 1:
            action_summary = f"CRITICAL GAP: You have {len(weak_subjects_formatted)} foundational knowledge gaps that will impact your tech career trajectory."
        elif risk_level == "High":
            action_summary = "URGENT MENTORSHIP: Significant barriers to career readiness detected. Immediate skill recovery advised."
        elif risk_level == "Medium":
            action_summary = "FOUNDATION ALERT: Your technical preparedness is slipping. Bridge these gaps to stay employable."
        else:
            action_summary = "ELITE TRAJECTORY: Your technical foundation is solid! Accelerate your specialization."

    # Return the prediction and weak subjects as JSON
    return jsonify({
        'Risk Level': risk_level,
        'Risk Score': risk_score,
        'Weak Subjects': weak_subjects_formatted,
        'Action Summary': action_summary,
        'Behavioral Warnings': behavioral_warnings
    })



# Run the Flask application
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)





student_data = {
    "maths_marks": 85,
    "physics_marks": 78, 
    "python_marks": 42,
    "dsa_marks": 48,
    "dbms_marks": 80
}












# # Basic Recommendation Map (Add-on)

# recommendation_map = {
#     "maths_marks": "Focus on improving problem-solving skills and practice more math exercises.",
#     "physics_marks": "Review fundamental concepts and work on physics problems regularly.",
#     "python_marks": "Continue practicing coding and explore more advanced Python topics.",
#     "dsa_marks": "Strengthen your understanding of data structures and algorithms through practice.",
#     "dbms_marks": "Review database concepts and practice SQL queries to improve your DBMS skills."
# }



















