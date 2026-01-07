/* eslint-disable no-console */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const readline = require('readline');
const https = require('https');
const mongoose = require('mongoose');
const PQueue = require('p-queue').default;
const Movie = require('../src/models/Movie');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cinephile_hub';
const OMDB_API_KEY = process.env.OMDB_API_KEY || '';

function openLineReader(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  const stream = fs.createReadStream(filePath);
  const isGz = filePath.endsWith('.gz');
  const source = isGz ? stream.pipe(zlib.createGunzip()) : stream;
  return readline.createInterface({ input: source, crlfDelay: Infinity });
}

function parseTsvHeader(line) {
  return line.split('\t');
}

function parseTsvRow(line, headers) {
  const parts = line.split('\t');
  const obj = {};
  for (let i = 0; i < headers.length; i++) {
    const v = parts[i];
    obj[headers[i]] = v === '\\N' ? null : v;
  }
  return obj;
}

async function loadRatings(ratingsPath, minVotes) {
  console.log('Loading ratings from', ratingsPath);
  const rl = openLineReader(ratingsPath);
  let headers = null;
  const map = new Map();
  for await (const line of rl) {
    if (!headers) { headers = parseTsvHeader(line); continue; }
    const r = parseTsvRow(line, headers);
    const nv = r.numVotes ? Number(r.numVotes) : 0;
    if (Number.isFinite(nv) && nv >= minVotes) {
      map.set(r.tconst, { averageRating: Number(r.averageRating || 0), numVotes: nv });
    }
  }
  console.log('Ratings loaded:', map.size);
  return map;
}

async function gatherCandidates(basicsPath, ratingMap) {
  console.log('Scanning basics from', basicsPath);
  const rl = openLineReader(basicsPath);
  let headers = null;
  const candidates = [];
  for await (const line of rl) {
    if (!headers) { headers = parseTsvHeader(line); continue; }
    const b = parseTsvRow(line, headers);
    if (b.titleType !== 'movie') continue;
    if (b.isAdult === '1') continue;
    const r = ratingMap.get(b.tconst);
    if (!r) continue;
    const startYear = b.startYear ? Number(b.startYear) : null;
    candidates.push({
      imdbId: b.tconst,
      name: b.primaryTitle || b.originalTitle || '',
      releaseDate: Number.isFinite(startYear) ? new Date(startYear, 0, 1) : null,
      duration: b.runtimeMinutes ? Number(b.runtimeMinutes) : 0,
      genres: b.genres ? b.genres.split(',').filter(Boolean) : [],
      rating: r.averageRating,
      numVotes: r.numVotes,
      description: '',
      posterUrl: '',
      director: ''
    });
  }
  console.log('Candidates collected:', candidates.length);
  return candidates;
}

async function bulkUpsertMovies(items) {
  if (!items.length) return;
  const ops = items.map((m) => ({
    updateOne: {
      filter: { imdbId: m.imdbId },
      update: {
        $set: {
          name: m.name,
          releaseDate: m.releaseDate,
          duration: m.duration,
          genres: m.genres,
          rating: m.rating,
          description: m.description || '',
          posterUrl: m.posterUrl || '',
          director: m.director || ''
        }
      },
      upsert: true
    }
  }));
  const chunkSize = 1000;
  for (let i = 0; i < ops.length; i += chunkSize) {
    const res = await Movie.bulkWrite(ops.slice(i, i + chunkSize), { ordered: false });
    console.log(`Upserted chunk ${i / chunkSize + 1}`, res.result ? JSON.stringify(res.result) : '');
  }
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve({ Response: 'False' }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(new Error('Timeout')); });
  });
}

async function enrichOmdb(items, concurrency = 4) {
  if (!OMDB_API_KEY) { console.log('OMDB_API_KEY not set; skipping enrichment.'); return; }
  const queue = new PQueue({ concurrency });
  let done = 0;
  await Promise.all(items.map((m) => queue.add(async () => {
    const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${encodeURIComponent(m.imdbId)}`;
    try {
      const json = await fetchJson(url);
      if (json && json.Response !== 'False') {
        const update = {};
        if (!m.description && json.Plot && json.Plot !== 'N/A') update.description = json.Plot;
        if (!m.posterUrl && json.Poster && json.Poster !== 'N/A') update.posterUrl = json.Poster;
        if (!m.director && json.Director && json.Director !== 'N/A') update.director = json.Director;
        if ((!m.duration || m.duration === 0) && json.Runtime && json.Runtime !== 'N/A') {
          const mins = parseInt(String(json.Runtime).replace(/[^0-9]/g, ''), 10);
          if (Number.isFinite(mins)) update.duration = mins;
        }
        if (Object.keys(update).length) {
          await Movie.updateOne({ imdbId: m.imdbId }, { $set: update });
        }
      }
    } catch (e) {
      
    }
    done += 1;
    if (done % 25 === 0) console.log(`Enriched ${done}/${items.length}`);
  })));
}

function parseArgs(argv) {
  const args = { top: 250, minVotes: 50000, enrich: false, basics: '', ratings: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--basics') args.basics = argv[++i];
    else if (a === '--ratings') args.ratings = argv[++i];
    else if (a === '--top') args.top = Number(argv[++i]);
    else if (a === '--minVotes') args.minVotes = Number(argv[++i]);
    else if (a === '--enrich') args.enrich = true;
  }
  if (!args.basics || !args.ratings) {
    console.error('Usage: node scripts/importFromTsv.js --basics <path> --ratings <path> [--top 250] [--minVotes 50000] [--enrich]');
    process.exit(1);
  }
  args.basics = path.resolve(args.basics);
  args.ratings = path.resolve(args.ratings);
  return args;
}

async function main() {
  const cfg = parseArgs(process.argv.slice(2));
  await mongoose.connect(MONGO_URI, { autoIndex: true });
  console.log('Mongo connected');
  try {
    const ratingMap = await loadRatings(cfg.ratings, cfg.minVotes);
    const candidates = await gatherCandidates(cfg.basics, ratingMap);
    candidates.sort((a, b) => (b.rating - a.rating) || (b.numVotes - a.numVotes) || a.name.localeCompare(b.name));
    const picked = candidates.slice(0, cfg.top);
    console.log(`Selected top ${picked.length}`);
    await bulkUpsertMovies(picked);
    if (cfg.enrich) {
      await enrichOmdb(picked, 4);
    }
  } finally {
    await mongoose.disconnect();
  }
  console.log('Import completed');
}

if (require.main === module) {
  main().catch((e) => {
    console.error('Import error:', e);
    process.exit(1);
  });
}
