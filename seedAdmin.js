import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in .env');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const email = 'adminbsw@fabiratrading.com';
    const password = 'Admin2026@';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User with email ${email} already exists. Updating role to admin...`);
      existingUser.role = 'admin';
      await existingUser.save();
      console.log('User role updated to admin.');
    } else {
      console.log(`Creating new admin user: ${email}`);
      const hashedPassword = await bcrypt.hash(password, 10);
      const adminUser = new User({
        firstName: 'Admin',
        lastName: 'BSW',
        email: email,
        password: hashedPassword,
        phone: '+221000000000',
        role: 'admin',
        companyDetails: {
          name: 'FABIRA TRADING',
          type: 'admin'
        }
      });

      await adminUser.save();
      console.log('Admin user created successfully!');
    }

  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedAdmin();
