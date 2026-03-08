const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

// Resume analysis endpoint
router.post('/analyze', 
    authMiddleware.verifyToken,
    analysisController.uploadMiddleware,
    analysisController.analyzeResume
);

// Get user's analysis history
router.get('/history', authMiddleware.verifyToken, async (req, res) => {
    try {
        console.log('📥 History request received for user:', req.user.uid);
        
        const user = await User.findOne({ firebaseUid: req.user.uid })
            .select('analyses');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return analyses in reverse chronological order
        const analyses = user.analyses.sort((a, b) => b.date - a.date);
        
        res.json({ analyses });
    } catch (error) {
        console.error('❌ Error loading history:', error);
        res.status(500).json({ error: 'Failed to load history' });
    }
});

module.exports = router;