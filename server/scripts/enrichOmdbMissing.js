require('dotenv').config();
const https = require('https');
const mongoose = require('mongoose');
const PQueue = require('p-queue').default;
const Movie = require('../src/models/Movie');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cinephile_hub';
const OMDB_API_KEY = process.env.OMDB_API_KEY || '';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve({ Response: 'False' }); }
      });
    }).on('error', reject);
  });
}

async function run() {
  if (!OMDB_API_KEY) {
    console.error('OMDB_API_KEY not set. Aborting.');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI, { autoIndex: true });

  // Only movies missing poster or description
  const cursor = Movie.find({ $or: [ { posterUrl: { $exists: false } }, { posterUrl: '' }, { posterUrl: 'N/A' }, { description: { $exists: false } }, { description: '' } ] }).cursor();

  const queue = new PQueue({ concurrency: 2, intervalCap: 4, interval: 1000 });
  let processed = 0;
  for await (const m of cursor) {
    if (!m.imdbId) continue;
    await queue.add(async () => {
      const url = `https://www.omdbapi.com/?i=${encodeURIComponent(m.imdbId)}&apikey=${OMDB_API_KEY}`;
      try {
        const json = await fetchJson(url);
        if (json && json.Response !== 'False') {
          const update = {};
          if ((!m.description || m.description === '') && json.Plot && json.Plot !== 'N/A') update.description = json.Plot;
          if ((!m.posterUrl || m.posterUrl === '' || m.posterUrl === 'N/A') && json.Poster && json.Poster !== 'N/A') update.posterUrl = json.Poster;
          if ((!m.director || m.director === '') && json.Director && json.Director !== 'N/A') update.director = json.Director;
          if ((!m.duration || m.duration === 0) && json.Runtime && json.Runtime !== 'N/A') {
            const mins = parseInt(String(json.Runtime).replace(/[^0-9]/g, ''), 10);
            if (Number.isFinite(mins)) update.duration = mins;
          }
          if (Object.keys(update).length) {
            await Movie.updateOne({ _id: m._id }, { $set: update });
          }
        }
      } catch (e) {
        // ignore individual errors
      }
      processed += 1;
      if (processed % 25 === 0) console.log(`Enriched ${processed}`);
    });
  }

  await queue.onIdle();
  console.log('Enrichment completed.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => { console.error('Enrich error:', e); process.exit(1); });
