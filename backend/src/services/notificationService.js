const Document = require('../models/Document');
const Customer = require('../models/Customer');
const User = require('../models/User');
const emailService = require('./emailService');

class NotificationService {
  async checkAndSendExpiryNotifications() {
    try {
      const now = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(now.getDate() + 30);

      // Find documents expiring in next 30 days that haven't had reminders sent
      const expiringDocuments = await Document.find({
        expiryDate: { $gte: now, $lte: thirtyDaysLater },
        reminderSent: false,
        status: { $ne: 'Expired' }
      }).populate('customer');

      const adminUsers = await User.find({ role: 'admin' });

      for (const doc of expiringDocuments) {
        const daysLeft = Math.ceil((doc.expiryDate - now) / (1000 * 60 * 60 * 24));
        
        // Send notification to admin users
        for (const admin of adminUsers) {
          await emailService.sendExpiryNotification(
            admin.email,
            doc.name,
            doc.customer.name,
            doc.expiryDate,
            daysLeft
          );
        }

        // Mark reminder as sent
        doc.reminderSent = true;
        doc.reminderDate = now;
        await doc.save();

        console.log(`Expiry notification sent for document: ${doc.name} (${daysLeft} days left)`);
      }

      return {
        success: true,
        notificationsSent: expiringDocuments.length
      };
    } catch (error) {
      console.error('Error sending expiry notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new NotificationService();