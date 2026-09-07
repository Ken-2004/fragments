// tests/unit/get.test.js

const request = require('supertest');

const app = require('../../src/app');

describe('GET /v1/fragments', () => {
  const user1 = 'test-user1@fragments-testing.com';
  const password1 = 'test-password1';

  const user2 = 'test-user2@fragments-testing';
  const password2 = 'test-password2';

  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used, it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  // Using a valid username/password pair should return a fragments array
  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth(user1, password1);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  test('users with no fragments get an empty fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth(user2, password2);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragments).toEqual([]);
  });

  test('returns the authenticated user fragment IDs', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/plain')
      .send('first fragment');

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app).get('/v1/fragments').auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.status).toBe('ok');
    expect(getRes.body.fragments).toContain(fragmentId);
  });

  test('expand=1 returns full fragment metadata', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/plain')
      .send('expanded fragment');

    expect(postRes.statusCode).toBe(201);

    const createdFragment = postRes.body.fragment;

    const getRes = await request(app)
      .get('/v1/fragments?expand=1')
      .auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.status).toBe('ok');
    expect(Array.isArray(getRes.body.fragments)).toBe(true);

    const fragment = getRes.body.fragments.find((item) => item.id === createdFragment.id);

    expect(fragment).toBeDefined();
    expect(fragment.ownerId).toBe(createdFragment.ownerId);
    expect(fragment.type).toBe('text/plain');
    expect(fragment.size).toBe(Buffer.byteLength('expanded fragment'));
    expect(Date.parse(fragment.created)).not.toBeNaN();
    expect(Date.parse(fragment.updated)).not.toBeNaN();
  });

  test("one user cannot see another user's fragments", async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/plain')
      .send('private fragment');

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app).get('/v1/fragments').auth(user2, password2);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.fragments).not.toContain(fragmentId);
  });
});
