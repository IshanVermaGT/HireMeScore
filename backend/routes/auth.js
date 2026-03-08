const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Test route to make sure router is working
router.get('/test', (req, res) => {
    res.json({ message: 'Auth router is working' });
});

// Actual routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/verify-token', authController.verifyToken);

module.exports = router;