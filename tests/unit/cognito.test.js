const request = require('supertest');

describe('Cognito authentication and log privacy', () => {
  const originalEnv = { ...process.env };
  const token = 'synthetic-test-token';
  let verify;
  let logger;
  let app;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      AWS_COGNITO_POOL_ID: 'us-east-2_test',
      AWS_COGNITO_CLIENT_ID: 'test-client',
    };
    delete process.env.HTPASSWD_FILE;
    delete process.env.AWS_REGION;

    verify = jest.fn();
    logger = Object.fromEntries(
      ['debug', 'info', 'warn', 'error'].map((level) => [level, jest.fn()])
    );
    jest.doMock('aws-jwt-verify', () => ({
      CognitoJwtVerifier: {
        create: jest.fn(() => ({ verify, hydrate: jest.fn().mockResolvedValue() })),
      },
    }));
    jest.doMock('../../src/logger', () => logger);
    app = require('../../src/app');
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.dontMock('aws-jwt-verify');
    jest.dontMock('../../src/logger');
  });

  function loggedText() {
    return JSON.stringify(Object.values(logger).flatMap((method) => method.mock.calls));
  }

  test('verified ID tokens authenticate without logging emails, tokens, or claims', async () => {
    const email = 'private-user@example.com';
    verify.mockResolvedValue({ email, name: 'Private Test Name' });

    const res = await request(app).get('/v1/fragments').auth(token, { type: 'bearer' });

    expect(res.statusCode).toBe(200);
    expect(res.body.fragments).toEqual([]);
    expect(verify).toHaveBeenCalledWith(token);
    expect(require('aws-jwt-verify').CognitoJwtVerifier.create).toHaveBeenCalledWith({
      userPoolId: 'us-east-2_test',
      clientId: 'test-client',
      tokenUse: 'id',
    });
    for (const sensitive of [token, email, 'Private Test Name']) {
      expect(loggedText()).not.toContain(sensitive);
    }
  });

  test.each([
    ['an Error containing token details', new Error(`rejected ${token}`)],
    ['a null rejection', null],
    ['a string rejection', `rejected ${token}`],
  ])('verification failure with %s returns 401 without logging token details', async (_, error) => {
    verify.mockRejectedValue(error);

    const res = await request(app).get('/v1/fragments').auth(token, { type: 'bearer' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe(401);
    expect(verify).toHaveBeenCalledWith(token);
    expect(loggedText()).not.toContain(token);
  });
});
