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

    // First day of the current month, used for the "+N this month" deltas
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all counts
    const [totalCustomers, totalDocuments] = await Promise.all([
      Customer.countDocuments(),
      Document.countDocuments(),
    ]);

    // Get document status counts
    const [expiringSoon, expired, expiringLessThan7Days] = await Promise.all([
      Document.countDocuments({
        expiryDate: { $gte: now, $lte: thirtyDaysLater },
        status: { $ne: 'Expired' },
      }),
      Document.countDocuments({
        expiryDate: { $lt: now },
      }),
      Document.countDocuments({
        expiryDate: { $gte: now, $lte: sevenDaysLater },
        status: { $ne: 'Expired' },
      }),
    ]);

    // Real "new this month" counts instead of hard-coded numbers
    const [newCustomersThisMonth, newDocumentsThisMonth] = await Promise.all([
      Customer.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Document.countDocuments({ createdAt: { $gte: startOfMonth } }),
    ]);

    // Get valid documents count
    const valid = totalDocuments - expired;

    // Get upcoming expiries (for the renewals table). Fetch enough rows
    // that the 7/30/60/90-day filter tabs on the frontend have data to
    // show without a second round trip; the table itself only renders
    // the first handful.
    const upcomingExpiries = await Document.find({
      expiryDate: { $gte: now },
    })
      .sort({ expiryDate: 1 })
      .limit(50)
      .populate('customer', 'name company');

    // Get recent customers, including enough document info to show
    // document count, latest expiry date, and a contact number.
    const recentCustomers = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('documents', 'expiryDate');

    // Calculate days left and status for each document
    const upcomingWithDays = upcomingExpiries.map((doc) => {
      const daysLeft = Math.ceil((doc.expiryDate - now) / (1000 * 60 * 60 * 24));
      let status = 'Normal';
      if (daysLeft <= 7) status = 'Critical';
      else if (daysLeft <= 30) status = 'Soon';
      else if (daysLeft <= 60) status = 'Upcoming';

      return {
        ...doc._doc,
        daysLeft,
        status,
      };
    });

    // Attach a computed latestExpiry + contact field to each recent customer
    const recentCustomersWithMeta = recentCustomers.map((customer) => {
      const docs = customer.documents || [];
      const latestExpiry = docs.length
        ? docs.reduce((latest, d) =>
            !latest || d.expiryDate > latest ? d.expiryDate : latest,
          null)
        : null;

      return {
        ...customer._doc,
        latestExpiry,
        contact: customer.phone || customer.contact || null,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        customers: {
          total: totalCustomers,
          newThisMonth: newCustomersThisMonth,
        },
        documents: {
          total: totalDocuments,
          newThisMonth: newDocumentsThisMonth,
        },
        expiringSoon: {
          total: expiringSoon,
          next30Days: expiringSoon,
        },
        expired: {
          total: expired,
          needsAttention: expired,
        },
        documentStatus: {
          totalDocuments,
          valid,
          expiringSoon,
          expiringLessThan7Days,
          expired,
        },
        upcomingRenewals: upcomingWithDays,
        recentCustomers: recentCustomersWithMeta,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};