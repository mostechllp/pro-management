const DocumentType = require('../models/DocumentType');

const DEFAULT_TYPES = [
  'Trade License',
  'Emirates ID',
  'Passport',
  'Visa',
  'Labour Card',
  'VAT Certificate',
  'Establishment Card',
  'MOA',
  'Power of Attorney',
  'Insurance',
  'Other',
];

// Seed defaults if collection is empty
const ensureDefaults = async () => {
  const count = await DocumentType.countDocuments();
  if (count === 0) {
    await DocumentType.insertMany(
      DEFAULT_TYPES.map((name) => ({ name, isDefault: true }))
    );
  }
};

// GET /api/document-types
exports.getDocumentTypes = async (req, res) => {
  try {
    await ensureDefaults();
    const types = await DocumentType.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: types,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/document-types
exports.addDocumentType = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: 'Type name is required' });
    }

    const trimmed = name.trim();

    // Case-insensitive duplicate check
    const existing = await DocumentType.findOne({
      name: { $regex: new RegExp(`^${trimmed}$`, 'i') },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        data: existing,
        message: 'Type already exists',
      });
    }

    const newType = await DocumentType.create({
      name: trimmed,
      isDefault: false,
      createdBy: req.user?.id,
    });

    res.status(201).json({ success: true, data: newType });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: 'Type already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/document-types/:id
exports.updateDocumentType = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: 'Type name is required' });
    }

    const type = await DocumentType.findById(req.params.id);
    if (!type) {
      return res
        .status(404)
        .json({ success: false, message: 'Document type not found' });
    }

    type.name = name.trim();
    await type.save();

    res.status(200).json({ success: true, data: type });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: 'Type already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/document-types/:id
exports.deleteDocumentType = async (req, res) => {
  try {
    const type = await DocumentType.findById(req.params.id);
    if (!type) {
      return res
        .status(404)
        .json({ success: false, message: 'Document type not found' });
    }

    if (type.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Default document types cannot be deleted',
      });
    }

    await type.deleteOne();
    res
      .status(200)
      .json({ success: true, message: 'Document type deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};