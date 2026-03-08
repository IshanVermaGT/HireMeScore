// Load user data
document.addEventListener('DOMContentLoaded', function() {
    console.log("Dashboard loaded");
    
    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('displayName').textContent = user.name;
        document.getElementById('userName').textContent = user.name;
    } else {
        // If no user, redirect to login
        window.location.href = '/pages/login.html';
    }

    // Setup file upload
    setupFileUpload();
    
    // Load analysis history
    loadHistory();
});

function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('resumeUpload');
    
    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#f0f0f0';
    });

    uploadArea.addEventListener('dragleave', function() {
        uploadArea.style.backgroundColor = 'white';
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = 'white';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

async function handleFileUpload(file) {
    if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
    }

    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'block';

    const formData = new FormData();
    formData.append('resume', file);

    try {
        const token = localStorage.getItem('token');
        console.log('Uploading file:', file.name);
        
        if (!token) {
            console.log('No token found, redirecting to login');
            window.location.href = '/pages/login.html';
            return;
        }

        const response = await fetch('http://localhost:5001/api/analysis/analyze', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        console.log('Response status:', response.status);

        if (response.status === 401) {
            // Token expired or invalid
            console.log('Token expired, redirecting to login');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/pages/login.html';
            return;
        }

        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
            displayResults(data.analysis);
        } else {
            throw new Error(data.error || 'Analysis failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to analyze resume. Please try again.');
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('uploadSection').style.display = 'block';
    }
}

function displayResults(analysis) {
    console.log('Displaying analysis:', analysis);
    
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'block';

    // Display score
    const scoreElement = document.getElementById('scoreValue');
    if (scoreElement) {
        scoreElement.textContent = analysis.score || 'N/A';
    }

    // Display skills analysis
    const skillsTab = document.getElementById('skillsTab');
    if (skillsTab) {
        if (analysis.skillsAnalysis) {
            // Format skills nicely
            let skillsHtml = '<h4>Skills Assessment</h4>';
            
            if (analysis.skillsAnalysis.technical) {
                skillsHtml += '<h5>Technical Skills:</h5><ul>';
                analysis.skillsAnalysis.technical.forEach(skill => {
                    skillsHtml += `<li>${skill}</li>`;
                });
                skillsHtml += '</ul>';
            }
            
            if (analysis.skillsAnalysis.strengths) {
                skillsHtml += '<h5>Strengths:</h5><ul>';
                analysis.skillsAnalysis.strengths.forEach(strength => {
                    skillsHtml += `<li>${strength}</li>`;
                });
                skillsHtml += '</ul>';
            }
            
            if (analysis.skillsAnalysis.gaps) {
                skillsHtml += '<h5>Areas to Improve:</h5><ul>';
                analysis.skillsAnalysis.gaps.forEach(gap => {
                    skillsHtml += `<li>${gap}</li>`;
                });
                skillsHtml += '</ul>';
            }
            
            skillsTab.innerHTML = skillsHtml;
        } else {
            skillsTab.innerHTML = '<p>No skills analysis available</p>';
        }
    }

    // Display tips
    const tipsTab = document.getElementById('tipsTab');
    if (tipsTab) {
        if (analysis.tips) {
            // Format tips with line breaks
            const tips = analysis.tips.split('\n').filter(tip => tip.trim());
            let tipsHtml = '<h4>Improvement Tips</h4><ul>';
            tips.forEach(tip => {
                tipsHtml += `<li>${tip}</li>`;
            });
            tipsHtml += '</ul>';
            tipsTab.innerHTML = tipsHtml;
        } else {
            tipsTab.innerHTML = '<p>No tips available</p>';
        }
    }

    // Display projects analysis if available
    const projectsTab = document.getElementById('projectsTab');
    if (projectsTab && analysis.projectsAnalysis) {
        let projectsHtml = '<h4>Projects Analysis</h4>';
        
        if (analysis.projectsAnalysis.count) {
            projectsHtml += `<p><strong>Total Projects:</strong> ${analysis.projectsAnalysis.count}</p>`;
        }
        
        if (analysis.projectsAnalysis.quality) {
            projectsHtml += `<p><strong>Quality:</strong> ${analysis.projectsAnalysis.quality}</p>`;
        }
        
        if (analysis.projectsAnalysis.recommendations) {
            projectsHtml += '<h5>Recommendations:</h5><ul>';
            analysis.projectsAnalysis.recommendations.forEach(rec => {
                projectsHtml += `<li>${rec}</li>`;
            });
            projectsHtml += '</ul>';
        }
        
        projectsTab.innerHTML = projectsHtml;
    } else if (projectsTab) {
        projectsTab.innerHTML = '<p>No projects analysis available</p>';
    }
}
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(function(tab) {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });

    const tab = document.getElementById(`${tabName}Tab`);
    if (tab) {
        tab.classList.add('active');
    }
    
    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function analyzeAgain() {
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('uploadSection').style.display = 'block';
}

async function loadHistory() {
    try {
        const token = localStorage.getItem('token');
        console.log('Loading history with token:', token ? 'Token exists' : 'No token');
        
        if (!token) {
            console.log('No token found, redirecting to login');
            window.location.href = '/pages/login.html';
            return;
        }

        const response = await fetch('http://localhost:5001/api/analysis/history', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('History response status:', response.status);

        if (response.status === 401) {
            // Token expired or invalid
            console.log('Token expired, redirecting to login');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/pages/login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Received non-JSON response');
        }

        const data = await response.json();
        console.log('History data received:', data);

        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        if (!data.analyses || data.analyses.length === 0) {
            historyList.innerHTML = '<p class="no-history">No previous analyses found. Upload your first resume to get started!</p>';
        } else {
            historyList.innerHTML = data.analyses.map(function(analysis) {
                const date = new Date(analysis.date).toLocaleDateString();
                return `
                    <div class="history-item" onclick="viewAnalysis('${analysis._id}')">
                        <span class="history-date">${date}</span>
                        <span class="history-score">Score: ${analysis.hireMeScore || 'N/A'}</span>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('❌ Error loading history:', error);
        
        const historyList = document.getElementById('historyList');
        if (historyList) {
            historyList.innerHTML = '<p class="error-message">Unable to load history. Please try again later.</p>';
        }
    }
}

// Make functions global so they can be called from HTML
window.showTab = showTab;
window.analyzeAgain = analyzeAgain;
window.logout = function() {
    firebase.auth().signOut()
        .then(function() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/pages/login.html';
        })
        .catch(function(error) {
            console.error('Logout error:', error);
            alert('Error logging out: ' + error.message);
        });
};
// Add this to your dashboard.js file

// Update the setupFileUpload function to show file info
function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('resumeUpload');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    
    if (!uploadArea || !fileInput) return;

    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#f0f0f0';
        uploadArea.style.borderColor = 'var(--primary-color)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.backgroundColor = 'white';
        uploadArea.style.borderColor = 'transparent';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = 'white';
        uploadArea.style.borderColor = 'transparent';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            displayFileInfo(files[0]);
            handleFileUpload(files[0]);
        }
    });

    // File selection
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            displayFileInfo(e.target.files[0]);
            handleFileUpload(e.target.files[0]);
        }
    });

    function displayFileInfo(file) {
        if (fileInfo && fileName && fileSize) {
            fileName.textContent = file.name;
            
            // Format file size
            let size = file.size;
            if (size < 1024) {
                fileSize.textContent = size + ' B';
            } else if (size < 1024 * 1024) {
                fileSize.textContent = (size / 1024).toFixed(1) + ' KB';
            } else {
                fileSize.textContent = (size / (1024 * 1024)).toFixed(1) + ' MB';
            }
            
            fileInfo.style.display = 'flex';
            
            // Show progress bar
            if (uploadProgress && progressFill) {
                uploadProgress.style.display = 'block';
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 10;
                    progressFill.style.width = progress + '%';
                    if (progress >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            uploadProgress.style.display = 'none';
                            progressFill.style.width = '0%';
                        }, 500);
                    }
                }, 100);
            }
        }
    }
}