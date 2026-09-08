const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  // New fields used by the Settings > Profile tab
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'user'],
    default: 'user',
  },
  // New: Settings > Preferences tab
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    expiryReminderDays: {
      type: Number,
      enum: [7, 15, 30, 60],
      default: 30,
    },
    dateFormat: {
      type: String,
      enum: ['dd MMM yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'],
      default: 'dd MMM yyyy',
    },
    itemsPerPage: {
      type: Number,
      enum: [10, 25, 50],
      default: 10,
    },
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);