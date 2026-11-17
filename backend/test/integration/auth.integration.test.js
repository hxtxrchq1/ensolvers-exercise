const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

const databaseUrl = process.env.DATABASE_URL_TEST;

if (!databaseUrl) {
  throw new Error(
    'Define DATABASE_URL_TEST para una base PostgreSQL local aislada llamada notes_app_test.',
  );
}

const testDatabase = new URL(databaseUrl);
const databaseName = decodeURIComponent(testDatabase.pathname.slice(1));

if (
  !['localhost', '127.0.0.1', '::1'].includes(testDatabase.hostname) ||
  databaseName !== 'notes_app_test'
) {
  throw new Error(
    'Las pruebas de integración solo se ejecutan contra notes_app_test en localhost.',
  );
}

process.env.DATABASE_URL = databaseUrl;
process.env.PORT = '3000';

const { ConfigService } = require('@nestjs/config');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../../dist/app.module');
const { configureNotesApp } = require('../../dist/notes/notes-app.config');

let app;
let apiUrl;
let demoCredentials;
let frontendOrigin;

function encodeSegment(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function createExpiredToken(user, secret) {
  const now = Math.floor(Date.now() / 1000);
  const content = `${encodeSegment({ alg: 'HS256', typ: 'JWT' })}.${encodeSegment(
    {
      sub: user.id,
      username: user.username,
      iss: 'notes-app',
      iat: now - 120,
      exp: now - 60,
    },
  )}`;
  const signature = require('node:crypto')
    .createHmac('sha256', secret)
    .update(content)
    .digest('base64url');

  return `${content}.${signature}`;
}

before(async () => {
  app = await NestFactory.create(AppModule, { logger: false });
  configureNotesApp(app);
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  apiUrl = `http://127.0.0.1:${address.port}/api`;
  const config = app.get(ConfigService);
  frontendOrigin = config.getOrThrow('FRONTEND_ORIGIN');
  demoCredentials = {
    username: config.getOrThrow('DEMO_USERNAME'),
    password: config.getOrThrow('DEMO_PASSWORD'),
  };
});

after(async () => {
  await app?.close();
});

test('logs in, protects API routes, restores the session, and logs out', async () => {
  const invalidLogin = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: frontendOrigin,
    },
    body: JSON.stringify({
      username: demoCredentials.username,
      password: `${demoCredentials.password}wrong`,
    }),
  });
  assert.equal(invalidLogin.status, 401);

  const unauthenticatedMe = await fetch(`${apiUrl}/auth/me`);
  assert.equal(unauthenticatedMe.status, 401);
  const unauthenticatedNotes = await fetch(`${apiUrl}/notes`);
  assert.equal(unauthenticatedNotes.status, 401);
  const unauthenticatedCategories = await fetch(`${apiUrl}/categories`);
  assert.equal(unauthenticatedCategories.status, 401);

  const loginResponse = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: frontendOrigin,
    },
    body: JSON.stringify(demoCredentials),
  });
  assert.equal(loginResponse.status, 201);
  const loginBody = await loginResponse.json();
  assert.deepEqual(Object.keys(loginBody), ['user']);
  assert.equal(loginBody.user.username, demoCredentials.username);

  const setCookie = loginResponse.headers.get('set-cookie');
  assert.ok(setCookie);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  assert.match(setCookie, /Path=\/api/i);
  const sessionCookie = setCookie.split(';')[0];

  const authenticatedMe = await fetch(`${apiUrl}/auth/me`, {
    headers: { Cookie: sessionCookie },
  });
  assert.equal(authenticatedMe.status, 200);
  assert.deepEqual(await authenticatedMe.json(), loginBody.user);

  const authenticatedNotes = await fetch(`${apiUrl}/notes`, {
    headers: { Cookie: sessionCookie },
  });
  assert.equal(authenticatedNotes.status, 200);
  const authenticatedCategories = await fetch(`${apiUrl}/categories`, {
    headers: { Cookie: sessionCookie },
  });
  assert.equal(authenticatedCategories.status, 200);

  const config = app.get(ConfigService);
  const invalidTokenResponse = await fetch(`${apiUrl}/auth/me`, {
    headers: { Cookie: 'notes_session=invalid.token.value' },
  });
  assert.equal(invalidTokenResponse.status, 401);

  const expiredToken = createExpiredToken(
    loginBody.user,
    config.getOrThrow('JWT_SECRET'),
  );
  const expiredTokenResponse = await fetch(`${apiUrl}/auth/me`, {
    headers: { Cookie: `notes_session=${expiredToken}` },
  });
  assert.equal(expiredTokenResponse.status, 401);

  const logoutResponse = await fetch(`${apiUrl}/auth/logout`, {
    method: 'POST',
    headers: { Cookie: sessionCookie, Origin: frontendOrigin },
  });
  assert.equal(logoutResponse.status, 204);
  assert.match(
    logoutResponse.headers.get('set-cookie'),
    /Expires=Thu, 01 Jan 1970/i,
  );

  const sessionAfterLogout = await fetch(`${apiUrl}/auth/me`);
  assert.equal(sessionAfterLogout.status, 401);
});
