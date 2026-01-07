const { Queue, Worker, QueueScheduler } = require('bullmq');
const Redis = require('ioredis');
const PQueue = require('p-queue').default;
const Movie = require('../models/Movie');

const REDIS_URL = process.env.REDIS_URL || '';

let lazyInsertQueue = null;
let useBull = false;
let inMemoryQueue = null;

function getRedisConnection() {
  if (!REDIS_URL) return null;
  return new Redis(REDIS_URL, { maxRetriesPerRequest: null });
}

async function initQueue() {
  const conn = getRedisConnection();
  if (conn) {
    useBull = true;
    const queueName = 'lazy-insert';
    lazyInsertQueue = new Queue(queueName, { connection: conn });
    new QueueScheduler(queueName, { connection: conn });
  } else {
    useBull = false;
    inMemoryQueue = new PQueue({ concurrency: 4 });
  }
}

async function startQueueProcessor() {
  if (!lazyInsertQueue && !inMemoryQueue) await initQueue();
  if (useBull) {
    const conn = getRedisConnection();
    new Worker(
      'lazy-insert',
      async (job) => {
        const data = job.data || {};
        await Movie.create(data);
      },
      { connection: conn, concurrency: 4 }
    );
  } else {
    
  }
}

async function enqueueLazyInsert(data) {
  if (!lazyInsertQueue && !inMemoryQueue) await initQueue();
  if (useBull) {
    const job = await lazyInsertQueue.add('lazy-insert', data, { removeOnComplete: true, attempts: 3 });
    return { id: job.id };
  } else {
    const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await inMemoryQueue.add(async () => {
      await Movie.create(data);
    });
    return { id };
  }
}

module.exports = { startQueueProcessor, enqueueLazyInsert };