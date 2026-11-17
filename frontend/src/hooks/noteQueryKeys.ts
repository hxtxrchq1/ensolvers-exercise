import type { NoteList } from '@/types/note';

export const noteQueryKeys = {
  all: ['notes'] as const,
  list: (list: NoteList, categoryId?: string) =>
    [
      'notes',
      list,
      { categoryId: list === 'active' ? categoryId : undefined },
    ] as const,
  activeCategory: (categoryId: string) =>
    ['notes', 'active', { categoryId }] as const,
};
