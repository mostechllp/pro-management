const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a document name'],
    trim: true
  },
  type: {
    type: String,
    enum: ['Trade License', 'Emirates ID', 'Passport', 'Visa', 'Labour Card', 'VAT Certificate', 'Other'],
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: String,
  fileType: String,
  fileSize: Number,
  entryDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please add an expiry date']
  },
  status: {
    type: String,
    enum: ['Valid', 'Expiring Soon', 'Expired', 'Critical'],
    default: 'Valid'
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderDate: Date,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
documentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Update status based on expiry date
  const now = new Date();
  const daysUntilExpiry = Math.ceil((this.expiryDate - now) / (1000 * 60 * 60 * 24));
  
  if (this.expiryDate < now) {
    this.status = 'Expired';
  } else if (daysUntilExpiry <= 7) {
    this.status = 'Critical';
  } else if (daysUntilExpiry <= 30) {
    this.status = 'Expiring Soon';
  } else {
    this.status = 'Valid';
  }
  next();
});

// Indexes for performance
documentSchema.index({ customer: 1 });
documentSchema.index({ expiryDate: 1 });
documentSchema.index({ status: 1 });

module.exports = mongoose.model('Document', documentSchema);