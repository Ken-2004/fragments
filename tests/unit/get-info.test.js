// tests/unit/get-info.test.js

const request = require('supertest');

const app = require('../../src/app');
const hash = require('../../src/hash');

describe('GET /v1/fragments/:id/info', () => {
  const user1 = 'test-user1@fragments-testing.com';
  const password1 = 'test-password1';

  const user2 = 'test-user2@fragments-testing';
  const password2 = 'test-password2';

  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/unknown-id/info').expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/unknown-id/info')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  test('authenticated users can get fragment metadata', async () => {
    const data = '# Fragment Metadata';

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/markdown')
      .send(data);

    expect(postRes.statusCode).toBe(201);

    const createdFragment = postRes.body.fragment;

    const getRes = await request(app)
      .get(`/v1/fragments/${createdFragment.id}/info`)
      .auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.status).toBe('ok');
    expect(getRes.body.fragment).toEqual(createdFragment);
    expect(getRes.body.fragment.ownerId).toBe(hash(user1));
    expect(getRes.body.fragment.type).toBe('text/markdown');
    expect(getRes.body.fragment.size).toBe(Buffer.byteLength(data));
    expect(Date.parse(getRes.body.fragment.created)).not.toBeNaN();
    expect(Date.parse(getRes.body.fragment.updated)).not.toBeNaN();
  });

  test('unknown fragment IDs return 404', async () => {
    const res = await request(app).get('/v1/fragments/does-not-exist/info').auth(user1, password1);

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
    expect(res.body.error.message).toBe('Fragment not found');
  });

  test("one user cannot access another user's fragment metadata", async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/plain')
      .send('private metadata');

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth(user2, password2);

    expect(getRes.statusCode).toBe(404);
    expect(getRes.body.status).toBe('error');
    expect(getRes.body.error.code).toBe(404);
  });
});
