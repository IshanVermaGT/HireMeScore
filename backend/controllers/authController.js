const { admin } = require('../config/firebase');
const User = require('../models/User');

// SIGNUP FUNCTION
exports.signup = async (req, res) => {
    try {
        console.log('📥 Signup request received:', {
            email: req.body.email,
            name: req.body.name,
            userType: req.body.userType,
            uid: req.body.uid
        });

        const { uid, email, name, userType, domain, cgpa, githubProfile } = req.body;

        // Verify the user exists in Firebase
        const userRecord = await admin.auth().getUser(uid);
        console.log('✅ Verified Firebase user exists:', userRecord.uid);

        // Save to MongoDB
        const user = new User({
            firebaseUid: uid,
            email,
            name,
            userType,
            domain,
            cgpa,
            githubProfile: userType === 'technical' ? githubProfile : undefined
        });

        await user.save();
        console.log('✅ MongoDB user saved successfully');

        res.status(201).json({
            message: 'User created successfully',
            uid: uid
        });

    } catch (error) {
        console.error('❌ Signup error:', error);
        
        if (error.code === 'auth/user-not-found') {
            return res.status(400).json({ error: 'Firebase user not found' });
        }
        
        res.status(400).json({ error: error.message });
    }
};

// LOGIN FUNCTION
exports.login = async (req, res) => {
    try {
        console.log('📥 Login request received');
        
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: 'No token provided' });
        }

        console.log('🔄 Verifying Firebase token...');
        
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log('✅ Token verified for user:', decodedToken.uid);

        const user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            console.log('❌ User not found in MongoDB:', decodedToken.uid);
            return res.status(404).json({ error: 'User not found in database' });
        }

        console.log('✅ User found in MongoDB:', user.email);

        res.json({
            message: 'Login successful',
            user: {
                uid: decodedToken.uid,
                email: decodedToken.email,
                name: user.name,
                userType: user.userType,
                domain: user.domain
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error.message);
        res.status(401).json({ error: 'Invalid token' });
    }
};

// VERIFY TOKEN FUNCTION
exports.verifyToken = async (req, res) => {
    try {
        const { token } = req.body;
        const decodedToken = await admin.auth().verifyIdToken(token);
        res.json({ valid: true, uid: decodedToken.uid });
    } catch (error) {
        res.status(401).json({ valid: false, error: error.message });
    }
};