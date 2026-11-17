import { httpClient } from './http';
import type { Category, CategoryInput } from '@/types/category';

export async function getCategories(): Promise<Category[]> {
  const response = await httpClient.get<Category[]>('/categories');

  return response.data;
}

export async function createCategory(
  category: CategoryInput,
): Promise<Category> {
  const response = await httpClient.post<Category>('/categories', category);

  return response.data;
}
