const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SECURITY_QUESTIONS = [
  'What is your mother\'s maiden name?',
  'What was the name of your first pet?',
  'What city were you born in?',
  'What is your favorite movie?',
  'What was your childhood nickname?'
];

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['admin'],
    default: 'admin'
  },
  securityQuestion: {
    type: String,
    default: ''
  },
  securityAnswer: {
    type: String,
    select: false // Don't return answer by default
  },
  shopName: {
    type: String,
    default: 'Jaiswal Furniture & Electronics'
  },
  shopAddress: {
    type: String,
    default: 'Abu, Rajasthan, India'
  },
  shopPhone: {
    type: String,
    default: ''
  },
  shopGSTIN: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Hash security answer before saving (lowercase + trimmed for consistent comparison)
userSchema.pre('save', async function(next) {
  if (!this.isModified('securityAnswer') || !this.securityAnswer) return next();
  this.securityAnswer = await bcrypt.hash(this.securityAnswer.toLowerCase().trim(), 10);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Compare security answer
userSchema.methods.compareSecurityAnswer = async function(candidateAnswer) {
  if (!this.securityAnswer) return false;
  return await bcrypt.compare(candidateAnswer.toLowerCase().trim(), this.securityAnswer);
};

// Static: get available security questions
userSchema.statics.getSecurityQuestions = function() {
  return SECURITY_QUESTIONS;
};

module.exports = mongoose.model('User', userSchema);
