// tests/unit/app.test.js

const request = require('supertest');

// Get our Express app object (we don't need the server part)
const app = require('../../src/app');

describe('404 handler', () => {
  // Write an HTTP unit test to cover the 404 handler
  test('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/this-route-does-not-exist');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
    expect(res.body.error.message).toBe('not found');
  });
});
