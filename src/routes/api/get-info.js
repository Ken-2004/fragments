// src/routes/api/get-info.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Get a fragment's metadata by ID for the authenticated user.
 */
module.exports = async (req, res) => {
  try {
    // Find the fragment using the authenticated user's hashed email and fragment ID.
    const fragment = await Fragment.byId(req.user, req.params.id);

    logger.debug(
      {
        ownerId: req.user,
        id: fragment.id,
        type: fragment.type,
        size: fragment.size,
      },
      'Returning fragment metadata'
    );

    return res.status(200).json(
      createSuccessResponse({
        fragment,
      })
    );
  } catch (err) {
    logger.warn(
      {
        err,
        ownerId: req.user,
        id: req.params.id,
      },
      'Fragment metadata not found'
    );

    return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
  }
};
