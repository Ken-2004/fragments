// src/model/data/memory/index.js

const MemoryDB = require('./memory-db');

// Create two in-memory databases: one for fragment metadata and the other for raw data
// The `data` MemoryDB simulates Amazon S3 for blob storage, the `metadata` simulates
// Amazon DynamoDB for key/value storage.
const data = new MemoryDB();
const metadata = new MemoryDB();

// Write a fragment's metadata to memory db. Returns a Promise<void>
function writeFragment(fragment) {
  // Serialize metadata to match the storage boundary used by the AWS adapter.
  const serialized = JSON.stringify(fragment);
  return metadata.put(fragment.ownerId, fragment.id, serialized);
}

// Read a fragment's metadata from memory db. Returns a Promise<Object>
async function readFragment(ownerId, id) {
  // Return plain metadata; the model reconstructs Fragment instances.
  const serialized = await metadata.get(ownerId, id);
  return typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
}

// Write a fragment's data buffer to memory db. Returns a Promise
function writeFragmentData(ownerId, id, buffer) {
  return data.put(ownerId, id, buffer);
}

// Read a fragment's data from memory db. Returns a Promise
function readFragmentData(ownerId, id) {
  return data.get(ownerId, id);
}

// Get a list of fragment ids/objects for the given user from memory db. Returns a Promise
async function listFragments(ownerId, expand = false) {
  const fragments = await metadata.query(ownerId);

  // If we don't get anything back, or are supposed to give expanded fragments, return
  if (expand || !fragments) {
    return fragments;
  }

  // Otherwise, map to only send back the ids
  return fragments.map((fragment) => JSON.parse(fragment).id);
}

// Delete a fragment's metadata and data from memory db. Returns a Promise
function deleteFragment(ownerId, id) {
  return Promise.all([
    // Delete metadata
    metadata.del(ownerId, id),

    // Delete data
    data.del(ownerId, id),
  ]);
}

module.exports.listFragments = listFragments;
module.exports.writeFragment = writeFragment;
module.exports.readFragment = readFragment;
module.exports.writeFragmentData = writeFragmentData;
module.exports.readFragmentData = readFragmentData;
module.exports.deleteFragment = deleteFragment;
