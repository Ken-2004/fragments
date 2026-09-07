// src/model/fragment.js

// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');

// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (typeof ownerId !== 'string' || ownerId.length === 0) {
      throw new Error('ownerId is required');
    }

    if (typeof type !== 'string' || type.length === 0) {
      throw new Error('type is required');
    }

    if (!Fragment.isSupportedType(type)) {
      throw new Error(`unsupported content type: ${type}`);
    }

    if (typeof size !== 'number' || !Number.isFinite(size) || size < 0) {
      throw new Error('size must be a non-negative number');
    }

    const now = new Date().toISOString();

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || now;
    this.updated = updated || now;
    this.type = type;
    this.size = size;
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array>
   */
  static async byUser(ownerId, expand = false) {
    const fragments = await listFragments(ownerId, expand);

    if (!expand) {
      return fragments;
    }

    return fragments.map((fragment) => {
      const metadata = typeof fragment === 'string' ? JSON.parse(fragment) : fragment;
      return new Fragment(metadata);
    });
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise
   */
  static async byId(ownerId, id) {
    const fragment = await readFragment(ownerId, id);

    if (!fragment) {
      throw new Error(`fragment not found: ownerId=${ownerId}, id=${id}`);
    }

    return new Fragment(fragment);
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise
   */
  static delete(ownerId, id) {
    return deleteFragment(ownerId, id);
  }

  /**
   * Saves the current fragment metadata to the database
   * @returns Promise
   */
  save() {
    this.updated = new Date().toISOString();
    return writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise
   */
  getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  /**
   * Sets the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise
   */
  async setData(data) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('data must be a Buffer');
    }

    await writeFragmentData(this.ownerId, this.id, data);

    this.size = data.length;
    await this.save();
  }

  /**
   * Returns the MIME type without its optional charset.
   *
   * "text/html; charset=utf-8" becomes "text/html".
   *
   * @returns {string} fragment MIME type without encoding
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* MIME type.
   *
   * @returns {boolean} true if fragment type is text/*
   */
  get isText() {
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment can be converted.
   *
   * @returns {Array} supported output MIME types
   */
  get formats() {
    switch (this.mimeType) {
      case 'text/plain':
        return ['text/plain'];

      case 'text/markdown':
        return ['text/markdown', 'text/html', 'text/plain'];

      case 'text/html':
        return ['text/html', 'text/plain'];

      case 'application/json':
        return ['application/json', 'text/plain'];

      case 'image/png':
      case 'image/jpeg':
      case 'image/webp':
      case 'image/gif':
        return ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

      default:
        return [];
    }
  }

  /**
   * Returns true if we know how to work with this Content-Type.
   *
   * Supports text/* types, application/json, and PNG, JPEG, WebP, and GIF images.
   *
   * @param {string} value a Content-Type value
   * @returns {boolean} true if this Content-Type is supported
   */
  static isSupportedType(value) {
    if (typeof value !== 'string') {
      return false;
    }

    try {
      const { type } = contentType.parse(value);

      return (
        type.startsWith('text/') ||
        type === 'application/json' ||
        type === 'image/png' ||
        type === 'image/jpeg' ||
        type === 'image/webp' ||
        type === 'image/gif'
      );
    } catch {
      return false;
    }
  }
}

module.exports.Fragment = Fragment;
