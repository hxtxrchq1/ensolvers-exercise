const assert = require('node:assert/strict');
const test = require('node:test');
const { ConflictException } = require('@nestjs/common');
const {
  CategoriesService,
} = require('../../dist/categories/categories.service');
const {
  CategoryNameConflictError,
} = require('../../dist/categories/repositories/categories.repository');

const category = {
  id: 'category-1',
  name: 'Work',
  color: '#49684c',
};

test('creates a category through the repository', async () => {
  let received;
  const repository = {
    create: async (data) => {
      received = data;
      return category;
    },
    findMany: async () => [],
  };
  const service = new CategoriesService(repository);

  assert.equal((await service.create({ name: 'Work' })).id, 'category-1');
  assert.deepEqual(received, { name: 'Work' });
});

test('maps duplicate category names to conflict', async () => {
  const repository = {
    create: async () => {
      throw new CategoryNameConflictError();
    },
    findMany: async () => [],
  };
  const service = new CategoriesService(repository);

  await assert.rejects(service.create({ name: 'Work' }), ConflictException);
});

test('lists categories through the repository', async () => {
  const repository = {
    create: async () => category,
    findMany: async () => [category],
  };
  const service = new CategoriesService(repository);

  assert.deepEqual(await service.list(), [category]);
});
