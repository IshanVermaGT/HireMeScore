// Simple console log to confirm loading
console.log("auth.js loaded");

// Domain options
const domains = {
    technical: [
        'Software Development', 'Data Science', 'DevOps',
        'Cloud Computing', 'Cybersecurity', 'AI/ML',
        'Mobile Development', 'Web Development', 'Game Development',
        'Embedded Systems'
    ],
    'non-technical': [
        'Marketing', 'Sales', 'Human Resources', 'Finance',
        'Operations', 'Project Management', 'Business Development',
        'Customer Support', 'Content Writing', 'Graphic Design'
    ]
};

// Wait for page to load
document.addEventListener("DOMContentLoaded", function () {
    console.log("Page loaded");

    // Check if Firebase exists
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded');
        alert('Firebase failed to load. Please refresh the page.');
        return;
    }

    console.log("Firebase is available");

    // =========================
    // SIGNUP FORM
    // =========================
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        console.log("Signup form found");
        
        const userType = document.getElementById('userType');
        const domain = document.getElementById('domain');
        const githubGroup = document.getElementById('githubGroup');

        // Update domain dropdown when user type changes
        userType.addEventListener('change', function() {
            const selectedType = this.value;
            console.log("User type:", selectedType);
            
            // Clear domain dropdown
            domain.innerHTML = '<option value="">Select your domain</option>';
            
            // Add new options
            if (selectedType && domains[selectedType]) {
                domains[selectedType].forEach(function(d) {
                    const option = document.createElement('option');
                    option.value = d;
                    option.textContent = d;
                    domain.appendChild(option);
                });
            }
            
            // Show/hide GitHub field
            if (githubGroup) {
                githubGroup.style.display = selectedType === 'technical' ? 'block' : 'none';
            }
        });
        
        // Handle form submission
        // Handle form submission
signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log("Form submitted");

    // Get values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const userTypeValue = document.getElementById('userType').value;
    const domainValue = document.getElementById('domain').value;
    const cgpa = parseFloat(document.getElementById('cgpa').value);
    const github = document.getElementById('github') ? document.getElementById('github').value : '';

    if (!userTypeValue || !domainValue) {
        alert('Please select background and domain');
        return;
    }

    try {
        console.log("Creating Firebase user...");
        
        // Create user with Firebase
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        console.log("✅ User created in Firebase:", userCredential.user.uid);

        // Update profile
        await userCredential.user.updateProfile({
            displayName: name
        });

        // Prepare data for backend - THIS IS WHERE THE CHANGE IS
        const userData = {
            uid: userCredential.user.uid,  // ← ADD THIS LINE
            email: email,
            name: name,
            userType: userTypeValue,
            domain: domainValue,
            cgpa: cgpa
        };

        // Only add githubProfile for technical users
        if (userTypeValue === 'technical') {
            userData.githubProfile = github || "https://github.com/placeholder";
        }

        console.log("Sending to backend:", userData);

        // Send to backend
        const response = await fetch('http://localhost:5001/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)  // Now includes uid
        });

        const data = await response.json();
        console.log("Backend response:", data);

        if (response.ok) {
            // Success - redirect
            const idToken = await userCredential.user.getIdToken();
            localStorage.setItem('token', idToken);
            localStorage.setItem('user', JSON.stringify({
                name: name,
                email: email,
                userType: userTypeValue,
                domain: domainValue
            }));
            
            window.location.href = '/pages/dashboard.html';
        } else {
            throw new Error(data.error || 'Signup failed');
        }
    } catch (error) {
        console.error('❌ Signup error:', error);
        
        // Better error messages
        if (error.code === 'auth/email-already-in-use') {
            alert('This email is already registered. Please use a different email or login.');
        } else if (error.code === 'auth/weak-password') {
            alert('Password should be at least 6 characters.');
        } else {
            alert('Error: ' + error.message);
        }
    }
});
    }
    // =========================
    // LOGIN FORM
    // =========================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log("Login form found");
        
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                console.log("Attempting login...");
                
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                console.log("✅ Firebase login successful");

                const idToken = await userCredential.user.getIdToken();
                console.log("Got token");

                const response = await fetch('http://localhost:5001/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ idToken: idToken })
                });

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('Server returned non-JSON response');
                }

                const data = await response.json();
                console.log("Backend response:", data);

                if (response.ok && data.user) {
                    localStorage.setItem('token', idToken);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = '/pages/dashboard.html';
                } else {
                    throw new Error(data.error || 'Login failed');
                }
            } catch (error) {
                console.error('❌ Login error:', error);
                
                if (error.code === 'auth/wrong-password') {
                    alert('Wrong password');
                } else if (error.code === 'auth/user-not-found') {
                    alert('User not found');
                } else if (error.code === 'auth/too-many-requests') {
                    alert('Too many failed attempts. Please try again later.');
                } else {
                    alert('Error: ' + error.message);
                }
            }
        });
    }
});


// =========================
// LOGOUT FUNCTION (Global)
// =========================
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