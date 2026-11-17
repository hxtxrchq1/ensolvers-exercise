const assert = require('node:assert/strict');
const test = require('node:test');
const { AuthController } = require('../../dist/auth/auth.controller');

test('sets a host-only HttpOnly Strict cookie with expiry derived from JWT', async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    let cookie;
    const controller = new AuthController({
      login: async () => ({
        token: 'test-token',
        expiresIn: 3600,
        user: { id: 'user-1', username: 'prueba' },
      }),
    });

    await controller.login(
      { username: 'prueba', password: 'test-password' },
      {
        cookie(name, value, options) {
          cookie = { name, value, options };
        },
      },
    );

    assert.deepEqual(cookie, {
      name: 'notes_session',
      value: 'test-token',
      options: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api',
        maxAge: 3_600_000,
      },
    });
    assert.equal('domain' in cookie.options, false);
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});

test('clears the session cookie with matching scope and security attributes', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    let clearedCookie;
    const controller = new AuthController({});

    controller.logout({
      clearCookie(name, options) {
        clearedCookie = { name, options };
      },
    });

    assert.deepEqual(clearedCookie, {
      name: 'notes_session',
      options: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api',
      },
    });
    assert.equal('domain' in clearedCookie.options, false);
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});
