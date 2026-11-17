const assert = require('node:assert/strict');
const test = require('node:test');
const { randomBytes } = require('node:crypto');
const { validateEnvironment } = require('../../dist/config/env.validation');

const validConfig = {
  DATABASE_URL: 'postgresql://localhost:5432/notes_app',
  PORT: '3000',
  FRONTEND_ORIGIN: 'http://localhost:5173',
  JWT_SECRET: randomBytes(48).toString('base64'),
  JWT_EXPIRES_IN: '1h',
  DEMO_USERNAME: 'prueba',
  DEMO_PASSWORD: 'Prueba123!',
};

test('accepts valid authentication settings', () => {
  const validated = validateEnvironment(validConfig);
  assert.equal(validated.PORT, 3000);
  assert.equal(validated.FRONTEND_ORIGIN, validConfig.FRONTEND_ORIGIN);
});

test('accepts the legacy FRONTEND_URL for existing local environments', () => {
  const config = { ...validConfig, FRONTEND_URL: 'http://localhost:5174' };
  delete config.FRONTEND_ORIGIN;
  const validated = validateEnvironment(config);

  assert.equal(validated.FRONTEND_ORIGIN, 'http://localhost:5174');
});

test('rejects short or placeholder JWT secrets', () => {
  assert.throws(() =>
    validateEnvironment({ ...validConfig, JWT_SECRET: 'too-short' }),
  );
  assert.throws(() =>
    validateEnvironment({
      ...validConfig,
      JWT_SECRET: 'replace-with-a-random-secret-of-at-least-32-characters',
    }),
  );
});

test('rejects invalid token expiration and demo credentials', () => {
  assert.throws(() =>
    validateEnvironment({ ...validConfig, JWT_EXPIRES_IN: '0h' }),
  );
  assert.throws(() =>
    validateEnvironment({ ...validConfig, DEMO_PASSWORD: 'short' }),
  );
});
