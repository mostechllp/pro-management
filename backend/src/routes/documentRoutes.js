const express = require('express');
const router = express.Router();
const {
  getDocuments,
  getDocument,
  uploadDocument,
  bulkUploadDocuments,
  updateDocument,
  deleteDocument,
  viewDocument,
  downloadDocument,
} = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Single + list
router.route('/')
  .get(protect, getDocuments)
  .post(protect, upload.single('file'), uploadDocument);

// Keep the legacy multi-file bulk endpoint (no count cap now)
router.post(
  '/bulk',
  protect,
  upload.array('files'),   
  bulkUploadDocuments
);

router.post(
  '/bulk/single',
  protect,
  upload.single('file'),
  uploadDocument    // same controller — req.file holds exactly one file
);

// Single resource
router.route('/:id')
  .get(protect, getDocument)
  .put(protect, updateDocument)
  .delete(protect, deleteDocument);

router.get('/:id/view', protect, viewDocument);
router.get('/:id/download', protect, downloadDocument);

module.exports = router;