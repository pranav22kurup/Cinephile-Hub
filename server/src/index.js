require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('./app');
const { startQueueProcessor } = require('./queue');

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cinephile_hub';

async function connectMongo() {
  mongoose.set('strictQuery', true);
  if (MONGO_URI === 'memory') {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { autoIndex: true });
    console.log('In-memory MongoDB started');
    return mongod;
  } else {
    await mongoose.connect(MONGO_URI, { autoIndex: true });
    console.log('MongoDB connected');
    return null;
  }
}

async function start() {
  try {
    const mongod = await connectMongo();

    await startQueueProcessor();

    const app = createApp();
    const server = app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

    // Graceful shutdown
    const shutdown = async () => {
      server.close();
      await mongoose.disconnect();
      if (mongod) await mongod.stop();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

start();