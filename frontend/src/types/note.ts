import type { Category } from './category';

export interface Note {
  id: string;
  title: string;
  content: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
}

export interface NoteInput {
  title: string;
  content: string;
}

export type NoteAction = 'archive' | 'unarchive' | 'delete';

export type NoteList = 'active' | 'archived';
