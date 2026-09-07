// src/routes/api/get.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Get a list of fragments for the current user.
 *
 * By default, return only fragment IDs. If expand=1 is included
 * in the query string, return the full fragment metadata objects.
 */
module.exports = async (req, res, next) => {
  try {
    // Convert the expand query string into a boolean.
    const expand = req.query.expand === '1';

    // req.user contains the authenticated user's hashed email.
    const fragments = await Fragment.byUser(req.user, expand);

    logger.debug(
      {
        ownerId: req.user,
        expand,
        count: fragments.length,
      },
      'Getting fragments for user'
    );

    return res.status(200).json(
      createSuccessResponse({
        fragments,
      })
    );
  } catch (err) {
    logger.error({ err, ownerId: req.user }, 'Unable to get fragments');
    return next(err);
  }
};
