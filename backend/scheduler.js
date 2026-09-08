// scheduler.js
const cron = require('node-cron');
const notificationService = require('./src/services/notificationService');
const Notification = require('./src/models/Notification');
const Document = require('./src/models/Document');
const User = require('./src/models/User');

// ✅ Run in-app notifications every minute (for header bell icon)
cron.schedule('* * * * *', async () => {
  console.log('🔄 Running in-app notification check...', new Date().toISOString());
  try {
    const dbResult = await generateDatabaseNotifications();
    if (dbResult.notificationsCreated > 0) {
      console.log('📱 In-app notifications generated:', dbResult);
    }
  } catch (error) {
    console.error('❌ In-app notification check failed:', error);
  }
});

// ✅ Run email notifications daily at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('📧 Running daily email notification check...', new Date().toISOString());
  try {
    const emailResult = await notificationService.checkAndSendExpiryNotifications();
    console.log('📧 Email notifications sent:', emailResult);
  } catch (error) {
    console.error('❌ Email notification check failed:', error);
  }
});

console.log('📅 Scheduler started.');
console.log('📱 In-app notifications: Every minute');
console.log('📧 Email notifications: Daily at 9:00 AM');

// ✅ Function to generate database notifications (for in-app)
async function generateDatabaseNotifications() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    
    const oneDayLater = new Date(today);
    oneDayLater.setDate(today.getDate() + 1);

    const users = await User.find({ role: 'admin' });
    let notificationsCreated = 0;

    for (const user of users) {
      // 📌 Get ALL documents expiring within 7 days (not just exact dates)
      const expiringDocs = await Document.find({
        expiryDate: {
          $gte: today,
          $lte: sevenDaysLater
        },
        status: { $ne: 'Expired' }
      }).populate('customer');

      for (const doc of expiringDocs) {
        const daysLeft = Math.ceil((new Date(doc.expiryDate) - today) / (1000 * 60 * 60 * 24));
        
        let type, message;
        if (daysLeft <= 1) {
          type = 'EXPIRING_1_DAY';
          message = `Document "${doc.name}" for ${doc.customer?.name || 'Unknown Customer'} expires ${daysLeft === 0 ? 'today' : 'tomorrow'}!`;
        } else if (daysLeft <= 7) {
          type = 'EXPIRING_7_DAYS';
          message = `Document "${doc.name}" for ${doc.customer?.name || 'Unknown Customer'} expires in ${daysLeft} days.`;
        }

        // Check if notification already exists for this document and user
        const existing = await Notification.findOne({
          user: user._id,
          documentId: doc._id,
          type: type
        });

        if (!existing) {
          await Notification.create({
            user: user._id,
            documentId: doc._id,
            type: type,
            message: message,
            data: {
              customerName: doc.customer?.name || 'Unknown Customer',
              daysLeft: daysLeft
            }
          });
          notificationsCreated++;
          console.log(`Created ${type} notification for: ${doc.name} (${daysLeft} days left)`);
        }
      }

      // 📌 Get recently expired documents
      const recentlyExpired = await Document.find({
        expiryDate: {
          $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          $lt: today
        },
        status: 'Expired'
      }).populate('customer');

      for (const doc of recentlyExpired) {
        const daysOverdue = Math.ceil((today - new Date(doc.expiryDate)) / (1000 * 60 * 60 * 24));
        
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
            message: `Document "${doc.name}" for ${doc.customer?.name || 'Unknown Customer'} expired ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago!`,
            data: {
              customerName: doc.customer?.name || 'Unknown Customer',
              daysOverdue: daysOverdue
            }
          });
          notificationsCreated++;
          console.log(`Created EXPIRED notification for: ${doc.name}`);
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

// ✅ Uncomment for testing - run once on startup
// generateDatabaseNotifications();