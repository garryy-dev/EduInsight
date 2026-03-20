document.addEventListener('DOMContentLoaded', () => {
    // --- UI Selectors ---
    const navbar = document.getElementById('navbar');
    const predictionForm = document.getElementById('prediction-form');
    const runBtn = document.getElementById('run-prediction-btn');
    const statusText = document.getElementById('demo-status-text');
    const btnExplore = document.getElementById('btn-explore-roadmap');
    const modal = document.getElementById('roadmap-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const container = document.getElementById('roadmap-container');
    
    // 3-Card Selectors
    const outRiskBg = document.getElementById('out-risk-bg');
    const outRiskIcon = document.getElementById('out-risk-icon');
    const outRiskVal = document.getElementById('out-risk-val');
    const outRiskSub = document.getElementById('out-risk-sub');
    const outRiskBar = document.getElementById('out-risk-bar');
    const outWeakSub = document.getElementById('out-weak-sub');
    const outAttendance = document.getElementById('out-attendance');
    const outStudy = document.getElementById('out-study');
    const outRecommendation = document.getElementById('out-recommendation');
    const warningContainer = document.getElementById('warning-container');
    const warningText = document.getElementById('out-warning-text');

    // --- Sticky Navbar ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- Animations ---
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));

    // --- ML Backend Integration ---
    if(predictionForm) {
        predictionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const studentData = {
                maths_marks: parseFloat(document.getElementById('maths_marks').value) || 0,
                physics_marks: parseFloat(document.getElementById('physics_marks').value) || 0,
                python_marks: parseFloat(document.getElementById('python_marks').value) || 0,
                dsa_marks: parseFloat(document.getElementById('dsa_marks').value) || 0,
                dbms_marks: parseFloat(document.getElementById('dbms_marks').value) || 0,
                attendance_percentage: parseFloat(document.getElementById('attendance_percentage').value) || 0,
                study_hours_per_week: parseFloat(document.getElementById('study_hours').value) || 0,
                sleep_hours: parseFloat(document.getElementById('sleep_hours').value) || 0
            };

            statusText.innerText = 'Running AI Analysis...';
            statusText.style.color = 'var(--color-primary)';
            runBtn.disabled = true;
            runBtn.innerText = 'Processing...';

            try {
                const response = await fetch('https://eduinsight-ai-1a09.onrender.com/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(studentData)
                });

                if(!response.ok) throw new Error('API Request Failed');
                
                const data = await response.json();
                
                // Update UI Fields
                const weakSubjectsArray = data['Weak Subjects'] || [data['Weak Subject']] || [];
                const activeWeakSubjects = weakSubjectsArray.filter(s => s && s.trim() !== '');
                
                outWeakSub.innerText = activeWeakSubjects.join(', ') || '--';
                
                const attendance = parseFloat(studentData.attendance_percentage);
                outAttendance.innerText = (attendance < 75 ? '⚠️ ' : '') + attendance + '%';
                outAttendance.style.color = attendance < 75 ? '#f59e0b' : 'inherit';
                
                outStudy.innerText = studentData.study_hours_per_week + ' hrs/wk';
                outRecommendation.innerHTML = `<strong>Status Update:</strong><br>${data['Action Summary'] || "Analyze your fundamentals."}`;
                
                // Handle Warnings
                const warnings = data['Behavioral Warnings'] || [];
                window.currentBehavioralWarnings = warnings; 
                window.currentWeakSubjects = activeWeakSubjects.map(s => s.toUpperCase());

                if (warningContainer && warningText) {
                    if (warnings.length > 0) {
                        warningContainer.style.display = 'block';
                        warningText.innerHTML = '⚠️ <strong>Behavioral Warnings:</strong><br> • ' + warnings.join('<br> • ');
                    } else {
                        warningContainer.style.display = 'none';
                    }
                }

                // Show/Hide Roadmap Button
                if (btnExplore) {
                    btnExplore.style.display = (activeWeakSubjects.length > 0 || warnings.length > 0) ? 'block' : 'none';
                }

                const riskInfo = data['Risk Level']; 
                const riskScore = data['Risk Score'] !== undefined ? data['Risk Score'] : (riskInfo === 'High' ? 82 : 15);
                const foundationScore = 100 - riskScore;
                
                outRiskVal.innerText = foundationScore + "%";
                outRiskSub.innerText = riskInfo.toUpperCase() + ' RISK';

                // Styling
                if(riskInfo === 'High') {
                    outRiskBg.style.backgroundColor = '#fef2f2'; outRiskBg.style.color = '#991b1b';
                    outRiskIcon.style.color = '#ef4444'; outRiskIcon.innerText = 'warning';
                    outRiskBar.style.backgroundColor = '#ef4444';
                } else if(riskInfo === 'Medium') {
                    outRiskBg.style.backgroundColor = '#fffbeb'; outRiskBg.style.color = '#b45309';
                    outRiskIcon.style.color = '#f59e0b'; outRiskIcon.innerText = 'running_with_errors';
                    outRiskBar.style.backgroundColor = '#f59e0b';
                } else {
                    outRiskBg.style.backgroundColor = '#f0fdf4'; outRiskBg.style.color = '#166534';
                    outRiskIcon.style.color = '#22c55e'; outRiskIcon.innerText = 'verified_user';
                    outRiskBar.style.backgroundColor = '#22c55e';
                }
                outRiskBar.style.width = foundationScore + "%";

                statusText.innerText = 'Analysis Complete';
                statusText.style.color = 'var(--color-text-muted)';
            } catch (error) {
                console.error("ML Backend Error:", error);
                statusText.innerText = 'Connection Error: API Offline';
                statusText.style.color = '#ef4444';
            } finally {
                runBtn.disabled = false;
                runBtn.innerText = '✨ Run AI Analysis';
            }
        });
    }

    // --- Roadmap Data ---
    const knowledgePaths = {
        'MATHS': [
            { title: 'Computational Logic & Modeling', desc: 'Secure foundational patterns in linear algebra and calculus needed for real-world AI modeling.', role: 'AI Researcher', diff: 'Intermediate' },
            { title: 'Predictive Statistics', desc: 'Master probability distributions and Bayesian logic for high-accuracy predictive engineering.', role: 'Data Scientist', diff: 'Advanced' },
            { title: 'Applied ML Models', desc: 'Transform theoretical math into production-ready predictive datasets.', role: 'ML Engineer', diff: 'Expert' }
        ],
        'PHYSICS': [
            { title: 'System Dynamics & Kinematics', desc: 'Master physical laws governing hardware systems and solid-state simulations.', role: 'Simulation Engineer', diff: 'Intermediate' },
            { title: 'Hardware Logic Integration', desc: 'Apply physical laws to sensor data and real-time computation modules.', role: 'Embedded Systems', diff: 'Advanced' },
            { title: 'Robotics Engineering', desc: 'Design intelligent physical systems by integrating hardware logic with autonomous control.', role: 'Robotics Engineer', diff: 'Expert' }
        ],
        'PYTHON': [
            { title: 'Enterprise Python Patterns', desc: 'Master pythonic architecture and OOP for building maintainable production systems.', role: 'Software Dev', diff: 'Beginner' },
            { title: 'Micro-services & Frameworks', desc: 'Engineer scalable backend APIs using professional Flask/FastAPI architectures.', role: 'Backend Engineer', diff: 'Intermediate' },
            { title: 'AI Ops & Cloud Scaling', desc: 'Deploy and orchestrate production AI models using Docker and modern Cloud stacks.', role: 'Cloud Architect', diff: 'Advanced' }
        ],
        'DSA': [
            { title: 'System Scalability Patterns', desc: 'Optimize data retrieval using advanced hashing and core data structure strategies.', role: 'Systems Engineer', diff: 'Intermediate' },
            { title: 'Distributed Logic & Graphs', desc: 'Engineer complex relationship models using graph theory and recursive processing.', role: 'Systems Architect', diff: 'Advanced' },
            { title: 'High-Performance Algorithms', desc: 'Master dynamic programming to solve large-scale computational efficiency problems.', role: 'Senior Engineer', diff: 'Expert' }
        ],
        'DBMS': [
            { title: 'Relational Data Architectures', desc: 'Design professional-grade schemas for high-performance scale and ACID data integrity.', role: 'Data Analyst', diff: 'Intermediate' },
            { title: 'Advanced Storage Optimization', desc: 'Architect distributed schemas and SQL aggregates for enterprise-level data processing.', role: 'Database Admin', diff: 'Advanced' },
            { title: 'Scalable Data Engineering', desc: 'Engineer modern distributed data systems for high-traffic technology platforms.', role: 'Data Engineer', diff: 'Expert' }
        ]
    };

    const habitMasteryPaths = {
        'Low Attendance Risk': [
            { title: 'Professional Consistency', desc: 'Track your engineering presence and commit to "Lecture Sprints" to regain foundation clarity.', role: 'Reliability Lead', diff: 'Beginner' },
            { title: 'Active Engagement', desc: 'Participate in live discussions to bridge the gap between textbook theory and practical insight.', role: 'Tech Consultant', diff: 'Intermediate' }
        ],
        'Inadequate Study Blocks': [
            { title: 'Deep Work Mastery', desc: 'Focus on "Quality over Quantity". Implement 90-minute hyper-focus blocks using the Pomodoro Method.', role: 'Efficiency Analyst', diff: 'Intermediate' },
            { title: 'Sustainable Systems', desc: 'Build a long-term production schedule that prevents cognitive overload and preserves creativity.', role: 'Solution Architect', diff: 'Advanced' }
        ],
        'High Burnout Risk': [
            { title: 'Deep Work Mastery', desc: 'Focus on "Quality over Quantity". Implement 90-minute hyper-focus blocks using the Pomodoro Method.', role: 'Efficiency Analyst', diff: 'Intermediate' },
            { title: 'Sustainable Systems', desc: 'Build a long-term production schedule that prevents cognitive overload and preserves creativity.', role: 'Solution Architect', diff: 'Advanced' }
        ],
        'Severe Sleep Deprivation': [
            { title: 'Cognitive Optimization', desc: 'Repair neural pathways by establishing a consistent 7-8 hour sleep-wake cycle.', role: 'Bio-Optimist', diff: 'Essential' },
            { title: 'Peak Performance Cycle', desc: 'Align your deepest work with your circadian rhythm to ensure high-performance code output.', role: 'High Performance Dev', diff: 'Expert' }
        ]
    };

    // --- Modal Logic ---
    if(btnExplore && modal) {
        btnExplore.addEventListener('click', () => {
            const subjects = window.currentWeakSubjects || [];
            const warnings = window.currentBehavioralWarnings || [];
            container.innerHTML = '';

            if (subjects.length === 0 && warnings.length === 0) {
                container.innerHTML = '<p class="text-muted">No specific tracks recommended at this time.</p>';
            } else {
                subjects.forEach(subj => {
                    const track = knowledgePaths[subj];
                    if (track) appendRoadmapToContainer(subj, track, 'route');
                });
            // Priority 2: Habit Mastery Paths (Tips requested by user)
            warnings.forEach(warn => {
                console.log("Matching warning:", warn);
                // Partial match to handle strings like "Low Attendance Risk (60%)"
                let matchedKey = Object.keys(habitMasteryPaths).find(key => warn.includes(key));
                
                // Fallback for sub-strings
                if (!matchedKey) matchedKey = Object.keys(habitMasteryPaths).find(key => key.includes(warn));

                console.log("Matched key:", matchedKey);
                if (matchedKey) {
                    appendRoadmapToContainer(matchedKey, habitMasteryPaths[matchedKey], 'self_improvement');
                }
            });
            }
            modal.classList.add('active');
            setTimeout(() => {
                container.querySelectorAll('.timeline-node').forEach(n => n.classList.add('visible'));
            }, 50);
        });

        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    }

    function appendRoadmapToContainer(title, track, icon) {
        const roadDiv = document.createElement('div');
        roadDiv.className = 'subject-roadmap';
        let html = `<h3><span class="material-symbols-outlined">${icon}</span> ${title} Path</h3><div class="timeline">`;
        track.forEach((node, i) => {
            html += `
                <div class="timeline-node" style="transition-delay: ${0.2 + (i * 0.15)}s">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-title">${node.title}</div>
                        <div class="timeline-desc">${node.desc}</div>
                        <div class="roadmap-badges">
                            <span class="roadmap-badge badge-role">${node.role}</span>
                            <span class="roadmap-badge badge-diff">${node.diff}</span>
                        </div>
                    </div>
                </div>`;
        });
        html += '</div>';
        roadDiv.innerHTML = html;
        container.appendChild(roadDiv);
    }
});
