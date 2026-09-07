// tests/unit/route-error-paths.test.js

const request = require('supertest');

const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

describe('API error handling', () => {
  const user = 'test-user1@fragments-testing.com';
  const password = 'test-password1';

  afterEach(() => {
    // Restore all mocked Fragment methods after each test.
    jest.restoreAllMocks();
  });

  test('GET /v1/fragments returns 500 when the data layer fails', async () => {
    jest.spyOn(Fragment, 'byUser').mockRejectedValueOnce(new Error('database unavailable'));

    const res = await request(app).get('/v1/fragments').auth(user, password);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      status: 'error',
      error: {
        code: 500,
        message: 'database unavailable',
      },
    });
  });

  test('POST /v1/fragments returns 500 when fragment data cannot be saved', async () => {
    jest.spyOn(Fragment.prototype, 'setData').mockRejectedValueOnce(new Error('write failed'));

    const res = await request(app)
      .post('/v1/fragments')
      .auth(user, password)
      .set('Content-Type', 'text/plain')
      .send('hello');

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      status: 'error',
      error: {
        code: 500,
        message: 'write failed',
      },
    });
  });
});
