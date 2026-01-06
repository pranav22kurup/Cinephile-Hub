require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('../src/models/Movie');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cinephile_hub';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    const result = await Movie.deleteMany({ $or: [ { imdbId: { $exists: false } }, { imdbId: null }, { imdbId: '' } ] });
    console.log(`Deleted ${result.deletedCount} mock movies without imdbId.`);
  } catch (err) {
    console.error('Cleanup error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
