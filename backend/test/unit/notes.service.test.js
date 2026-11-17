const assert = require('node:assert/strict');
const test = require('node:test');
const { BadRequestException, NotFoundException } = require('@nestjs/common');
const { NotesService } = require('../../dist/notes/notes.service');

function createService(initialNotes = [], initialCategories = []) {
  const notes = new Map(initialNotes.map((note) => [note.id, { ...note }]));
  const categories = new Map(
    initialCategories.map((category) => [category.id, { ...category }]),
  );
  const repository = {
    create: async (data) => {
      const note = {
        id: 'note-1',
        isArchived: false,
        ...data,
      };
      notes.set(note.id, note);
      return note;
    },
    findById: async (id) => notes.get(id) ?? null,
    findMany: async (isArchived, categoryId) =>
      [...notes.values()]
        .filter(
          (note) =>
            note.isArchived === isArchived &&
            (!categoryId || note.categories?.includes(categoryId)),
        )
        .map((note) => ({ ...note, categories: note.categories ?? [] })),
    assignCategory: async (noteId, categoryId) => {
      const note = notes.get(noteId);
      if (!note) throw new Error('Note missing');
      note.categories = [...new Set([...(note.categories ?? []), categoryId])];
    },
    removeCategory: async (noteId, categoryId) => {
      const note = notes.get(noteId);
      if (!note?.categories?.includes(categoryId)) return false;
      note.categories = note.categories.filter((id) => id !== categoryId);
      return true;
    },
    update: async (id, data) => {
      const note = notes.get(id);
      if (!note) return null;
      Object.assign(note, data);
      return note;
    },
    updateArchiveState: async (id, currentState, nextState) => {
      const note = notes.get(id);
      if (!note) return { updated: false, note: null };
      if (note.isArchived !== currentState) {
        return { updated: false, note };
      }
      note.isArchived = nextState;
      return { updated: true, note };
    },
    delete: async (id) => notes.delete(id),
  };
  const categoriesRepository = {
    findById: async (id) => categories.get(id) ?? null,
  };

  return {
    service: new NotesService(repository, categoriesRepository),
    notes,
    categories,
    repository,
  };
}

const category = { id: 'category-1', name: 'Work', color: null };
const activeNote = {
  id: 'note-1',
  title: 'Title',
  content: 'Content',
  isArchived: false,
};

test('creates an active note', async () => {
  const { service, repository } = createService();
  const create = repository.create;
  let received;
  repository.create = async (data) => {
    received = data;
    return create(data);
  };

  const note = await service.create({ title: 'Title', content: 'Content' });

  assert.equal(note.isArchived, false);
  assert.deepEqual(received, { title: 'Title', content: 'Content' });
});

test('lists only active notes', async () => {
  const { service } = createService([
    activeNote,
    { ...activeNote, id: 'note-2', isArchived: true },
  ]);

  assert.deepEqual(
    (await service.listActive()).map((note) => note.id),
    ['note-1'],
  );
});

test('lists only archived notes', async () => {
  const { service } = createService([
    activeNote,
    { ...activeNote, id: 'note-2', isArchived: true },
  ]);

  assert.deepEqual(
    (await service.listArchived()).map((note) => note.id),
    ['note-2'],
  );
});

test('includes associated categories when listing archived notes', async () => {
  const { service } = createService(
    [{ ...activeNote, isArchived: true, categories: ['category-1'] }],
    [category],
  );

  assert.deepEqual(await service.listArchived(), [
    { ...activeNote, isArchived: true, categories: ['category-1'] },
  ]);
});

test('finds an existing note', async () => {
  const { service } = createService([activeNote]);

  assert.equal((await service.findOne('note-1')).id, 'note-1');
});

test('returns not found for a missing note', async () => {
  const { service } = createService();

  await assert.rejects(service.findOne('missing'), NotFoundException);
});

test('updates a note', async () => {
  const { service } = createService([activeNote]);

  const updated = await service.update('note-1', { title: 'Updated' });

  assert.equal(updated.title, 'Updated');
  assert.equal(updated.isArchived, false);
});

test('rejects an empty update', async () => {
  const { service } = createService([activeNote]);

  await assert.rejects(service.update('note-1', {}), BadRequestException);
});

test('archives an active note', async () => {
  const { service } = createService([activeNote]);

  assert.equal((await service.archive('note-1')).isArchived, true);
});

test('unarchives an archived note', async () => {
  const { service } = createService([{ ...activeNote, isArchived: true }]);

  assert.equal((await service.unarchive('note-1')).isArchived, false);
});

test('rejects archiving an already archived note', async () => {
  const { service } = createService([{ ...activeNote, isArchived: true }]);

  await assert.rejects(service.archive('note-1'), (error) => {
    assert.ok(error instanceof BadRequestException);
    assert.match(error.message, /archivar/);
    return true;
  });
});

test('rejects unarchiving an active note', async () => {
  const { service } = createService([activeNote]);

  await assert.rejects(service.unarchive('note-1'), (error) => {
    assert.ok(error instanceof BadRequestException);
    assert.match(error.message, /desarchivar/);
    return true;
  });
});

test('permanently deletes a note', async () => {
  const { service, notes } = createService([activeNote]);

  await service.delete('note-1');

  assert.equal(notes.has('note-1'), false);
});

test('filters active notes by category', async () => {
  const { service } = createService(
    [
      { ...activeNote, categories: ['category-1'] },
      { ...activeNote, id: 'note-2', categories: ['category-2'] },
      {
        ...activeNote,
        id: 'note-3',
        isArchived: true,
        categories: ['category-1'],
      },
    ],
    [category],
  );

  assert.deepEqual(
    (await service.listActive('category-1')).map((note) => note.id),
    ['note-1'],
  );
});

test('returns not found when filtering by a missing category', async () => {
  const { service } = createService();

  await assert.rejects(service.listActive('missing'), NotFoundException);
});

test('assigns a category to an existing note', async () => {
  const { service, notes } = createService([activeNote], [category]);

  await service.assignCategory('note-1', 'category-1');

  assert.deepEqual(notes.get('note-1').categories, ['category-1']);
});

test('preserves existing categories when assigning another category', async () => {
  const { service, notes } = createService(
    [{ ...activeNote, categories: ['category-2'] }],
    [category, { id: 'category-2', name: 'Personal', color: null }],
  );

  await service.assignCategory('note-1', 'category-1');

  assert.deepEqual(notes.get('note-1').categories, [
    'category-2',
    'category-1',
  ]);
});

test('requires an existing note and category before assigning', async () => {
  const { service } = createService([], [category]);

  await assert.rejects(
    service.assignCategory('missing', 'category-1'),
    NotFoundException,
  );
  await assert.rejects(
    service.assignCategory('note-1', 'missing'),
    NotFoundException,
  );
});

test('removes only the requested category association', async () => {
  const { service, notes } = createService(
    [{ ...activeNote, categories: ['category-1', 'category-2'] }],
    [category, { id: 'category-2', name: 'Personal', color: null }],
  );

  await service.removeCategory('note-1', 'category-1');

  assert.deepEqual(notes.get('note-1').categories, ['category-2']);
});
