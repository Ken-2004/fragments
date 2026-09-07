// src/hash.js

/**
 * Derive a stable owner ID from the full SHA-256 hex digest of the user's email.
 * Hashing avoids storing raw emails in fragment metadata; it is not encryption.
 */

const crypto = require('crypto');

/**
 * @param {string} email user's email address
 * @returns string Hashed email address
 */
module.exports = (email) => crypto.createHash('sha256').update(email).digest('hex');
