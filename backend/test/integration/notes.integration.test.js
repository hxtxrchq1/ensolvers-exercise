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

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../../dist/app.module');
const { configureNotesApp } = require('../../dist/notes/notes-app.config');
const { createTestSession } = require('../helpers/test-session');

let app;
let baseUrl;
let session;

before(async () => {
  app = await NestFactory.create(AppModule, { logger: false });
  configureNotesApp(app);
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  const apiUrl = `http://127.0.0.1:${address.port}/api`;
  baseUrl = `${apiUrl}/notes`;
  session = await createTestSession(apiUrl);
});

after(async () => {
  await app?.close();
});

test('rejects note requests without a session', async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 401);
});

test('persists and manages the note lifecycle through the REST API', async () => {
  let noteId;

  try {
    const invalidCreate = await session.request(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '  ', content: 'Content' }),
    });
    assert.equal(invalidCreate.status, 400);

    const invalidCreateType = await session.request(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 42, content: 'Content' }),
    });
    assert.equal(invalidCreateType.status, 400);

    const unexpectedField = await session.request(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Title',
        content: 'Content',
        isArchived: true,
      }),
    });
    assert.equal(unexpectedField.status, 400);

    const createdResponse = await session.request(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Integration note', content: 'Persisted' }),
    });
    assert.equal(createdResponse.status, 201);
    const created = await createdResponse.json();
    noteId = created.id;
    assert.match(
      noteId,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    assert.equal(created.isArchived, false);

    const activeResponse = await session.request(baseUrl);
    assert.equal(activeResponse.status, 200);
    assert.ok((await activeResponse.json()).some((note) => note.id === noteId));

    const archivedResponse = await session.request(`${baseUrl}/archived`);
    assert.equal(archivedResponse.status, 200);
    assert.ok(
      !(await archivedResponse.json()).some((note) => note.id === noteId),
    );

    const invalidIdResponse = await session.request(`${baseUrl}/not-a-uuid`);
    assert.equal(invalidIdResponse.status, 400);

    const missingResponse = await session.request(
      `${baseUrl}/00000000-0000-4000-8000-000000000001`,
    );
    assert.equal(missingResponse.status, 404);

    const foundResponse = await session.request(`${baseUrl}/${noteId}`);
    assert.equal(foundResponse.status, 200);
    assert.equal((await foundResponse.json()).id, noteId);

    const invalidUpdate = await session.request(`${baseUrl}/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });
    assert.equal(invalidUpdate.status, 400);

    const emptyUpdate = await session.request(`${baseUrl}/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(emptyUpdate.status, 400);

    const nullUpdate = await session.request(`${baseUrl}/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: null }),
    });
    assert.equal(nullUpdate.status, 400);

    const forbiddenUpdate = await session.request(`${baseUrl}/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchived: true }),
    });
    assert.equal(forbiddenUpdate.status, 400);

    const updateResponse = await session.request(`${baseUrl}/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated integration note' }),
    });
    assert.equal(updateResponse.status, 200);
    const updated = await updateResponse.json();
    assert.equal(updated.title, 'Updated integration note');
    assert.equal(updated.isArchived, false);

    const archiveResponse = await session.request(
      `${baseUrl}/${noteId}/archive`,
      {
        method: 'PATCH',
      },
    );
    assert.equal(archiveResponse.status, 200);
    assert.equal((await archiveResponse.json()).isArchived, true);

    const repeatedArchive = await session.request(
      `${baseUrl}/${noteId}/archive`,
      {
        method: 'PATCH',
      },
    );
    assert.equal(repeatedArchive.status, 400);
    assert.match((await repeatedArchive.json()).message, /archivar/);

    const archivedList = await session.request(`${baseUrl}/archived`);
    assert.ok((await archivedList.json()).some((note) => note.id === noteId));

    const activeList = await session.request(baseUrl);
    assert.ok(!(await activeList.json()).some((note) => note.id === noteId));

    const unarchiveResponse = await session.request(
      `${baseUrl}/${noteId}/unarchive`,
      {
        method: 'PATCH',
      },
    );
    assert.equal(unarchiveResponse.status, 200);
    assert.equal((await unarchiveResponse.json()).isArchived, false);

    const repeatedUnarchive = await session.request(
      `${baseUrl}/${noteId}/unarchive`,
      {
        method: 'PATCH',
      },
    );
    assert.equal(repeatedUnarchive.status, 400);
    assert.match((await repeatedUnarchive.json()).message, /desarchivar/);

    const deleteResponse = await session.request(`${baseUrl}/${noteId}`, {
      method: 'DELETE',
    });
    assert.equal(deleteResponse.status, 204);
    assert.equal(await deleteResponse.text(), '');
    noteId = undefined;

    const deletedResponse = await session.request(
      `${baseUrl}/00000000-0000-4000-8000-000000000001`,
    );
    assert.equal(deletedResponse.status, 404);
  } finally {
    if (noteId) {
      await session.request(`${baseUrl}/${noteId}`, { method: 'DELETE' });
    }
  }
});
