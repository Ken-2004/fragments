// tests/unit/get-by-id-ext.test.js

const request = require('supertest');
const sharp = require('sharp');

const app = require('../../src/app');

describe('GET /v1/fragments/:id.:ext', () => {
  const user1 = 'test-user1@fragments-testing.com';
  const password1 = 'test-password1';

  const user2 = 'test-user2@fragments-testing';
  const password2 = 'test-password2';

  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/unknown-id.html').expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/unknown-id.html')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  test('Markdown fragments can be converted to HTML', async () => {
    const markdown = '# Release Notes\n\nThis is **Markdown**.';

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/markdown')
      .send(markdown);

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.html`)
      .auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/^text\/html; charset=utf-8/);
    expect(getRes.text).toContain('<h1>Release Notes</h1>');
    expect(getRes.text).toContain('<p>This is <strong>Markdown</strong>.</p>');
  });

  test('extension matching is case-insensitive', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/markdown')
      .send('# Uppercase Extension');

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.HTML`)
      .auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/^text\/html/);
    expect(getRes.text).toContain('<h1>Uppercase Extension</h1>');
  });

  test('unsupported conversions return 415', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/plain')
      .send('plain text cannot be converted to HTML');

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.html`)
      .auth(user1, password1);

    expect(getRes.statusCode).toBe(415);
    expect(getRes.body.status).toBe('error');
    expect(getRes.body.error.code).toBe(415);
  });

  test('unsupported Markdown output extensions return 415', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/markdown')
      .send('# Markdown');

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.json`)
      .auth(user1, password1);

    expect(getRes.statusCode).toBe(415);
    expect(getRes.body.status).toBe('error');
    expect(getRes.body.error.code).toBe(415);
  });

  test('unknown fragment IDs return 404', async () => {
    const res = await request(app).get('/v1/fragments/does-not-exist.html').auth(user1, password1);

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
  });

  test("one user cannot convert another user's fragment", async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/markdown')
      .send('# Private Markdown');

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.html`)
      .auth(user2, password2);

    expect(getRes.statusCode).toBe(404);
    expect(getRes.body.status).toBe('error');
    expect(getRes.body.error.code).toBe(404);
  });

  test('Markdown fragments can be converted to plain text', async () => {
    const data = '# Service Update\n\nThis is **Markdown**.';

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/markdown')
      .send(data);

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.txt`)
      .auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/^text\/plain/);
    expect(getRes.text).toMatch(/Service Update/i);
    expect(getRes.text).toContain('This is Markdown.');
  });

  test('HTML fragments can be converted to plain text', async () => {
    const data = '<h1>Service Update</h1><p>This is <strong>HTML</strong>.</p>';

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'text/html')
      .send(data);

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.txt`)
      .auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/^text\/plain/);
    expect(getRes.text).toMatch(/Service Update/i);
    expect(getRes.text).toContain('This is HTML.');
  });

  test('JSON fragments can be converted to plain text', async () => {
    const data = JSON.stringify({
      service: 'inventory',
      revision: 3,
    });

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'application/json')
      .send(data);

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.txt`)
      .auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/^text\/plain/);
    expect(getRes.text).toBe(data);
  });

  test.each([
    ['jpg', 'jpeg', 'image/jpeg'],
    ['webp', 'webp', 'image/webp'],
    ['gif', 'gif', 'image/gif'],
  ])('PNG fragments can be converted to .%s', async (extension, expectedFormat, expectedType) => {
    const png = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: {
          r: 255,
          g: 0,
          b: 0,
          alpha: 1,
        },
      },
    })
      .png()
      .toBuffer();

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'image/png')
      .send(png);

    expect(postRes.statusCode).toBe(201);
    expect(postRes.body.fragment.type).toBe('image/png');

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.${extension}`)
      .auth(user1, password1);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(
      new RegExp(`^${expectedType.replace('/', '\\/')}`)
    );
    expect(Buffer.isBuffer(getRes.body)).toBe(true);

    const metadata = await sharp(getRes.body).metadata();
    expect(metadata.format).toBe(expectedFormat);
  });

  test('unsupported image conversion extensions return 415', async () => {
    const png = await sharp({
      create: {
        width: 5,
        height: 5,
        channels: 3,
        background: {
          r: 0,
          g: 0,
          b: 255,
        },
      },
    })
      .png()
      .toBuffer();

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth(user1, password1)
      .set('Content-Type', 'image/png')
      .send(png);

    expect(postRes.statusCode).toBe(201);

    const fragmentId = postRes.body.fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.bmp`)
      .auth(user1, password1);

    expect(getRes.statusCode).toBe(415);
    expect(getRes.body.status).toBe('error');
    expect(getRes.body.error.code).toBe(415);
  });

});
