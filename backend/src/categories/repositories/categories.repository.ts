import { Category } from '@prisma/client';

export class CategoryNameConflictError extends Error {
  constructor() {
    super('A category with this name already exists.');
    this.name = 'CategoryNameConflictError';
  }
}

export interface CreateCategoryData {
  name: string;
  color?: string | null;
}

export interface UpdateCategoryData {
  name?: string;
  color?: string | null;
}

export abstract class CategoriesRepository {
  abstract create(data: CreateCategoryData): Promise<Category>;

  abstract findById(id: string): Promise<Category | null>;

  abstract findMany(): Promise<Category[]>;

  abstract update(id: string, data: UpdateCategoryData): Promise<Category>;

  abstract delete(id: string): Promise<Category>;
}
