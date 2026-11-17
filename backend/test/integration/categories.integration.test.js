const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { randomUUID } = require('node:crypto');

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

const { PrismaClient } = require('@prisma/client');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../../dist/app.module');
const { configureNotesApp } = require('../../dist/notes/notes-app.config');
const { createTestSession } = require('../helpers/test-session');

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
let app;
let notesUrl;
let categoriesUrl;
let apiUrl;
let session;

before(async () => {
  app = await NestFactory.create(AppModule, { logger: false });
  configureNotesApp(app);
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  apiUrl = `http://127.0.0.1:${address.port}/api`;
  notesUrl = `${apiUrl}/notes`;
  categoriesUrl = `${apiUrl}/categories`;
  session = await createTestSession(apiUrl);
});

after(async () => {
  await app?.close();
  await prisma.$disconnect();
});

test('rejects category and note requests without a session', async () => {
  const categoriesResponse = await fetch(categoriesUrl);
  assert.equal(categoriesResponse.status, 401);

  const notesResponse = await fetch(notesUrl);
  assert.equal(notesResponse.status, 401);
});

test('creates and lists categories, associates them, and filters active notes', async () => {
  const suffix = randomUUID();
  const categoryName = `Integration ${suffix}`;
  const noteIds = [];
  let categoryId;

  try {
    const invalidCategory = await session.request(categoriesUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    });
    assert.equal(invalidCategory.status, 400);

    const createdCategoryResponse = await session.request(categoriesUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: categoryName, color: '#49684c' }),
    });
    assert.equal(createdCategoryResponse.status, 201);
    const createdCategory = await createdCategoryResponse.json();
    categoryId = createdCategory.id;
    assert.equal(createdCategory.name, categoryName);
    assert.equal(createdCategory.color, '#49684c');

    const duplicateCategory = await session.request(categoriesUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: categoryName }),
    });
    assert.equal(duplicateCategory.status, 409);

    const listedCategoriesResponse = await session.request(categoriesUrl);
    assert.equal(listedCategoriesResponse.status, 200);
    assert.ok(
      (await listedCategoriesResponse.json()).some(
        (category) => category.id === categoryId,
      ),
    );

    const createNote = async (title) => {
      const response = await session.request(notesUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: 'Integration content' }),
      });
      assert.equal(response.status, 201);
      const note = await response.json();
      noteIds.push(note.id);
      return note;
    };

    const matchingNote = await createNote(`Matching ${suffix}`);
    const unmatchedNote = await createNote(`Unmatched ${suffix}`);
    const archivedNote = await createNote(`Archived ${suffix}`);

    const invalidCategoryId = await session.request(
      `${notesUrl}?categoryId=not-a-uuid`,
    );
    assert.equal(invalidCategoryId.status, 400);

    const missingCategoryId = '00000000-0000-4000-8000-000000000001';
    const missingCategoryFilter = await session.request(
      `${notesUrl}?categoryId=${missingCategoryId}`,
    );
    assert.equal(missingCategoryFilter.status, 404);

    const assignResponse = await session.request(
      `${notesUrl}/${matchingNote.id}/categories/${categoryId}`,
      { method: 'POST' },
    );
    assert.equal(assignResponse.status, 204);

    const duplicateAssignment = await session.request(
      `${notesUrl}/${matchingNote.id}/categories/${categoryId}`,
      { method: 'POST' },
    );
    assert.equal(duplicateAssignment.status, 204);

    const filteredResponse = await session.request(
      `${notesUrl}?categoryId=${categoryId}`,
    );
    assert.equal(filteredResponse.status, 200);
    const filteredNotes = await filteredResponse.json();
    assert.ok(filteredNotes.some((note) => note.id === matchingNote.id));
    assert.ok(!filteredNotes.some((note) => note.id === unmatchedNote.id));

    const unchangedListResponse = await session.request(notesUrl);
    const unchangedNotes = await unchangedListResponse.json();
    assert.ok(unchangedNotes.some((note) => note.id === matchingNote.id));
    assert.ok(unchangedNotes.some((note) => note.id === unmatchedNote.id));

    const assignMissingNote = await session.request(
      `${notesUrl}/${missingCategoryId}/categories/${categoryId}`,
      { method: 'POST' },
    );
    assert.equal(assignMissingNote.status, 404);

    const assignMissingCategory = await session.request(
      `${notesUrl}/${matchingNote.id}/categories/${missingCategoryId}`,
      { method: 'POST' },
    );
    assert.equal(assignMissingCategory.status, 404);

    const invalidNoteId = await session.request(
      `${notesUrl}/not-a-uuid/categories/${categoryId}`,
      { method: 'POST' },
    );
    assert.equal(invalidNoteId.status, 400);

    const invalidCategoryPathId = await session.request(
      `${notesUrl}/${matchingNote.id}/categories/not-a-uuid`,
      { method: 'POST' },
    );
    assert.equal(invalidCategoryPathId.status, 400);

    const archiveResponse = await session.request(
      `${notesUrl}/${archivedNote.id}/archive`,
      { method: 'PATCH' },
    );
    assert.equal(archiveResponse.status, 200);
    await session.request(
      `${notesUrl}/${archivedNote.id}/categories/${categoryId}`,
      {
        method: 'POST',
      },
    );

    const activeFilteredResponse = await session.request(
      `${notesUrl}?categoryId=${categoryId}`,
    );
    assert.ok(
      !(await activeFilteredResponse.json()).some(
        (note) => note.id === archivedNote.id,
      ),
    );

    const archivedListResponse = await session.request(`${notesUrl}/archived`);
    const archivedNotes = await archivedListResponse.json();
    assert.ok(archivedNotes.some((note) => note.id === archivedNote.id));
    assert.equal(
      archivedNotes.find((note) => note.id === archivedNote.id).categories[0]
        .id,
      categoryId,
    );

    const removeResponse = await session.request(
      `${notesUrl}/${matchingNote.id}/categories/${categoryId}`,
      { method: 'DELETE' },
    );
    assert.equal(removeResponse.status, 204);

    const filteredAfterRemoval = await session.request(
      `${notesUrl}?categoryId=${categoryId}`,
    );
    assert.ok(
      !(await filteredAfterRemoval.json()).some(
        (note) => note.id === matchingNote.id,
      ),
    );

    const removeMissingAssociation = await session.request(
      `${notesUrl}/${matchingNote.id}/categories/${categoryId}`,
      { method: 'DELETE' },
    );
    assert.equal(removeMissingAssociation.status, 404);

    const categoryStillExists = await session.request(categoriesUrl);
    assert.ok(
      (await categoryStillExists.json()).some(
        (category) => category.id === categoryId,
      ),
    );
  } finally {
    await prisma.note.deleteMany({ where: { id: { in: noteIds } } });
    if (categoryId) {
      await prisma.category.deleteMany({ where: { id: categoryId } });
    }
  }
});
