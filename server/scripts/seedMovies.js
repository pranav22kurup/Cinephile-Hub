require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Movie = require('../src/models/Movie');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cinephile_hub';

const samples = [
  {
    name: 'The Shawshank Redemption',
    description: 'Two imprisoned men bond over years, finding solace and eventual redemption through acts of common decency.',
    rating: 9.3,
    releaseDate: new Date('1994-09-23'),
    duration: 142,
    director: 'Frank Darabont',
    genres: ['Drama'],
    posterUrl: 'https://via.placeholder.com/300x450?text=Shawshank'
  },
  {
    name: 'The Godfather',
    description: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
    rating: 9.2,
    releaseDate: new Date('1972-03-24'),
    duration: 175,
    director: 'Francis Ford Coppola',
    genres: ['Crime', 'Drama'],
    posterUrl: 'https://via.placeholder.com/300x450?text=Godfather'
  },
  {
    name: 'The Dark Knight',
    description: 'Batman faces the Joker, a criminal mastermind who thrusts Gotham into anarchy and forces the Dark Knight closer to crossing the fine line between hero and vigilante.',
    rating: 9.0,
    releaseDate: new Date('2008-07-18'),
    duration: 152,
    director: 'Christopher Nolan',
    genres: ['Action', 'Crime', 'Drama'],
    posterUrl: 'https://via.placeholder.com/300x450?text=Dark+Knight'
  },
  {
    name: '12 Angry Men',
    description: 'A jury holdout attempts to prevent a miscarriage of justice by forcing his colleagues to reconsider the evidence.',
    rating: 9.0,
    releaseDate: new Date('1957-04-10'),
    duration: 96,
    director: 'Sidney Lumet',
    genres: ['Drama'],
    posterUrl: 'https://via.placeholder.com/300x450?text=12+Angry+Men'
  },
  {
    name: 'Schindler\'s List',
    description: 'In German-occupied Poland during World War II, Oskar Schindler gradually becomes concerned for his Jewish workforce after witnessing Nazi atrocities.',
    rating: 9.0,
    releaseDate: new Date('1993-12-15'),
    duration: 195,
    director: 'Steven Spielberg',
    genres: ['Biography', 'Drama', 'History'],
    posterUrl: 'https://via.placeholder.com/300x450?text=Schindlers+List'
  },
  {
    name: 'Pulp Fiction',
    description: 'The lives of two mob hitmen, a boxer, a gangster\'s wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
    rating: 8.9,
    releaseDate: new Date('1994-10-14'),
    duration: 154,
    director: 'Quentin Tarantino',
    genres: ['Crime', 'Drama'],
    posterUrl: 'https://via.placeholder.com/300x450?text=Pulp+Fiction'
  },
];

async function connectMongo() {
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

async function run() {
  let mongod = null;
  try {
    mongod = await connectMongo();
    for (const m of samples) {
      await Movie.updateOne({ name: m.name }, { $set: m }, { upsert: true });
      console.log('Upserted:', m.name);
    }
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    process.exit(0);
  }
}

run();
