const assert = require('node:assert/strict');
const test = require('node:test');
const { ForbiddenException, UnauthorizedException } = require('@nestjs/common');
const { AuthGuard } = require('../../dist/auth/auth.guard');

const expectedOrigin = 'https://notes.chiqo.cc.cd';

function createGuard({
  method = 'POST',
  origin,
  cookie,
  isPublic = false,
} = {}) {
  const request = {
    method,
    headers: {
      ...(origin === undefined ? {} : { origin }),
      ...(cookie === undefined ? {} : { cookie }),
    },
  };
  const user = { id: 'user-1', username: 'prueba' };
  const authService = {
    verifyToken(token) {
      assert.equal(token, 'valid-token');
      return user;
    },
  };
  const configService = {
    getOrThrow(name) {
      assert.equal(name, 'FRONTEND_ORIGIN');
      return expectedOrigin;
    },
  };
  const reflector = {
    getAllAndOverride() {
      return isPublic;
    },
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  };

  return {
    guard: new AuthGuard(reflector, authService, configService),
    request,
    user,
    context,
  };
}

test('rejects unsafe requests when Origin is missing, including public login', () => {
  const { guard, context } = createGuard({ isPublic: true });

  assert.throws(() => guard.canActivate(context), ForbiddenException);
});

test('rejects unsafe requests from an origin other than the exact frontend', () => {
  const { guard, context } = createGuard({
    origin: 'https://attacker.example',
    isPublic: true,
  });

  assert.throws(() => guard.canActivate(context), ForbiddenException);
});

test('allows public login from the exact configured frontend origin', () => {
  const { guard, context } = createGuard({
    origin: expectedOrigin,
    isPublic: true,
  });

  assert.equal(guard.canActivate(context), true);
});

test('authenticates protected writes only after the exact origin check', () => {
  const { guard, context, request, user } = createGuard({
    origin: expectedOrigin,
    cookie: 'notes_session=valid-token',
  });

  assert.equal(guard.canActivate(context), true);
  assert.deepEqual(request.authUser, user);
});

test('does not require Origin for safe methods but still requires a session', () => {
  const authenticated = createGuard({
    method: 'GET',
    cookie: 'notes_session=valid-token',
  });
  assert.equal(authenticated.guard.canActivate(authenticated.context), true);

  const anonymous = createGuard({ method: 'GET' });
  assert.throws(
    () => anonymous.guard.canActivate(anonymous.context),
    UnauthorizedException,
  );
});
