// services/notificationService.js
const Document = require('../models/Document');
const Customer = require('../models/Customer');
const User = require('../models/User');
const emailService = require('./emailService');

class NotificationService {
  async checkAndSendExpiryNotifications() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let notificationsSent = 0;
      const adminUsers = await User.find({ role: 'admin' });
      
      if (adminUsers.length === 0) {
        console.log('No admin users found to send notifications');
        return { success: true, notificationsSent: 0 };
      }

      // 📧 Send 3-day reminders
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(today.getDate() + 3);
      
      const expiringIn3Days = await Document.find({
        expiryDate: {
          $gte: threeDaysLater,
          $lt: new Date(threeDaysLater.getTime() + 24 * 60 * 60 * 1000)
        },
        reminderSent: false,
        status: { $ne: 'Expired' }
      }).populate('customer');

      for (const doc of expiringIn3Days) {
        await this.sendNotificationToAdmins(adminUsers, doc, 3);
        doc.reminderSent = true;
        doc.reminderDate = now;
        await doc.save();
        notificationsSent++;
        console.log(`📧 3-day reminder sent for: ${doc.name}`);
      }

      // 📧 Send 1-day reminders (URGENT)
      const oneDayLater = new Date(today);
      oneDayLater.setDate(today.getDate() + 1);
      
      const expiringIn1Day = await Document.find({
        expiryDate: {
          $gte: oneDayLater,
          $lt: new Date(oneDayLater.getTime() + 24 * 60 * 60 * 1000)
        },
        reminderSent: true, // Should have 3-day reminder already sent
        status: { $ne: 'Expired' }
      }).populate('customer');

      for (const doc of expiringIn1Day) {
        await this.sendNotificationToAdmins(adminUsers, doc, 1, true);
        doc.reminderDate = now;
        await doc.save();
        notificationsSent++;
        console.log(`🚨 URGENT 1-day reminder sent for: ${doc.name}`);
      }

      return {
        success: true,
        notificationsSent,
        details: {
          threeDayReminders: expiringIn3Days.length,
          oneDayReminders: expiringIn1Day.length
        }
      };
    } catch (error) {
      console.error('Error sending expiry notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendNotificationToAdmins(admins, doc, daysLeft, isUrgent = false) {
    for (const admin of admins) {
      try {
        await emailService.sendExpiryNotification(
          admin.email,
          doc.name,
          doc.customer?.name || 'Unknown Customer',
          doc.expiryDate,
          daysLeft,
          isUrgent
        );
      } catch (error) {
        console.error(`Failed to send email to ${admin.email}:`, error);
      }
    }
  }
}

module.exports = new NotificationService();