// src/routes/api/get-by-id.js

const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Get a fragment's data by ID for the authenticated user.
 */
module.exports = async (req, res) => {
  try {
    // Find the fragment using the authenticated user's hashed email and fragment ID.
    const fragment = await Fragment.byId(req.user, req.params.id);

    // Get the raw fragment data from the database.
    const data = await fragment.getData();

    if (!Buffer.isBuffer(data)) {
      logger.warn(
        {
          ownerId: req.user,
          id: req.params.id,
        },
        'Fragment data not found'
      );

      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    logger.debug(
      {
        ownerId: req.user,
        id: fragment.id,
        type: fragment.type,
        size: fragment.size,
      },
      'Returning fragment data'
    );

    // Return the fragment using its original Content-Type.
    res.setHeader('Content-Type', fragment.type);
    return res.status(200).send(data);
  } catch (err) {
    logger.warn(
      {
        err,
        ownerId: req.user,
        id: req.params.id,
      },
      'Fragment not found'
    );

    return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
  }
};
