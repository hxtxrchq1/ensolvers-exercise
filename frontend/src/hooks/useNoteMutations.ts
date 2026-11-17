import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  archiveNote,
  createNote,
  deleteNote,
  unarchiveNote,
  updateNote,
} from '@/services/notesApi';
import type { NoteInput } from '@/types/note';
import { noteQueryKeys } from '@/hooks/noteQueryKeys';

function useInvalidateNotes() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: noteQueryKeys.all });
}

export function useCreateNote() {
  const invalidateNotes = useInvalidateNotes();

  return useMutation({
    mutationFn: (note: NoteInput) => createNote(note),
    onSuccess: invalidateNotes,
  });
}

export function useUpdateNote() {
  const invalidateNotes = useInvalidateNotes();

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: NoteInput }) =>
      updateNote(id, note),
    onSuccess: invalidateNotes,
  });
}

export function useArchiveNote() {
  const invalidateNotes = useInvalidateNotes();

  return useMutation({
    mutationFn: (id: string) => archiveNote(id),
    onSuccess: invalidateNotes,
  });
}

export function useUnarchiveNote() {
  const invalidateNotes = useInvalidateNotes();

  return useMutation({
    mutationFn: (id: string) => unarchiveNote(id),
    onSuccess: invalidateNotes,
  });
}

export function useDeleteNote() {
  const invalidateNotes = useInvalidateNotes();

  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: invalidateNotes,
  });
}
