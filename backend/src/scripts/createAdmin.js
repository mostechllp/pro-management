const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Import User model
const User = require('../models/User');

// Connect to database
const connectDB = require('../config/database');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Function to validate email
const validateEmail = (email) => {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

// Function to validate password
const validatePassword = (password) => {
  return password.length >= 6;
};

// Main function to create admin user
const createAdminUser = async () => {
  try {
    console.log('\n=== PRO Management Admin User Creation ===\n');
    
    // Get user input
    let email = await prompt('Enter admin email: ');
    while (!validateEmail(email)) {
      console.log('❌ Invalid email format. Please try again.');
      email = await prompt('Enter admin email: ');
    }

    let password = await prompt('Enter admin password (min 6 characters): ');
    while (!validatePassword(password)) {
      console.log('❌ Password must be at least 6 characters long. Please try again.');
      password = await prompt('Enter admin password (min 6 characters): ');
    }

    let name = await prompt('Enter admin name: ');
    while (!name || name.trim().length === 0) {
      console.log('❌ Name cannot be empty. Please try again.');
      name = await prompt('Enter admin name: ');
    }

    console.log('\n📋 Summary:');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Password: ${'*'.repeat(password.length)}`);
    
    const confirm = await prompt('\n✅ Create admin user? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('\n❌ Admin creation cancelled.');
      rl.close();
      process.exit(0);
    }

    console.log('\n⏳ Creating admin user...');

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`\n❌ User with email ${email} already exists.`);
      console.log('   Please use a different email or delete the existing user.');
      rl.close();
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      email: email.toLowerCase(),
      password: password,
      name: name.trim(),
      role: 'admin',
      isActive: true,
      createdAt: new Date()
    });

    await adminUser.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📊 Admin User Details:');
    console.log(`   ID: ${adminUser._id}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Created: ${adminUser.createdAt}`);
    console.log('\n🔐 You can now login with these credentials.');

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
  } finally {
    rl.close();
    // Close database connection
    await mongoose.disconnect();
    console.log('\n👋 Database connection closed.');
    process.exit(0);
  }
};

// Connect to database and run script
const run = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');
    await createAdminUser();
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

// Run the script
run();