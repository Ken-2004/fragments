// tests/unit/auth-index.test.js

describe('auth configuration selection', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reload the auth module for every test so environment changes are applied.
    jest.resetModules();

    process.env = { ...originalEnv };

    delete process.env.AWS_COGNITO_POOL_ID;
    delete process.env.AWS_COGNITO_CLIENT_ID;
    delete process.env.HTPASSWD_FILE;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function mockAuthProviders() {
    jest.doMock('../../src/auth/cognito', () => ({
      provider: 'cognito',
    }));

    jest.doMock('../../src/auth/basic-auth', () => ({
      provider: 'basic-auth',
    }));
  }

  test('throws if Cognito and Basic Auth are both configured', () => {
    process.env.AWS_COGNITO_POOL_ID = 'us-east-2_test';
    process.env.AWS_COGNITO_CLIENT_ID = 'client-id';
    process.env.HTPASSWD_FILE = 'tests/.htpasswd';

    expect(() => require('../../src/auth')).toThrow(
      'env contains configuration for both AWS Cognito and HTTP Basic Auth'
    );
  });

  test('uses Cognito when Cognito environment variables are configured', () => {
    process.env.AWS_COGNITO_POOL_ID = 'us-east-2_test';
    process.env.AWS_COGNITO_CLIENT_ID = 'client-id';

    mockAuthProviders();

    const auth = require('../../src/auth');

    expect(auth.provider).toBe('cognito');
  });

  test('uses Basic Auth when HTPASSWD_FILE is configured outside production', () => {
    process.env.HTPASSWD_FILE = 'tests/.htpasswd';
    process.env.NODE_ENV = 'test';

    mockAuthProviders();

    const auth = require('../../src/auth');

    expect(auth.provider).toBe('basic-auth');
  });

  test('throws if no authorization configuration is provided', () => {
    expect(() => require('../../src/auth')).toThrow(
      'missing env vars: no authorization configuration found'
    );
  });

  test('does not allow Basic Auth in production', () => {
    process.env.HTPASSWD_FILE = 'tests/.htpasswd';
    process.env.NODE_ENV = 'production';

    expect(() => require('../../src/auth')).toThrow(
      'missing env vars: no authorization configuration found'
    );
  });
});
