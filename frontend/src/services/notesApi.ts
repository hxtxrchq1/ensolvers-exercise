import { httpClient } from './http';
import type { Note, NoteInput, NoteList } from '@/types/note';
export { getApiErrorMessage } from './httpError';

export async function getNotes(
  list: NoteList,
  categoryId?: string,
): Promise<Note[]> {
  const path = list === 'archived' ? '/notes/archived' : '/notes';
  const response = await httpClient.get<Note[]>(path, {
    params: list === 'active' && categoryId ? { categoryId } : undefined,
  });

  return response.data;
}

export async function createNote(note: NoteInput): Promise<Note> {
  const response = await httpClient.post<Note>('/notes', note);

  return response.data;
}

export async function updateNote(id: string, note: NoteInput): Promise<Note> {
  const response = await httpClient.patch<Note>(`/notes/${id}`, note);

  return response.data;
}

export async function archiveNote(id: string): Promise<Note> {
  const response = await httpClient.patch<Note>(`/notes/${id}/archive`);

  return response.data;
}

export async function unarchiveNote(id: string): Promise<Note> {
  const response = await httpClient.patch<Note>(`/notes/${id}/unarchive`);

  return response.data;
}

export async function deleteNote(id: string): Promise<void> {
  await httpClient.delete(`/notes/${id}`);
}

export async function assignCategoryToNote(
  noteId: string,
  categoryId: string,
): Promise<void> {
  await httpClient.post(`/notes/${noteId}/categories/${categoryId}`);
}

export async function removeCategoryFromNote(
  noteId: string,
  categoryId: string,
): Promise<void> {
  await httpClient.delete(`/notes/${noteId}/categories/${categoryId}`);
}
