const Document = require('../models/Document');
const Customer = require('../models/Customer');
const fs = require('fs');
const path = require('path');
const ImageKit = require('imagekit');

// Initialize ImageKit with your credentials from the Developer section of the ImageKit dashboard
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
exports.getDocuments = async (req, res) => {
  try {
    const { customer, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (customer) query.customer = customer;
    
    // ✅ Handle multiple status values
    if (status) {
      // Split by comma and trim whitespace
      const statusArray = status.split(',').map(s => s.trim());
      // If there are multiple statuses, use $in operator
      if (statusArray.length > 1) {
        query.status = { $in: statusArray };
      } else {
        query.status = statusArray[0];
      }
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
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('customer', 'name company contact');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload document
// @route   POST /api/documents
// @access  Private
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const { name, type, customerId, entryDate, expiryDate, notes } = req.body;

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

      // 1. Upload the file buffer to ImageKit
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer, // The file buffer from multer
      fileName: `${Date.now()}-${req.file.originalname}`, // Unique file name
      folder: '/documents', // Optional: Organize in an ImageKit folder
      // isPrivateFile: true, // Optional: Set to true if files should not be publicly accessible
    });

    const document = await Document.create({
      name: req.body.name,
      type: req.body.type,
      customer: req.body.customerId,
      // Store the URL from ImageKit
      fileUrl: uploadResponse.url,
      // Store the ImageKit fileId for future operations (like deletion)
      fileId: uploadResponse.fileId,
      fileName: uploadResponse.name,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      entryDate: entryDate || Date.now(),
      expiryDate,
      notes,
      createdBy: req.user.id
    });

    // Add document to customer's documents array
    customer.documents.push(document._id);
    await customer.save();

    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
     console.error('ImageKit upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'File upload failed' });
  }
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
exports.updateDocument = async (req, res) => {
  try {
    let document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // ✅ Recalculate status based on the new expiry date
    const { expiryDate, name, type, notes, entryDate } = req.body;
    
    // Prepare update data
    const updateData = {
      name: name || document.name,
      type: type || document.type,
      notes: notes !== undefined ? notes : document.notes,
      entryDate: entryDate || document.entryDate,
      updatedAt: Date.now()
    };

    // If expiry date is provided, update it and recalculate status
    if (expiryDate) {
      updateData.expiryDate = expiryDate;
      
      // Calculate days until expiry
      const now = new Date();
      const expiry = new Date(expiryDate);
      const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      
      // Determine status based on days left
      if (expiry < now) {
        updateData.status = 'Expired';
      } else if (daysUntilExpiry <= 7) {
        updateData.status = 'Critical';
      } else if (daysUntilExpiry <= 30) {
        updateData.status = 'Expiring Soon';
      } else {
        updateData.status = 'Valid';
      }
    }

    // Update the document
    document = await Document.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { 
        new: true, 
        runValidators: true 
      }
    );

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete file from filesystem
     if (document.fileId) {
      try {
        await imagekit.deleteFile(document.fileId);
      } catch (err) {
        console.log('ImageKit file deletion error:', err);
        // You might want to log this but continue to delete the DB record
      }
    }
    // Remove document from customer's documents array
    await Customer.updateOne(
      { _id: document.customer },
      { $pull: { documents: document._id } }
    );

    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    View document file
// @route   GET /api/documents/:id/view
// @access  Private
exports.viewDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // ✅ Redirect to ImageKit URL
    if (document.fileUrl) {
      return res.redirect(document.fileUrl);
    }

    return res.status(404).json({
      success: false,
      message: 'File URL not found'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// backend/src/controllers/documentController.js

// @desc    Download document file
// @route   GET /api/documents/:id/download
// @access  Private
exports.downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (!document.fileUrl) {
      return res.status(404).json({
        success: false,
        message: 'File URL not found'
      });
    }

    // ✅ Add download parameter to force download
    const downloadUrl = `${document.fileUrl}?download=true`;
    
    // Option 1: Redirect to ImageKit (recommended)
    return res.redirect(downloadUrl);
    
    // Option 2: Proxy through backend (if you need to add auth or logging)
    /*
    const axios = require('axios');
    const response = await axios({
      method: 'get',
      url: document.fileUrl,
      responseType: 'stream',
    });
    
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    response.data.pipe(res);
    */
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};