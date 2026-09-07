// src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const passport = require('passport');

const logger = require('./logger');
const authenticate = require('./auth');
const { createErrorResponse } = require('./response');

const app = express();

// Use security middleware
app.use(helmet());

// Enable CORS for all routes and expose the Location header to web clients
app.use(
  cors({
    exposedHeaders: ['Location'],
  })
);

// Use gzip/deflate compression middleware
app.use(compression());

// Set up our passport authentication middleware
passport.use(authenticate.strategy());
app.use(passport.initialize());

// Define our routes
app.use('/', require('./routes'));

// Add 404 middleware to handle requests for resources that can't be found
app.use((req, res) => {
  res.status(404).json(createErrorResponse(404, 'not found'));
});

// Add error-handling middleware to deal with unexpected errors
app.use((err, req, res, next) => {
  // Express error handlers require four parameters.
  void next;

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'unable to process request';

  logger.error({ err }, message);

  res.status(status).json(createErrorResponse(status, message));
});

module.exports = app;
