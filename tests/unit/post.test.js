// tests/unit/post.test.js

const request = require('supertest');

const app = require('../../src/app');
const hash = require('../../src/hash');

describe('POST /v1/fragments', () => {
  const user = 'test-user1@fragments-testing.com';
  const password = 'test-password1';

  test('unauthenticated requests are denied', () =>
    request(app).post('/v1/fragments').set('Content-Type', 'text/plain').send('hello').expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .post('/v1/fragments')
      .auth('invalid@email.com', 'incorrect_password')
      .set('Content-Type', 'text/plain')
      .send('hello')
      .expect(401));

  test('unsupported Content-Types are rejected', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth(user, password)
      .set('Content-Type', 'application/pdf')
      .send(Buffer.from('not supported'));

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(415);
  });

  test('authenticated users can create a PNG image fragment', async () => {
    const data = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZpJ8AAAAASUVORK5CYII=',
      'base64'
    );

    const res = await request(app)
      .post('/v1/fragments')
      .auth(user, password)
      .set('Content-Type', 'image/png')
      .send(data);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('image/png');
    expect(res.body.fragment.size).toBe(data.length);
  });

  test('authenticated users can create a plain text fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth(user, password)
      .set('Content-Type', 'text/plain')
      .send('hello');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toBeDefined();
  });

  test('authenticated users can create a Markdown fragment', async () => {
    const data = '# Release Notes';

    const res = await request(app)
      .post('/v1/fragments')
      .auth(user, password)
      .set('Content-Type', 'text/markdown')
      .send(data);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('text/markdown');
    expect(res.body.fragment.size).toBe(Buffer.byteLength(data));
  });

  test('authenticated users can create an application/json fragment', async () => {
    const data = JSON.stringify({
      service: 'inventory',
      revision: 2,
    });

    const res = await request(app)
      .post('/v1/fragments')
      .auth(user, password)
      .set('Content-Type', 'application/json')
      .send(data);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('application/json');
    expect(res.body.fragment.size).toBe(Buffer.byteLength(data));
  });

  test('authenticated users can create another text/* fragment type', async () => {
    const data = 'body { font-family: sans-serif; }';

    const res = await request(app)
      .post('/v1/fragments')
      .auth(user, password)
      .set('Content-Type', 'text/css')
      .send(data);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('text/css');
    expect(res.body.fragment.size).toBe(Buffer.byteLength(data));
  });

  test('created fragment includes the expected metadata', async () => {
    const data = 'hello';

    const res = await request(app)
      .post('/v1/fragments')
      .auth(user, password)
      .set('Content-Type', 'text/plain')
      .send(data);

    const fragment = res.body.fragment;

    expect(res.statusCode).toBe(201);
    expect(fragment.id).toMatch(
      /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
    );
    expect(fragment.ownerId).toBe(hash(user));
    expect(fragment.type).toBe('text/plain');
    expect(fragment.size).toBe(Buffer.byteLength(data));
    expect(Date.parse(fragment.created)).not.toBeNaN();
    expect(Date.parse(fragment.updated)).not.toBeNaN();
  });

  test('Content-Type charset is preserved in fragment metadata', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth(user, password)
      .set('Content-Type', 'text/plain; charset=utf-8')
      .send('hello');

    expect(res.statusCode).toBe(201);
    expect(res.body.fragment.type).toBe('text/plain; charset=utf-8');
  });

  test('response includes a full Location header for the created fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth(user, password)
      .set('Content-Type', 'text/plain')
      .send('hello');

    expect(res.statusCode).toBe(201);
    expect(res.headers.location).toBe(`http://localhost:8080/v1/fragments/${res.body.fragment.id}`);
  });
});
