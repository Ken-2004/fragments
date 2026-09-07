// tests/unit/delete.test.js

const request = require('supertest');

const app = require('../../src/app');

describe('DELETE /v1/fragments/:id', () => {
  const user1 = 'test-user1@fragments-testing.com';
  const password1 = 'test-password1';

  const user2 = 'test-user2@fragments-testing';
  const password2 = 'test-password2';

  test('unauthenticated requests are denied', () =>
    request(app).delete('/v1/fragments/unknown-id').expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .delete('/v1/fragments/unknown-id')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  test('unknown fragment IDs return 404', async () => {
    const res = await request(app)
      .delete('/v1/fragments/does-not-exist')
      .auth(user1, password1);

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
  });

  test('authenticated users can delete their own fragment', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/plain')
      .send('delete me');

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const deleteRes = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth(user1, password1);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.status).toBe('ok');

    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth(user1, password1);

    expect(getRes.statusCode).toBe(404);
  });

  test("one user cannot delete another user's fragment", async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/plain')
      .send('private fragment');

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const deleteRes = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth(user2, password2);

    expect(deleteRes.statusCode).toBe(404);
    expect(deleteRes.body.status).toBe('error');
    expect(deleteRes.body.error.code).toBe(404);

    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe('private fragment');
  });
});
