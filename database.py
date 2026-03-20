import sqlite3

def init_db():
    conn = sqlite3.connect("students.db")
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            maths_marks INTEGER,
            physics_marks INTEGER,
            python_marks INTEGER,
            dsa_marks INTEGER,
            dbms_marks INTEGER,
            attendance_percentage INTEGER,
            study_hours_per_week INTEGER,
            sleep_hours REAL,
            risk_level TEXT,
            weak_subject TEXT
        )
    """)

    conn.commit()
    conn.close()























