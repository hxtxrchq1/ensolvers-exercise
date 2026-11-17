import { Note } from '@prisma/client';

export class RelatedNoteOrCategoryNotFoundError extends Error {
  constructor() {
    super('The related note or category does not exist.');
    this.name = 'RelatedNoteOrCategoryNotFoundError';
  }
}

export interface CreateNoteData {
  title: string;
  content: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
}

export interface ArchiveStateUpdate {
  updated: boolean;
  note: Note | null;
}

export abstract class NotesRepository {
  abstract create(data: CreateNoteData): Promise<Note>;

  abstract findById(id: string): Promise<Note | null>;

  abstract findMany(isArchived: boolean, categoryId?: string): Promise<Note[]>;

  abstract assignCategory(noteId: string, categoryId: string): Promise<void>;

  abstract removeCategory(noteId: string, categoryId: string): Promise<boolean>;

  abstract update(id: string, data: UpdateNoteData): Promise<Note | null>;

  abstract updateArchiveState(
    id: string,
    currentState: boolean,
    nextState: boolean,
  ): Promise<ArchiveStateUpdate>;

  abstract delete(id: string): Promise<boolean>;
}
