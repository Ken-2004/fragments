// tests/unit/put.test.js

const request = require('supertest');

const app = require('../../src/app');

describe('PUT /v1/fragments/:id', () => {
  const user1 = 'test-user1@fragments-testing.com';
  const password1 = 'test-password1';

  const user2 = 'test-user2@fragments-testing';
  const password2 = 'test-password2';

  test('unauthenticated requests are denied', () =>
    request(app)
      .put('/v1/fragments/unknown-id')
      .set('Content-Type', 'text/plain')
      .send('updated')
      .expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .put('/v1/fragments/unknown-id')
      .auth('invalid@email.com', 'incorrect_password')
      .set('Content-Type', 'text/plain')
      .send('updated')
      .expect(401));

  test('unknown fragment IDs return 404', async () => {
    const res = await request(app)
      .put('/v1/fragments/does-not-exist')
      .auth(user1, password1)
      .set('Content-Type', 'text/plain')
      .send('updated');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
  });

  test('authenticated users can update an existing fragment', async () => {
    const originalData = 'original fragment data';

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/plain')
      .send(originalData);

    expect(postRes.statusCode).toBe(201);

    const original = postRes.body.fragment;

    // Ensure the updated timestamp can be distinguished from the original.
    await new Promise((resolve) => setTimeout(resolve, 10));

    const updatedData = 'updated fragment data';

    const putRes = await request(app)
      .put(`/v1/fragments/${original.id}`)
      .auth(user1, password1)
      .set('Content-Type', 'text/plain')
      .send(updatedData);

    expect(putRes.statusCode).toBe(200);
    expect(putRes.body.status).toBe('ok');

    const updated = putRes.body.fragment;

    expect(updated.id).toBe(original.id);
    expect(updated.ownerId).toBe(original.ownerId);
    expect(updated.created).toBe(original.created);
    expect(updated.type).toBe(original.type);
    expect(updated.size).toBe(Buffer.byteLength(updatedData));

    expect(Date.parse(updated.updated)).toBeGreaterThan(Date.parse(original.updated));
  });

  test('GET returns the new data after a fragment is updated', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/plain')
      .send('before update');

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const putRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth(user1, password1)
      .set('Content-Type', 'text/plain')
      .send('after update');

    expect(putRes.statusCode).toBe(200);

    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe('after update');
  });

  test('a fragment Content-Type cannot be changed', async () => {
    const originalData = 'plain text data';

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/plain')
      .send(originalData);

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const putRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth(user1, password1)
      .set('Content-Type', 'text/markdown')
      .send('# changed type');

    expect(putRes.statusCode).toBe(400);
    expect(putRes.body.status).toBe('error');
    expect(putRes.body.error.code).toBe(400);

    // Verify the failed PUT did not overwrite the original fragment.
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe(originalData);
    expect(getRes.headers['content-type']).toMatch(/^text\/plain/);
  });

  test("one user cannot update another user's fragment", async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/plain')
      .send('private fragment');

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const putRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth(user2, password2)
      .set('Content-Type', 'text/plain')
      .send('attempted overwrite');

    expect(putRes.statusCode).toBe(404);
    expect(putRes.body.status).toBe('error');
    expect(putRes.body.error.code).toBe(404);

    // The owner's original data must still exist.
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe('private fragment');
  });

  test('image fragments can be updated using the same image Content-Type', async () => {
    const originalImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZpJ8AAAAASUVORK5CYII=',
      'base64'
    );

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'image/png')
      .send(originalImage);

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const updatedImage = Buffer.concat([originalImage, Buffer.from('updated')]);

    const putRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth(user1, password1)
      .set('Content-Type', 'image/png')
      .send(updatedImage);

    expect(putRes.statusCode).toBe(200);
    expect(putRes.body.fragment.type).toBe('image/png');
    expect(putRes.body.fragment.size).toBe(updatedImage.length);
  });
});
