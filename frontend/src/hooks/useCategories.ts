import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/services/categoriesApi';

export const categoriesQueryKey = ['categories'] as const;

export function useCategories(enabled = true) {
  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: getCategories,
    enabled,
  });
}
