const assert = require('node:assert/strict');
const test = require('node:test');
const { configureNotesApp } = require('../../dist/notes/notes-app.config');

test('configures exact-origin credentialed CORS for API methods and JSON', () => {
  const expectedOrigin = 'https://notes.chiqo.cc.cd';
  let corsOptions;
  const app = {
    get() {
      return {
        getOrThrow(name) {
          assert.equal(name, 'FRONTEND_ORIGIN');
          return expectedOrigin;
        },
      };
    },
    enableShutdownHooks() {},
    setGlobalPrefix(prefix) {
      assert.equal(prefix, 'api');
    },
    enableCors(options) {
      corsOptions = options;
    },
    useGlobalPipes() {},
  };

  configureNotesApp(app);

  assert.deepEqual(corsOptions, {
    origin: expectedOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  });
  assert.notEqual(corsOptions.origin, '*');
});
