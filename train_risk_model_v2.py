import joblib
import pandas as pd

class HeuristicRiskModel:
    def clamp(self, val, min_val, max_val):
        return max(min_val, min(val, max_val))

    def predict_single(self, data):
        """
        Calculate a rule-based risk score (0-100) and return the corresponding level.
        Expects a dict-like structured data input.
        """
        warnings = []
        subjects = ["maths_marks", "physics_marks", "python_marks", "dsa_marks", "dbms_marks"]
        
        # Support dict get or standard key access smoothly
        get_val = lambda k, default: data.get(k, default) if hasattr(data, 'get') else data[k] if k in data else default
        
        # Clamp marks between 0 and 100 to prevent negative or >100 spoofing
        marks = [self.clamp(float(get_val(subj, 0)), 0, 100) for subj in subjects]
        avg_marks = sum(marks) / len(marks) if marks else 0
        
        academic_risk = 0
        if avg_marks < 80:
            academic_risk = ((80 - avg_marks) / 40.0) * 100
        
        failing_subjects = sum(1 for m in marks if m < 40)
        academic_risk += failing_subjects * 10 
        academic_risk = self.clamp(academic_risk, 0, 100)
        
        # Clamp attendance between 0 and 100
        attendance = self.clamp(float(get_val("attendance_percentage", 100)), 0, 100)
        attendance_risk = 0
        if attendance < 75:
            attendance_risk = ((75 - attendance) / 25.0) * 100
            attendance_risk = self.clamp(attendance_risk, 0, 100)
            warnings.append(f"Low Attendance Risk ({attendance}%)")
            
        # Clamp study hours (0 to 168 max hours in a week)
        study_hours = self.clamp(float(get_val("study_hours_per_week", 10)), 0, 168)
        study_risk = 0
        if study_hours < 10:
            study_risk = ((10 - study_hours) / 10.0) * 100
            warnings.append("Inadequate Study Blocks")
        elif study_hours > 50:
            study_risk = ((study_hours - 50) / 40.0) * 100
            warnings.append("High Burnout Risk (Over-studying)")
            
        study_risk = self.clamp(study_risk, 0, 100)
            
        # Clamp sleep hours (0 to 24)
        sleep_hours = self.clamp(float(get_val("sleep_hours", 7)), 0, 24)
        sleep_risk = 0
        if sleep_hours < 6:
            sleep_risk = ((6 - sleep_hours) / 6.0) * 100
            warnings.append("Severe Sleep Deprivation")
        elif sleep_hours > 10:
            sleep_risk = ((sleep_hours - 10) / 4.0) * 100
            warnings.append("Lethargy/Depression Risk (Over-sleeping)")
            
        sleep_risk = self.clamp(sleep_risk, 0, 100)
            
        habits_risk = (study_risk * 0.5) + (sleep_risk * 0.5)
        
        # Weighted Total Score
        total_risk_score = (academic_risk * 0.50) + (attendance_risk * 0.30) + (habits_risk * 0.20)
        
        # Apply Critical Behavioral Penalties directly to the final score to override good grades
        if "High Burnout Risk (Over-studying)" in warnings:
            total_risk_score += (study_risk * 0.8) # Up to 80% direct penalty spike
        if "Severe Sleep Deprivation" in warnings or "Lethargy/Depression Risk (Over-sleeping)" in warnings:
            total_risk_score += (sleep_risk * 0.8) # Up to 80% direct penalty spike
            
        total_risk_score = self.clamp(total_risk_score, 0, 100)
        
        if total_risk_score >= 60:
            return "High", int(total_risk_score), warnings
        elif total_risk_score >= 35:
            return "Medium", int(total_risk_score), warnings
        else:
            return "Low", int(total_risk_score), warnings


if __name__ == "__main__":
    # Create the fully functional heuristic model object
    model = HeuristicRiskModel()
    
    # Dump it to disc
    joblib.dump(model, "risk_model_v3.pkl")
    
    print("Heuristic Model exported successfully to risk_model_v3.pkl!")











