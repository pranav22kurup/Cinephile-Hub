require('dotenv').config();
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const PQueue = require('p-queue').default;
const Movie = require('../src/models/Movie');