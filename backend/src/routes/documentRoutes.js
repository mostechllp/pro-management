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

// ✅ Bulk upload — accepts up to 10 files under the `files` field
router.post(
  '/bulk',
  protect,
  upload.array('files', 10),
  bulkUploadDocuments
);

// Single resource
router.route('/:id')
  .get(protect, getDocument)
  .put(protect, updateDocument)
  .delete(protect, deleteDocument);

router.get('/:id/view', protect, viewDocument);
router.get('/:id/download', protect, downloadDocument);

module.exports = router;