const Customer = require('../models/Customer');
const Document = require('../models/Document');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);

    // Get all counts
    const [totalCustomers, totalDocuments] = await Promise.all([
      Customer.countDocuments(),
      Document.countDocuments()
    ]);

    // Get document status counts
    const [expiringSoon, expired, expiringLessThan7Days] = await Promise.all([
      Document.countDocuments({
        expiryDate: { $gte: now, $lte: thirtyDaysLater },
        status: { $ne: 'Expired' }
      }),
      Document.countDocuments({
        expiryDate: { $lt: now }
      }),
      Document.countDocuments({
        expiryDate: { $gte: now, $lte: sevenDaysLater },
        status: { $ne: 'Expired' }
      })
    ]);

    // Get valid documents count
    const valid = totalDocuments - expired;

    // Get recent expiries (for upcoming renewals table)
    const upcomingExpiries = await Document.find({
      expiryDate: { $gte: now }
    })
      .sort({ expiryDate: 1 })
      .limit(10)
      .populate('customer', 'name company');

    // Get recent customers
    const recentCustomers = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('documents');

    // Calculate days left and status for each document
    const upcomingWithDays = upcomingExpiries.map(doc => {
      const daysLeft = Math.ceil((doc.expiryDate - now) / (1000 * 60 * 60 * 24));
      let status = 'Normal';
      if (daysLeft <= 7) status = 'Critical';
      else if (daysLeft <= 30) status = 'Soon';
      else if (daysLeft <= 60) status = 'Upcoming';
      
      return {
        ...doc._doc,
        daysLeft,
        status
      };
    });

    res.status(200).json({
      success: true,
      data: {
        customers: {
          total: totalCustomers,
          newThisMonth: 12 // This would be calculated based on monthly data
        },
        documents: {
          total: totalDocuments,
          newThisMonth: 124 // This would be calculated based on monthly data
        },
        expiringSoon: {
          total: expiringSoon,
          next30Days: expiringSoon
        },
        expired: {
          total: expired,
          needsAttention: expired
        },
        documentStatus: {
          totalDocuments,
          valid,
          expiringSoon,
          expiringLessThan7Days,
          expired
        },
        upcomingRenewals: upcomingWithDays,
        recentCustomers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};