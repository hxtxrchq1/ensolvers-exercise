const assert = require('node:assert/strict');
const test = require('node:test');
const { UnauthorizedException } = require('@nestjs/common');
const { randomBytes } = require('node:crypto');
const { AuthService } = require('../../dist/auth/auth.service');

const demoCredentials = {
  username: 'prueba',
  password: 'Prueba123!',
};

function createAuthService() {
  let user;
  let upsertCount = 0;
  const repository = {
    upsertDemoUser: async (data) => {
      upsertCount += 1;
      user = { id: 'user-1', ...data };
      return user;
    },
    findByUsername: async (username) =>
      user?.username === username || username === 'legacy' ? user : null,
  };
  const config = {
    JWT_SECRET: randomBytes(48).toString('base64'),
    JWT_EXPIRES_IN: '1h',
    DEMO_USERNAME: demoCredentials.username,
    DEMO_PASSWORD: demoCredentials.password,
  };
  const configService = {
    getOrThrow: (name) => config[name],
  };

  return {
    service: new AuthService(repository, configService),
    getUser: () => user,
    getUpsertCount: () => upsertCount,
  };
}

test('creates the demo user idempotently with a salted password hash', async () => {
  const { service, getUser, getUpsertCount } = createAuthService();

  await service.onModuleInit();
  const firstUser = getUser();
  await service.onModuleInit();
  const secondUser = getUser();

  assert.equal(firstUser.username, demoCredentials.username);
  assert.notEqual(firstUser.passwordHash, demoCredentials.password);
  assert.notEqual(firstUser.passwordSalt, demoCredentials.password);
  assert.equal(secondUser.passwordSalt, firstUser.passwordSalt);
  assert.equal(secondUser.id, firstUser.id);
  assert.equal(getUpsertCount(), 1);
});

test('authenticates valid credentials and verifies the signed token', async () => {
  const { service } = createAuthService();
  await service.onModuleInit();

  const result = await service.login(demoCredentials);

  assert.deepEqual(result.user, { id: 'user-1', username: 'prueba' });
  assert.equal(service.verifyToken(result.token).id, result.user.id);
});

test('rejects invalid username and password without revealing which failed', async () => {
  const { service } = createAuthService();
  await service.onModuleInit();

  await assert.rejects(
    service.login({ ...demoCredentials, password: 'incorrect' }),
    UnauthorizedException,
  );
  await assert.rejects(
    service.login({ ...demoCredentials, username: 'unknown' }),
    UnauthorizedException,
  );
  await assert.rejects(
    service.login({ ...demoCredentials, username: 'legacy' }),
    UnauthorizedException,
  );
});

test('rejects tampered, expired, and previous demo-user tokens', async () => {
  const { service } = createAuthService();
  await service.onModuleInit();

  const login = await service.login(demoCredentials);
  const [header, payload, signature] = login.token.split('.');
  const replacement = signature[0] === 'A' ? 'B' : 'A';
  const tampered = `${header}.${payload}.${replacement}${signature.slice(1)}`;
  assert.throws(() => service.verifyToken(tampered), UnauthorizedException);

  const now = Math.floor(Date.now() / 1000);
  const expired = service.signToken({
    sub: login.user.id,
    username: login.user.username,
    iss: 'notes-app',
    iat: now - 120,
    exp: now - 60,
  });
  assert.throws(() => service.verifyToken(expired), UnauthorizedException);

  const previousDemoUser = service.signToken({
    sub: login.user.id,
    username: 'legacy',
    iss: 'notes-app',
    iat: now,
    exp: now + 60,
  });
  assert.throws(
    () => service.verifyToken(previousDemoUser),
    UnauthorizedException,
  );
});
