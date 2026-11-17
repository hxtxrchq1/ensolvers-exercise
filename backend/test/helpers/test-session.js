const assert = require('node:assert/strict');

async function createTestSession(
  apiUrl,
  origin = process.env.FRONTEND_ORIGIN ?? process.env.FRONTEND_URL,
) {
  const username = process.env.DEMO_USERNAME;
  const password = process.env.DEMO_PASSWORD;

  assert.ok(
    username,
    'DEMO_USERNAME must be configured for integration tests.',
  );
  assert.ok(
    password,
    'DEMO_PASSWORD must be configured for integration tests.',
  );
  assert.ok(
    origin,
    'FRONTEND_ORIGIN must be configured for integration tests.',
  );

  const response = await fetch(new URL('auth/login', `${apiUrl}/`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(response.status, 201, 'Demo login must succeed.');

  const setCookie = response.headers.get('set-cookie');
  assert.ok(setCookie, 'Demo login must set a session cookie.');
  assert.match(setCookie, /HttpOnly/i);

  const cookie = setCookie.split(';')[0];

  return {
    request(input, init = {}) {
      const headers = new Headers(init.headers);
      headers.set('Cookie', cookie);
      headers.set('Origin', origin);

      return fetch(new URL(input, apiUrl), { ...init, headers });
    },
  };
}

module.exports = { createTestSession };
