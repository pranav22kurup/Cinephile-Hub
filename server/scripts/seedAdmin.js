require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cinephile_hub';

async function connectMongo() {
  if (MONGO_URI === 'memory') {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    return mongod;
  } else {
    await mongoose.connect(MONGO_URI);
    return null;
  }
}

async function run() {
  let mongod = null;
  try {
    mongod = await connectMongo();
    const email = process.env.ADMIN_EMAIL || 'admin@cinephilehub.com';
    const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Admin already exists:', email);
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      await User.create({ email, passwordHash, role: 'admin' });
      console.log('Admin created:', email);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    process.exit(0);
  }
}

run();