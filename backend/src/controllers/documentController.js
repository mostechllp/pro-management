const Document = require('../models/Document');
const Customer = require('../models/Customer');
const ImageKit = require('imagekit');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Helper: upload one file buffer to ImageKit
const uploadToImageKit = async (file) => {
     return imagekit.upload({
     file: file.buffer.toString('base64'),
     fileName: `${Date.now()}-${file.originalname}`,
     folder: '/documents',
   });
};

// Helper: build Document payload from req.body + file
const buildDocPayload = ({ body, file, uploadResponse, customerId, userId }) => {
  return {
    name: body.name || body.type, // fallback to type
    type: body.type,
    customer: customerId,
    fileUrl: uploadResponse.url,
    fileId: uploadResponse.fileId,
    fileName: uploadResponse.name,
    fileType: file.mimetype,
    fileSize: file.size,
    entryDate: body.entryDate || Date.now(),
    expiryDate: body.expiryDate || null, // ✅ optional now
    notes: body.notes || '',
    createdBy: userId,
  };
};

// ============================================
// GET ALL
// ============================================
exports.getDocuments = async (req, res) => {
  try {
    const { customer, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (customer) query.customer = customer;

    if (status) {
      const statusArray = status.split(',').map((s) => s.trim());
      query.status = statusArray.length > 1 ? { $in: statusArray } : statusArray[0];
    }

    const documents = await Document.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('customer', 'name company')
      .sort({ createdAt: -1 });

    const total = await Document.countDocuments(query);

    res.status(200).json({
      success: true,
      data: documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET ONE
// ============================================
exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate(
      'customer',
      'name company contact'
    );

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: 'Document not found' });
    }

    res.status(200).json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// UPLOAD ONE
// ============================================
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: 'Please upload a file' });
    }

    const { type, customerId, entryDate, expiryDate, notes } = req.body;

    // Validate required fields
    if (!type) {
      return res
        .status(400)
        .json({ success: false, message: 'Document type is required' });
    }
    if (!customerId) {
      return res
        .status(400)
        .json({ success: false, message: 'Customer is required' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' });
    }

    const uploadResponse = await uploadToImageKit(req.file);

    const document = await Document.create(
      buildDocPayload({
        body: { type, entryDate, expiryDate, notes, name: req.body.name },
        file: req.file,
        uploadResponse,
        customerId,
        userId: req.user.id,
      })
    );

    customer.documents.push(document._id);
    await customer.save();

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    console.error('ImageKit upload error:', error);
    res
      .status(500)
      .json({ success: false, message: error.message || 'File upload failed' });
  }
};

// ============================================
// BULK UPLOAD (multiple documents in one request)
// ============================================
exports.bulkUploadDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Please upload at least one file' });
    }

    const { customerId, documents } = req.body;

    if (!customerId) {
      return res
        .status(400)
        .json({ success: false, message: 'Customer is required' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' });
    }

    // `documents` should be an array of metadata objects matching each file
    // e.g. [{ type, entryDate, expiryDate, notes }, ...]
    let metaArray;
    try {
      metaArray = typeof documents === 'string' ? JSON.parse(documents) : documents;
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid documents metadata' });
    }

    if (!Array.isArray(metaArray) || metaArray.length !== req.files.length) {
      return res.status(400).json({
        success: false,
        message:
          'Number of metadata entries must match number of uploaded files',
      });
    }

    // Upload all files in parallel
    const results = await Promise.allSettled(
      req.files.map(async (file, i) => {
        const meta = metaArray[i];

        if (!meta.type) {
          throw new Error(`Document #${i + 1}: type is required`);
        }

        const uploadResponse = await uploadToImageKit(file);

        const doc = await Document.create(
          buildDocPayload({
            body: meta,
            file,
            uploadResponse,
            customerId,
            userId: req.user.id,
          })
        );

        return doc;
      })
    );

    const succeeded = [];
    const failed = [];

    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        succeeded.push(r.value);
      } else {
        failed.push({
          index: i,
          name: req.files[i].originalname,
          reason: r.reason?.message || 'Upload failed',
        });
      }
    });

    // Attach all successful docs to the customer
    if (succeeded.length > 0) {
      customer.documents.push(...succeeded.map((d) => d._id));
      await customer.save();
    }

    return res.status(succeeded.length > 0 ? 201 : 500).json({
      success: succeeded.length > 0,
      data: succeeded,
      failed,
      summary: {
        total: req.files.length,
        uploaded: succeeded.length,
        failed: failed.length,
      },
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res
      .status(500)
      .json({ success: false, message: error.message || 'Bulk upload failed' });
  }
};

// ============================================
// UPDATE
// ============================================
exports.updateDocument = async (req, res) => {
  try {
    let document = await Document.findById(req.params.id);

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: 'Document not found' });
    }

    const { expiryDate, name, type, notes, entryDate } = req.body;

    const updateData = {
      name: name || document.name || type || document.type,
      type: type || document.type,
      notes: notes !== undefined ? notes : document.notes,
      entryDate: entryDate || document.entryDate,
      updatedAt: Date.now(),
    };

    // Allow clearing expiry date by sending null/empty
    if (expiryDate !== undefined) {
      updateData.expiryDate = expiryDate || null;

      if (!updateData.expiryDate) {
        updateData.status = 'No Expiry';
      } else {
        const now = new Date();
        const expiry = new Date(updateData.expiryDate);
        const daysUntilExpiry = Math.ceil(
          (expiry - now) / (1000 * 60 * 60 * 24)
        );

        if (expiry < now) updateData.status = 'Expired';
        else if (daysUntilExpiry <= 7) updateData.status = 'Critical';
        else if (daysUntilExpiry <= 30) updateData.status = 'Expiring Soon';
        else updateData.status = 'Valid';
      }
    }

    document = await Document.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// DELETE
// ============================================
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: 'Document not found' });
    }

    if (document.fileId) {
      try {
        await imagekit.deleteFile(document.fileId);
      } catch (err) {
        console.log('ImageKit file deletion error:', err);
      }
    }

    await Customer.updateOne(
      { _id: document.customer },
      { $pull: { documents: document._id } }
    );

    await document.deleteOne();

    res
      .status(200)
      .json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// VIEW
// ============================================
exports.viewDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    if (!document.fileUrl) {
      return res.status(404).json({ success: false, message: 'File URL not found' });
    }
    return res.status(200).json({ success: true, url: document.fileUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    if (!document.fileUrl) {
      return res.status(404).json({ success: false, message: 'File URL not found' });
    }
    return res
      .status(200)
      .json({ success: true, url: `${document.fileUrl}?ik-attachment=true` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};