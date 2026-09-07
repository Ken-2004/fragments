// src/routes/api/post.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Create a new fragment for the authenticated user.
 */
module.exports = async (req, res, next) => {
  try {
    // The raw body parser produces a Buffer for supported Content-Types.
    if (!Buffer.isBuffer(req.body)) {
      const type = req.get('Content-Type');

      logger.warn({ type }, 'Unsupported Content-Type');

      return res
        .status(415)
        .json(createErrorResponse(415, `Unsupported Media Type: ${type || 'unknown'}`));
    }

    // Preserve the original Content-Type, including an optional charset.
    const type = req.get('Content-Type');

    // req.user contains the authenticated user's hashed email.
    const fragment = new Fragment({
      ownerId: req.user,
      type,
    });

    // Store the raw fragment data and update its metadata.
    await fragment.setData(req.body);

    // Use API_URL when configured. Otherwise, use the current request host.
    const apiUrl = process.env.API_URL || `${req.protocol}://${req.headers.host}`;
    const location = new URL(`/v1/fragments/${fragment.id}`, apiUrl).href;

    // Tell the client where the newly created fragment can be retrieved.
    res.setHeader('Location', location);

    // Allow browser clients on another origin to read the Location header.
    res.setHeader('Access-Control-Expose-Headers', 'Location');

    logger.info(
      {
        id: fragment.id,
        ownerId: fragment.ownerId,
        type: fragment.type,
        size: fragment.size,
      },
      'Created fragment'
    );

    return res.status(201).json(
      createSuccessResponse({
        fragment,
      })
    );
  } catch (err) {
    logger.error({ err }, 'Unable to create fragment');
    return next(err);
  }
};
