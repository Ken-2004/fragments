// src/routes/api/get-by-id-ext.js

const MarkdownIt = require('markdown-it');
const { convert } = require('html-to-text');
const sharp = require('sharp');

const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

// Create one Markdown parser that can be reused for every request.
const markdown = new MarkdownIt();

/**
 * Convert HTML to plain text.
 *
 * @param {string} html
 * @returns {string}
 */
const htmlToPlainText = (html) =>
  convert(html, {
    wordwrap: false,
  });

/**
 * Send fragment data with the requested Content-Type.
 *
 * @param {Object} res
 * @param {string} type
 * @param {Buffer|string} data
 */
const sendData = (res, type, data) => {
  res.setHeader('Content-Type', type);
  return res.status(200).send(data);
};

/**
 * Convert one of the supported image types using sharp.
 *
 * @param {Buffer} data
 * @param {string} extension
 * @returns {Promise<{data: Buffer, type: string}>}
 */
const convertImage = async (data, extension) => {
  const image = sharp(data, { animated: true });

  switch (extension) {
    case 'png':
      return {
        data: await image.png().toBuffer(),
        type: 'image/png',
      };

    case 'jpg':
    case 'jpeg':
      return {
        data: await image.jpeg().toBuffer(),
        type: 'image/jpeg',
      };

    case 'webp':
      return {
        data: await image.webp().toBuffer(),
        type: 'image/webp',
      };

    case 'gif':
      return {
        data: await image.gif().toBuffer(),
        type: 'image/gif',
      };

    default:
      return undefined;
  }
};

/**
 * Get a fragment's data converted to a supported format.
 */
module.exports = async (req, res) => {
  let fragment;

  try {
    // Find the fragment using the authenticated user's hashed email and fragment ID.
    fragment = await Fragment.byId(req.user, req.params.id);
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

  // Get the original fragment data from the database.
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

  const extension = req.params.ext.toLowerCase();

  try {
    // Plain text can only be returned as plain text.
    if (fragment.mimeType === 'text/plain' && extension === 'txt') {
      return sendData(res, 'text/plain; charset=utf-8', data);
    }

    // Markdown can be returned as Markdown.
    if (fragment.mimeType === 'text/markdown' && extension === 'md') {
      return sendData(res, 'text/markdown; charset=utf-8', data);
    }

    // Markdown can be converted to HTML.
    if (fragment.mimeType === 'text/markdown' && extension === 'html') {
      const html = markdown.render(data.toString());

      logger.debug(
        {
          ownerId: req.user,
          id: fragment.id,
          from: fragment.mimeType,
          to: 'text/html',
        },
        'Converted fragment'
      );

      return sendData(res, 'text/html; charset=utf-8', html);
    }

    // Markdown can be converted to plain text.
    if (fragment.mimeType === 'text/markdown' && extension === 'txt') {
      const html = markdown.render(data.toString());
      const text = htmlToPlainText(html);

      logger.debug(
        {
          ownerId: req.user,
          id: fragment.id,
          from: fragment.mimeType,
          to: 'text/plain',
        },
        'Converted fragment'
      );

      return sendData(res, 'text/plain; charset=utf-8', text);
    }

    // HTML can be returned as HTML.
    if (fragment.mimeType === 'text/html' && extension === 'html') {
      return sendData(res, 'text/html; charset=utf-8', data);
    }

    // HTML can be converted to plain text.
    if (fragment.mimeType === 'text/html' && extension === 'txt') {
      const text = htmlToPlainText(data.toString());

      logger.debug(
        {
          ownerId: req.user,
          id: fragment.id,
          from: fragment.mimeType,
          to: 'text/plain',
        },
        'Converted fragment'
      );

      return sendData(res, 'text/plain; charset=utf-8', text);
    }

    // JSON can be returned as JSON.
    if (fragment.mimeType === 'application/json' && extension === 'json') {
      return sendData(res, 'application/json', data);
    }

    // JSON can be converted to plain text.
    if (fragment.mimeType === 'application/json' && extension === 'txt') {
      return sendData(res, 'text/plain; charset=utf-8', data.toString());
    }

    // Supported image fragments can be converted between PNG, JPEG, WebP, and GIF.
    if (
      fragment.mimeType === 'image/png' ||
      fragment.mimeType === 'image/jpeg' ||
      fragment.mimeType === 'image/webp' ||
      fragment.mimeType === 'image/gif'
    ) {
      const converted = await convertImage(data, extension);

      if (converted) {
        logger.debug(
          {
            ownerId: req.user,
            id: fragment.id,
            from: fragment.mimeType,
            to: converted.type,
          },
          'Converted image fragment'
        );

        return sendData(res, converted.type, converted.data);
      }
    }

    logger.warn(
      {
        ownerId: req.user,
        id: fragment.id,
        type: fragment.mimeType,
        extension,
      },
      'Unsupported fragment conversion'
    );

    return res
      .status(415)
      .json(
        createErrorResponse(
          415,
          `Fragment type ${fragment.mimeType} cannot be converted to .${extension}`
        )
      );
  } catch (err) {
    logger.error(
      {
        err,
        ownerId: req.user,
        id: fragment.id,
        type: fragment.mimeType,
        extension,
      },
      'Unable to convert fragment'
    );

    return res
      .status(415)
      .json(createErrorResponse(415, `Unable to convert fragment to .${extension}`));
  }
};
