const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a customer name'],
    trim: true
  },
  company: {
    type: String,
    trim: true,
    default: ''
  },
  contact: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    emirates: { type: String, default: '' },
    country: { type: String, default: 'United Arab Emirates' },
    zipCode: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending'],
    default: 'Active'
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps on save
customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search
customerSchema.index({ name: 'text', company: 'text' });

module.exports = mongoose.model('Customer', customerSchema);