const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: "", // Optional — will be filled from `type` if missing
  },
  name: {
    type: String,
    trim: true,
    default: "", // Optional — will be filled from `type` if missing
  },
  type: {
    type: String,
    required: true,
    trim: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileId: {
    type: String, // needed for ImageKit deletion
  },
  fileName: String,
  fileType: String,
  fileSize: Number,
  entryDate: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    default: null, // ✅ Now optional
  },
  status: {
    type: String,
    enum: ["Valid", "Expiring Soon", "Expired", "Critical", "No Expiry"],
    default: "No Expiry",
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
  reminderDate: Date,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamps + status on save
documentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // If name missing, fall back to type
  if (!this.name && this.type) {
    this.name = this.type;
  }

  // Recalculate status only if there's an expiry date
  if (!this.expiryDate) {
    this.status = "No Expiry";
    return next();
  }

  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (this.expiryDate - now) / (1000 * 60 * 60 * 24),
  );

  if (this.expiryDate < now) {
    this.status = "Expired";
  } else if (daysUntilExpiry <= 7) {
    this.status = "Critical";
  } else if (daysUntilExpiry <= 30) {
    this.status = "Expiring Soon";
  } else {
    this.status = "Valid";
  }

  next();
});

// Indexes for performance
documentSchema.index({ customer: 1 });
documentSchema.index({ expiryDate: 1 });
documentSchema.index({ status: 1 });

module.exports = mongoose.model("Document", documentSchema);
