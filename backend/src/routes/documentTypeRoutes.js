const express = require('express');
const router = express.Router();
const {
  getDocumentTypes,
  addDocumentType,
  updateDocumentType,
  deleteDocumentType,
} = require('../controllers/documentTypeController');
const { protect } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getDocumentTypes)
  .post(protect, addDocumentType);

router
  .route('/:id')
  .put(protect, updateDocumentType)
  .delete(protect, deleteDocumentType);

module.exports = router;