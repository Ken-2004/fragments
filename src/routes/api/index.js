// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require('express');
const contentType = require('content-type');

const { Fragment } = require('../../model/fragment');

// Create a router on which to mount our API endpoints
const router = express.Router();

/**
 * Support sending various Content-Types on the body up to 5 MB in size.
 * If the Content-Type is supported, req.body will be a Buffer.
 */
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      try {
        // See if we can parse and support this content type.
        const { type } = contentType.parse(req);
        return Fragment.isSupportedType(type);
      } catch {
        return false;
      }
    },
  });

// Get a list of fragments for the authenticated user
router.get('/fragments', require('./get'));

// Get one fragment's metadata by ID
router.get('/fragments/:id/info', require('./get-info'));

// Get one fragment's data converted to a supported format
router.get('/fragments/:id.:ext', require('./get-by-id-ext'));

// Get one fragment's data by ID
router.get('/fragments/:id', require('./get-by-id'));

// Create a new fragment
router.post('/fragments', rawBody(), require('./post'));

// Update one fragment by ID
router.put('/fragments/:id', rawBody(), require('./put'));

// Delete one fragment by ID
router.delete('/fragments/:id', require('./delete'));

module.exports = router;
