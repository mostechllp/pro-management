const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Customer = require('../models/Customer');

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Rename `state` → `emirates` and drop the old field
    const result = await Customer.updateMany(
      { 'address.state': { $exists: true, $ne: '' } },
      [
        {
          $set: {
            'address.emirates': '$address.state',
          },
        },
        {
          $unset: 'address.state',
        },
      ]
    );

    // Also set default country for records missing it
    const countryResult = await Customer.updateMany(
      {
        $or: [
          { 'address.country': { $exists: false } },
          { 'address.country': '' },
          { 'address.country': null }
        ]
      },
      { $set: { 'address.country': 'United Arab Emirates' } }
    );

    console.log(`✅ Migrated ${result.modifiedCount} customers (state → emirates)`);
    console.log(`✅ Defaulted country on ${countryResult.modifiedCount} customers`);

    await mongoose.disconnect();
    console.log('✅ Disconnected');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
};

migrate();