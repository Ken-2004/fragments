const app = require('./app');
const logger = require('./logger');

const port = parseInt(process.env.PORT || 8080, 10);

app.listen(port, () => {
  logger.info({ port }, 'Server started');
});
