const mongoose = require('mongoose');

const documentTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Document type name is required'],
      unique: true,
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

documentTypeSchema.index({ name: 1 });

module.exports = mongoose.model('DocumentType', documentTypeSchema);