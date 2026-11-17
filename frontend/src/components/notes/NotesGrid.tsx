import { NoteCard } from '@/components/notes/NoteCard';
import type { Note, NoteAction } from '@/types/note';
import type { Category } from '@/types/category';

interface NotesGridProps {
  notes: Note[];
  showCategories: boolean;
  categoriesReady: boolean;
  categoriesLoadError: boolean;
  categoriesForNote: (note: Note) => Category[];
  allCategories: Category[];
  actionsDisabled: boolean;
  categoryActionPending: boolean;
  pendingCategoryAction: {
    noteId: string;
    categoryId: string;
    action: 'assign' | 'remove';
  } | null;
  pendingActionFor: (note: Note) => NoteAction | null;
  onEdit: (note: Note) => void;
  onArchive: (note: Note) => void;
  onUnarchive: (note: Note) => void;
  onDelete: (note: Note) => void;
  onAssignCategory: (noteId: string, categoryId: string) => void;
  onRemoveCategory: (noteId: string, categoryId: string) => void;
}

export function NotesGrid({
  notes,
  showCategories,
  categoriesReady,
  categoriesLoadError,
  categoriesForNote,
  allCategories,
  actionsDisabled,
  categoryActionPending,
  pendingCategoryAction,
  pendingActionFor,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
  onAssignCategory,
  onRemoveCategory,
}: NotesGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          allCategories={allCategories}
          actionsDisabled={actionsDisabled}
          categoriesLoadError={categoriesLoadError}
          categories={categoriesForNote(note)}
          categoriesReady={categoriesReady}
          categoryActionPending={categoryActionPending}
          note={note}
          showCategories={showCategories}
          onAssignCategory={onAssignCategory}
          onArchive={onArchive}
          onDelete={onDelete}
          onEdit={onEdit}
          onRemoveCategory={onRemoveCategory}
          onUnarchive={onUnarchive}
          pendingCategoryAction={
            pendingCategoryAction?.noteId === note.id
              ? pendingCategoryAction
              : null
          }
          pendingAction={pendingActionFor(note)}
        />
      ))}
    </div>
  );
}
