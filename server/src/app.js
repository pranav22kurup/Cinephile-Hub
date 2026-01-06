const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const moviesRouter = require('./routes/movies');
const authRouter = require('./routes/auth');
const { notFoundHandler, errorHandler } = require('./utils/error');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/auth', authRouter);
  app.use('/movies', moviesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };