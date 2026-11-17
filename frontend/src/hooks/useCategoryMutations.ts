import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory } from '@/services/categoriesApi';
import {
  assignCategoryToNote,
  removeCategoryFromNote,
} from '@/services/notesApi';
import { noteQueryKeys } from '@/hooks/noteQueryKeys';
import type { CategoryInput } from '@/types/category';

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: CategoryInput) => createCategory(category),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

interface NoteCategoryMutation {
  noteId: string;
  categoryId: string;
}

export function useAssignCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, categoryId }: NoteCategoryMutation) =>
      assignCategoryToNote(noteId, categoryId),
    onSuccess: (_data, { categoryId }) =>
      queryClient.invalidateQueries({
        queryKey: noteQueryKeys.activeCategory(categoryId),
      }),
  });
}

export function useRemoveCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, categoryId }: NoteCategoryMutation) =>
      removeCategoryFromNote(noteId, categoryId),
    onSuccess: (_data, { categoryId }) =>
      queryClient.invalidateQueries({
        queryKey: noteQueryKeys.activeCategory(categoryId),
      }),
  });
}
