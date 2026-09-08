const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateProfile,
  updatePassword,
  updatePreferences,
} = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getSettings);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.put('/preferences', protect, updatePreferences);

module.exports = router;