// src/controllers/notificationController.js
const Notification = require('../models/Notification');
const Document = require('../models/Document');

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('documentId', 'name type status expiryDate customer')
      .populate({
        path: 'documentId',
        populate: {
          path: 'customer',
          select: 'name company'
        }
      });

    const total = await Notification.countDocuments({ user: req.user.id });
    const unreadCount = await Notification.countDocuments({ 
      user: req.user.id, 
      read: false 
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { 
        read: true, 
        readAt: new Date() 
      }
    );

    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create notifications for expiring documents (called by scheduler)
// @route   POST /api/notifications/generate
// @access  Private (Admin only)
exports.generateNotifications = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    
    const oneDayLater = new Date(today);
    oneDayLater.setDate(today.getDate() + 1);

    // Get all users (for now, we'll notify admins)
    const User = require('../models/User');
    const users = await User.find({ role: 'admin' });

    let notificationsCreated = 0;

    for (const user of users) {
      // Get documents expiring in 1 day
      const expiringIn1Day = await Document.find({
        expiryDate: {
          $gte: oneDayLater,
          $lt: new Date(oneDayLater.getTime() + 24 * 60 * 60 * 1000)
        },
        status: { $ne: 'Expired' }
      }).populate('customer');

      // Create notifications for 1-day expiry
      for (const doc of expiringIn1Day) {
        // Check if notification already exists for this document and user
        const existing = await Notification.findOne({
          user: user._id,
          documentId: doc._id,
          type: 'EXPIRING_1_DAY'
        });

        if (!existing) {
          await Notification.create({
            user: user._id,
            documentId: doc._id,
            type: 'EXPIRING_1_DAY',
            message: `Document "${doc.name}" for ${doc.customer?.name || 'Unknown Customer'} expires tomorrow!`,
            data: {
              customerName: doc.customer?.name || 'Unknown Customer',
              daysLeft: 1
            }
          });
          notificationsCreated++;
        }
      }

      // Get documents expiring in 7 days
      const expiringIn7Days = await Document.find({
        expiryDate: {
          $gte: sevenDaysLater,
          $lt: new Date(sevenDaysLater.getTime() + 24 * 60 * 60 * 1000)
        },
        status: { $ne: 'Expired' }
      }).populate('customer');

      // Create notifications for 7-day expiry
      for (const doc of expiringIn7Days) {
        const existing = await Notification.findOne({
          user: user._id,
          documentId: doc._id,
          type: 'EXPIRING_7_DAYS'
        });

        if (!existing) {
          await Notification.create({
            user: user._id,
            documentId: doc._id,
            type: 'EXPIRING_7_DAYS',
            message: `Document "${doc.name}" for ${doc.customer?.name || 'Unknown Customer'} expires in 7 days.`,
            data: {
              customerName: doc.customer?.name || 'Unknown Customer',
              daysLeft: 7
            }
          });
          notificationsCreated++;
        }
      }

      // Get expired documents (create notifications for recently expired)
      const recentlyExpired = await Document.find({
        expiryDate: {
          $gte: new Date(today.getTime() - 24 * 60 * 60 * 1000),
          $lt: today
        },
        status: 'Expired'
      }).populate('customer');

      for (const doc of recentlyExpired) {
        const existing = await Notification.findOne({
          user: user._id,
          documentId: doc._id,
          type: 'EXPIRED'
        });

        if (!existing) {
          await Notification.create({
            user: user._id,
            documentId: doc._id,
            type: 'EXPIRED',
            message: `Document "${doc.name}" for ${doc.customer?.name || 'Unknown Customer'} has expired!`,
            data: {
              customerName: doc.customer?.name || 'Unknown Customer',
              daysOverdue: 1
            }
          });
          notificationsCreated++;
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated ${notificationsCreated} notifications`,
      data: { notificationsCreated }
    });
  } catch (error) {
    console.error('Generate notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add this to notificationController.js or a test route
// @desc    Test email sending
// @route   GET /api/notifications/test-email
// @access  Private (Admin only)
exports.testEmail = async (req, res) => {
  try {
    const emailService = require('../services/emailService');
    const result = await emailService.sendEmail(
      req.user.email, // Send to the requesting user
      'Test Email from PRO Management',
      '<h1>Test Email</h1><p>If you received this, email is working!</p>'
    );
    
    res.status(200).json({
      success: true,
      message: 'Test email sent',
      data: { result }
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};