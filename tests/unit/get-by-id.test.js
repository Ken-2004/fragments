// tests/unit/get-by-id.test.js

const request = require('supertest');

const app = require('../../src/app');

describe('GET /v1/fragments/:id', () => {
  const user1 = 'test-user1@fragments-testing.com';
  const password1 = 'test-password1';

  const user2 = 'test-user2@fragments-testing';
  const password2 = 'test-password2';

  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/unknown-id').expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/unknown-id')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  test('authenticated users can get an existing plain text fragment', async () => {
    const data = 'hello from fragment';

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/plain')
      .send(data);

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app).get(`/v1/fragments/${fragmentId}`).auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/^text\/plain/);
    expect(getRes.text).toBe(data);
  });

  test('authenticated users can get an existing Markdown fragment', async () => {
    const data = '# Markdown Fragment';

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/markdown')
      .send(data);

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app).get(`/v1/fragments/${fragmentId}`).auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/^text\/markdown/);
    expect(getRes.text).toBe(data);
  });

  test('authenticated users can get an existing JSON fragment', async () => {
    const data = {
      service: 'inventory',
      revision: 2,
    };

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(data));

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app).get(`/v1/fragments/${fragmentId}`).auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/^application\/json/);
    expect(getRes.body).toEqual(data);
  });

  test('the original Content-Type is returned', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/plain; charset=utf-8')
      .send('charset fragment');

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app).get(`/v1/fragments/${fragmentId}`).auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/^text\/plain; charset=utf-8/);
    expect(getRes.text).toBe('charset fragment');
  });

  test('unknown fragment IDs return 404', async () => {
    const res = await request(app).get('/v1/fragments/does-not-exist').auth(user1, password1);

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
    expect(res.body.error.message).toBe('Fragment not found');
  });

  test("one user cannot access another user's fragment", async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/plain')
      .send('private fragment');

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app).get(`/v1/fragments/${fragmentId}`).auth(user2, password2);

    expect(getRes.statusCode).toBe(404);
    expect(getRes.body.status).toBe('error');
    expect(getRes.body.error.code).toBe(404);
  });
});
