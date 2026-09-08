// scheduler.js
const cron = require('node-cron');
const notificationService = require('./src/services/notificationService');
const Notification = require('./src/models/Notification');
const Document = require('./src/models/Document');
const User = require('./src/models/User');

// Run every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('🔄 Running daily notification check...');
  try {
    // 1. Send email notifications
    const emailResult = await notificationService.checkAndSendExpiryNotifications();
    console.log('📧 Email notifications sent:', emailResult);

    // 2. Generate in-app database notifications
    const dbResult = await generateDatabaseNotifications();
    console.log('📱 Database notifications generated:', dbResult);
  } catch (error) {
    console.error('❌ Notification check failed:', error);
  }
});

console.log('📅 Scheduler started. Will check daily at 9:00 AM');

// ✅ Function to generate database notifications
async function generateDatabaseNotifications() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    
    const oneDayLater = new Date(today);
    oneDayLater.setDate(today.getDate() + 1);

    // Get admin users (or all users who should receive notifications)
    const users = await User.find({ role: 'admin' });
    let notificationsCreated = 0;

    for (const user of users) {
      // 📌 Get documents expiring in 1 day
      const expiringIn1Day = await Document.find({
        expiryDate: {
          $gte: oneDayLater,
          $lt: new Date(oneDayLater.getTime() + 24 * 60 * 60 * 1000)
        },
        status: { $ne: 'Expired' }
      }).populate('customer');

      for (const doc of expiringIn1Day) {
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
            message: `⚠️ Document "${doc.name}" for ${doc.customer?.name || 'Unknown Customer'} expires tomorrow!`,
            data: {
              customerName: doc.customer?.name || 'Unknown Customer',
              daysLeft: 1
            }
          });
          notificationsCreated++;
          console.log(`📱 Created 1-day notification for: ${doc.name}`);
        }
      }

      // 📌 Get documents expiring in 7 days
      const expiringIn7Days = await Document.find({
        expiryDate: {
          $gte: sevenDaysLater,
          $lt: new Date(sevenDaysLater.getTime() + 24 * 60 * 60 * 1000)
        },
        status: { $ne: 'Expired' }
      }).populate('customer');

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
            message: `📄 Document "${doc.name}" for ${doc.customer?.name || 'Unknown Customer'} expires in 7 days.`,
            data: {
              customerName: doc.customer?.name || 'Unknown Customer',
              daysLeft: 7
            }
          });
          notificationsCreated++;
          console.log(`📱 Created 7-day notification for: ${doc.name}`);
        }
      }

      // 📌 Get recently expired documents
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
            message: `🚫 Document "${doc.name}" for ${doc.customer?.name || 'Unknown Customer'} has expired!`,
            data: {
              customerName: doc.customer?.name || 'Unknown Customer',
              daysOverdue: 1
            }
          });
          notificationsCreated++;
          console.log(`📱 Created expired notification for: ${doc.name}`);
        }
      }
    }

    return {
      success: true,
      notificationsCreated
    };
  } catch (error) {
    console.error('Error generating database notifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ✅ For testing - run immediately (optional)
// Comment this out in production
// generateDatabaseNotifications();