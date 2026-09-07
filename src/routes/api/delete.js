// src/routes/api/delete.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');

/**
 * Delete a fragment belonging to the authenticated user.
 */
module.exports = async (req, res) => {
  try {
    // Confirm that the fragment exists and belongs to this user
    const fragment = await Fragment.byId(req.user, req.params.id);

    // Delete the fragment metadata and data
    await Fragment.delete(req.user, fragment.id);

    res.status(200).json(createSuccessResponse());
  } catch (err) {
    res.status(404).json(createErrorResponse(404, err.message));
  }
};
