const pino = require('pino');

module.exports = pino({
  level: process.env.FRAGMENTS_LOG_LEVEL || 'info',
});
