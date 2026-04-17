require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const User = require('../models/User');
const products = require('./products');

const seedProducts = async () => {
  try {
    await connectDB();

    await Product.deleteMany({});

    let adminUser = await User.findOne({ email: 'admin@shopeasy.com' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@shopeasy.com',
        password: 'Admin@123',
        role: 'admin',
      });
    }

    await Product.insertMany(products);

    // eslint-disable-next-line no-console
    console.log('Sample products inserted successfully.');
    // eslint-disable-next-line no-console
    console.log('Admin credentials: admin@shopeasy.com / Admin@123');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Seeding failed:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedProducts();
