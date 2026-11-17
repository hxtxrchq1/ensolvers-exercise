import { useQuery } from '@tanstack/react-query';
import { getNotes } from '@/services/notesApi';
import { noteQueryKeys } from '@/hooks/noteQueryKeys';
import type { NoteList } from '@/types/note';

export function useNotes(list: NoteList, categoryId?: string) {
  return useQuery({
    queryKey: noteQueryKeys.list(list, categoryId),
    queryFn: () => getNotes(list, categoryId),
  });
}
