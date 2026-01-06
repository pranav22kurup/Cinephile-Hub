require('dotenv').config();
const https = require('https');
const zlib = require('zlib');
const readline = require('readline');
const { once } = require('events');
const mongoose = require('mongoose');
const PQueue = require('p-queue').default;
const Movie = require('../src/models/Movie');

const BASICS_URL = 'https://datasets.imdbws.com/title.basics.tsv.gz';
const RATINGS_URL = 'https://datasets.imdbws.com/title.ratings.tsv.gz';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cinephile_hub';
const OMDB_API_KEY = process.env.OMDB_API_KEY || '';

function fetchGzipStream(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to GET ${url} status=${res.statusCode}`));
        return;
      }
      const gunzip = zlib.createGunzip();
      res.pipe(gunzip);
      resolve(gunzip);
    }).on('error', reject);
  });
}

async function parseTsvGz(url) {
  const stream = await fetchGzipStream(url);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let headers = [];
  const rows = [];
  rl.on('line', (line) => {
    if (!headers.length) {
      headers = line.split('\t');
      return;
    }
    const parts = line.split('\t');
    const obj = {};
    for (let i = 0; i < headers.length; i++) obj[headers[i]] = parts[i];
    rows.push(obj);
  });
  await once(rl, 'close');
  return rows;
}

function toNumber(s, def = 0) {
  const n = Number(s);
  return Number.isFinite(n) ? n : def;
}

async function enrichWithOmdb(items) {
  if (!OMDB_API_KEY) return items;
  const queue = new PQueue({ concurrency: 2, intervalCap: 4, interval: 1000 });
  const fetchJson = (url) => new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve({ Response: 'False' }); }
      });
    }).on('error', reject);
  });

  await Promise.all(items.map((m) => queue.add(async () => {
    const url = `https://www.omdbapi.com/?i=${encodeURIComponent(m.imdbId)}&apikey=${OMDB_API_KEY}`;
    try {
      const json = await fetchJson(url);
      if (json && json.Response !== 'False') {
        if (!m.description && json.Plot && json.Plot !== 'N/A') m.description = json.Plot;
        if (!m.posterUrl && json.Poster && json.Poster !== 'N/A') m.posterUrl = json.Poster;
        if (!m.director && json.Director && json.Director !== 'N/A') m.director = json.Director;
        if ((!m.duration || m.duration === 0) && json.Runtime && json.Runtime !== 'N/A') {
          const mins = parseInt(String(json.Runtime).replace(/[^0-9]/g, ''), 10);
          if (Number.isFinite(mins)) m.duration = mins;
        }
      }
    } catch (_) {}
  })));
  return items;
}

async function run() {
  console.log('Connecting Mongo...');
  await mongoose.connect(MONGO_URI, { autoIndex: true });
  console.log('Mongo connected');

  console.log('Downloading IMDb ratings...');
  const ratings = await parseTsvGz(RATINGS_URL);
  const ratingMap = new Map();
  for (const r of ratings) {
    const tconst = r.tconst;
    ratingMap.set(tconst, { averageRating: toNumber(r.averageRating, 0), numVotes: toNumber(r.numVotes, 0) });
  }
  console.log(`Loaded ${ratingMap.size} ratings`);

  console.log('Streaming IMDb basics...');
  const basicsStream = await fetchGzipStream(BASICS_URL);
  const rl = readline.createInterface({ input: basicsStream, crlfDelay: Infinity });
  let headers = [];
  const candidates = [];
  rl.on('line', (line) => {
    if (!headers.length) { headers = line.split('\t'); return; }
    const parts = line.split('\t');
    const obj = {};
    for (let i = 0; i < headers.length; i++) obj[headers[i]] = parts[i];
    if (obj.titleType !== 'movie' || obj.isAdult !== '0') return;
    const r = ratingMap.get(obj.tconst) || { averageRating: 0, numVotes: 0 };
    if (r.numVotes < 50000) return;
    const m = {
      imdbId: obj.tconst,
      name: obj.primaryTitle === '\\N' ? '' : obj.primaryTitle,
      description: '',
      rating: r.averageRating,
      numVotes: r.numVotes,
      releaseDate: obj.startYear && obj.startYear !== '\\N' ? new Date(Number(obj.startYear), 0, 1) : null,
      duration: obj.runtimeMinutes && obj.runtimeMinutes !== '\\N' ? Number(obj.runtimeMinutes) : 0,
      director: '',
      genres: obj.genres && obj.genres !== '\\N' ? obj.genres.split(',').filter(Boolean) : [],
      posterUrl: ''
    };
    if (m.name) candidates.push(m);
  });
  await once(rl, 'close');
  console.log(`Collected ${candidates.length} candidates`);

  // Sort and take top 250
  candidates.sort((a, b) => (b.rating - a.rating) || (b.numVotes - a.numVotes));
  let movies = candidates.slice(0, 250);

  // Optional enrichment via OMDb (plot, poster, director)
  movies = await enrichWithOmdb(movies);

  // Upsert into DB by imdbId
  console.log('Upserting movies...');
  const batchQueue = new PQueue({ concurrency: 8 });
  let count = 0;
  await Promise.all(movies.map((m) => batchQueue.add(async () => {
    const doc = { ...m };
    delete doc.numVotes; // not stored in schema
    await Movie.updateOne(
      { imdbId: m.imdbId },
      { $set: doc },
      { upsert: true }
    );
    count += 1;
    if (count % 25 === 0) console.log(`Upserted ${count}/${movies.length}`);
  })));

  console.log(`Done. Upserted ${count} movies.`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('Import error:', e);
  process.exit(1);
});
