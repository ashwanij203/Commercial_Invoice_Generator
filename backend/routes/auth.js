const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, resetPassword, getSecurityQuestion, getSecurityQuestions } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Password recovery routes
router.get('/security-questions', getSecurityQuestions);
router.post('/security-question', getSecurityQuestion);
router.post('/reset-password', resetPassword);

module.exports = router;
