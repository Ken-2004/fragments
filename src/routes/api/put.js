// src/routes/api/put.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Update an existing fragment belonging to the authenticated user.
 */
module.exports = async (req, res, next) => {
  let fragment;

  try {
    // Find the existing fragment. Fragment.byId() also ensures that
    // the fragment belongs to the authenticated user.
    fragment = await Fragment.byId(req.user, req.params.id);
  } catch (err) {
    logger.warn(
      {
        err,
        ownerId: req.user,
        id: req.params.id,
      },
      'Fragment not found for update'
    );

    return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
  }

  // A fragment's Content-Type cannot be changed after creation.
  const type = req.get('Content-Type');

  if (type !== fragment.type) {
    logger.warn(
      {
        ownerId: req.user,
        id: fragment.id,
        existingType: fragment.type,
        requestedType: type,
      },
      'Cannot change fragment Content-Type'
    );

    return res
      .status(400)
      .json(
        createErrorResponse(
          400,
          `Fragment Content-Type cannot be changed from ${fragment.type} to ${type || 'unknown'}`
        )
      );
  }

  try {
    // express.raw() gives us a Buffer for supported Content-Types.
    // An empty request body is still valid fragment data.
    const data = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);

    // Replace the old fragment data and update size/updated metadata.
    await fragment.setData(data);

    logger.info(
      {
        id: fragment.id,
        ownerId: fragment.ownerId,
        type: fragment.type,
        size: fragment.size,
      },
      'Updated fragment'
    );

    return res.status(200).json(
      createSuccessResponse({
        fragment,
      })
    );
  } catch (err) {
    logger.error(
      {
        err,
        ownerId: req.user,
        id: req.params.id,
      },
      'Unable to update fragment'
    );

    return next(err);
  }
};
