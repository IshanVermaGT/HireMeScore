const { admin } = require('../config/firebase');

exports.verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        console.log('Verifying token...');
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log('Token verified for user:', decodedToken.uid);
        
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};