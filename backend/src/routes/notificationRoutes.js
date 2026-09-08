// src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  generateNotifications,
  testEmail
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

router.get('/', getNotifications);
router.get('/test-email', protect, testEmail);
router.put('/read-all', markAllNotificationsRead);
router.post('/generate', generateNotifications);
router.put('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);

// Admin only route for generating notifications

module.exports = router;