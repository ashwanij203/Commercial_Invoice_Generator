const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, shopName, shopAddress, shopPhone, shopGSTIN, securityQuestion, securityAnswer } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name, email, password,
      shopName: shopName || 'Jaiswal Furniture & Electronics',
      shopAddress: shopAddress || 'Abu, Rajasthan, India',
      shopPhone: shopPhone || '',
      shopGSTIN: shopGSTIN || '',
      securityQuestion: securityQuestion || '',
      securityAnswer: securityAnswer || ''
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopName: user.shopName,
        shopAddress: user.shopAddress,
        shopPhone: user.shopPhone,
        shopGSTIN: user.shopGSTIN
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopName: user.shopName,
        shopAddress: user.shopAddress,
        shopPhone: user.shopPhone,
        shopGSTIN: user.shopGSTIN
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get security question for a user (step 1 of reset)
// @route   POST /api/auth/security-question
const getSecurityQuestion = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists - generic message
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    if (!user.securityQuestion) {
      return res.status(400).json({ success: false, message: 'No security question set for this account. Contact administrator.' });
    }

    res.json({
      success: true,
      securityQuestion: user.securityQuestion
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password using security answer
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, securityAnswer, newPassword } = req.body;

    if (!email || !securityAnswer || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please fill all fields' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email }).select('+securityAnswer +password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    if (!user.securityAnswer) {
      return res.status(400).json({ success: false, message: 'No security question set for this account' });
    }

    // Verify security answer
    const isCorrect = await user.compareSecurityAnswer(securityAnswer);
    if (!isCorrect) {
      return res.status(401).json({ success: false, message: 'Incorrect security answer' });
    }

    // Update password
    user.password = newPassword;
    await user.save(); // pre-save hook will hash it

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopName: user.shopName,
        shopAddress: user.shopAddress,
        shopPhone: user.shopPhone,
        shopGSTIN: user.shopGSTIN
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get list of available security questions
// @route   GET /api/auth/security-questions
const getSecurityQuestions = async (req, res) => {
  res.json({ success: true, questions: User.getSecurityQuestions() });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      shopName: req.user.shopName,
      shopAddress: req.user.shopAddress,
      shopPhone: req.user.shopPhone,
      shopGSTIN: req.user.shopGSTIN,
      hasSecurityQuestion: !!req.user.securityQuestion
    }
  });
};

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, shopName, shopAddress, shopPhone, shopGSTIN } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, shopName, shopAddress, shopPhone, shopGSTIN },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile, resetPassword, getSecurityQuestion, getSecurityQuestions };
