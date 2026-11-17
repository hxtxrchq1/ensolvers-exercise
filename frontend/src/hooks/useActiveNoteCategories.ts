import { useQueries } from '@tanstack/react-query';
import type { Category } from '@/types/category';
import { getNotes } from '@/services/notesApi';
import { noteQueryKeys } from '@/hooks/noteQueryKeys';

export function useActiveNoteCategories(
  categories: Category[],
  enabled: boolean,
) {
  const categoryQueries = useQueries({
    queries: categories.map((category) => ({
      queryKey: noteQueryKeys.activeCategory(category.id),
      queryFn: () => getNotes('active', category.id),
      enabled,
    })),
  });

  const categoryIdsByNoteId = new Map<string, Set<string>>();

  categoryQueries.forEach((query, index) => {
    const category = categories[index];

    if (!category || !query.data) return;

    query.data.forEach((note) => {
      const noteCategories = categoryIdsByNoteId.get(note.id) ?? new Set();
      noteCategories.add(category.id);
      categoryIdsByNoteId.set(note.id, noteCategories);
    });
  });

  return {
    categoryIdsByNoteId,
    isLoading: categoryQueries.some((query) => query.isPending),
    hasError: categoryQueries.some((query) => query.isError),
    retry: () => Promise.all(categoryQueries.map((query) => query.refetch())),
  };
}
