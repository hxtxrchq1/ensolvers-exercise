import { useEffect, useRef, useState } from 'react';
import { CategoryEditorDialog } from '@/components/categories/CategoryEditorDialog';
import { NoteEditorDialog } from '@/components/notes/NoteEditorDialog';
import { DeleteNoteDialog } from '@/components/notes/DeleteNoteDialog';
import { FeedbackToast } from '@/components/common/FeedbackToast';
import { NotesQueryState } from '@/components/common/NotesQueryState';
import { NotesGrid } from '@/components/notes/NotesGrid';
import {
  useArchiveNote,
  useCreateNote,
  useDeleteNote,
  useUnarchiveNote,
  useUpdateNote,
} from '@/hooks/useNoteMutations';
import { useActiveNoteCategories } from '@/hooks/useActiveNoteCategories';
import { useCategories } from '@/hooks/useCategories';
import {
  useAssignCategory,
  useCreateCategory,
  useRemoveCategory,
} from '@/hooks/useCategoryMutations';
import { useNotes } from '@/hooks/useNotes';
import { getApiErrorMessage } from '@/services/notesApi';
import type { CategoryInput } from '@/types/category';
import type { Note, NoteAction, NoteInput, NoteList } from '@/types/note';

interface NotesPageProps {
  list: NoteList;
}

const pageContent: Record<
  NoteList,
  { eyebrow: string; title: string; description: string }
> = {
  active: {
    eyebrow: 'Tu biblioteca',
    title: 'Notas activas',
    description: 'Tus ideas y apuntes, reunidos en un solo lugar.',
  },
  archived: {
    eyebrow: 'Tu biblioteca',
    title: 'Notas archivadas',
    description: 'Un espacio tranquilo para las notas que quieres conservar.',
  },
};

export function NotesPage({ list }: NotesPageProps) {
  const archived = list === 'archived';
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const activeCategoryId =
    list === 'active' ? selectedCategoryId || undefined : undefined;
  const { data, isError, isPending, refetch } = useNotes(
    list,
    activeCategoryId,
  );
  const categoriesQuery = useCategories(!archived);
  const categories = categoriesQuery.data ?? [];
  const {
    categoryIdsByNoteId,
    isLoading: noteCategoriesLoading,
    hasError: noteCategoriesError,
    retry: retryNoteCategories,
  } = useActiveNoteCategories(categories, !archived);
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();
  const archiveMutation = useArchiveNote();
  const unarchiveMutation = useUnarchiveNote();
  const deleteMutation = useDeleteNote();
  const createCategoryMutation = useCreateCategory();
  const assignCategoryMutation = useAssignCategory();
  const removeCategoryMutation = useRemoveCategory();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryFormError, setCategoryFormError] = useState<string | null>(
    null,
  );
  const [feedback, setFeedback] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const categoryActionLock = useRef(false);
  const categoryCreateLock = useRef(false);
  const content = pageContent[list];
  const editorOpen = isCreating || editingNote !== null;
  const activeMutation = isCreating ? createMutation : updateMutation;
  const actionsPending =
    archiveMutation.isPending ||
    unarchiveMutation.isPending ||
    deleteMutation.isPending;

  useEffect(() => {
    if (!feedback) return;

    const timeout = window.setTimeout(() => setFeedback(null), 3600);

    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    setSelectedCategoryId('');
  }, [list]);

  const openCreate = () => {
    createMutation.reset();
    setFormError(null);
    setEditingNote(null);
    setIsCreating(true);
  };

  const openEdit = (note: Note) => {
    updateMutation.reset();
    setFormError(null);
    setIsCreating(false);
    setEditingNote(note);
  };

  const closeEditor = () => {
    if (activeMutation.isPending) return;

    setIsCreating(false);
    setEditingNote(null);
    setFormError(null);
  };

  const saveNote = async (values: NoteInput) => {
    try {
      if (isCreating) {
        await createMutation.mutateAsync(values);
        setFeedback({ type: 'success', message: 'Nota creada correctamente.' });
      } else if (editingNote) {
        await updateMutation.mutateAsync({
          id: editingNote.id,
          note: values,
        });
        setFeedback({
          type: 'success',
          message: 'Cambios guardados correctamente.',
        });
      }

      setIsCreating(false);
      setEditingNote(null);
      setFormError(null);
    } catch (error: unknown) {
      setFormError(getApiErrorMessage(error));
    }
  };

  const openCategoryCreate = () => {
    createCategoryMutation.reset();
    setCategoryFormError(null);
    setIsCreatingCategory(true);
  };

  const closeCategoryCreate = () => {
    if (createCategoryMutation.isPending) return;

    setIsCreatingCategory(false);
    setCategoryFormError(null);
  };

  const saveCategory = async (values: CategoryInput) => {
    if (categoryCreateLock.current) return;

    categoryCreateLock.current = true;
    try {
      await createCategoryMutation.mutateAsync(values);
      setIsCreatingCategory(false);
      setCategoryFormError(null);
      setFeedback({
        type: 'success',
        message: 'Categoría creada correctamente.',
      });
    } catch (error: unknown) {
      setCategoryFormError(getApiErrorMessage(error));
    } finally {
      categoryCreateLock.current = false;
    }
  };

  const handleAssignCategory = async (noteId: string, categoryId: string) => {
    if (categoryActionLock.current) return;

    categoryActionLock.current = true;
    try {
      await assignCategoryMutation.mutateAsync({ noteId, categoryId });
      setFeedback({
        type: 'success',
        message: 'Categoría asignada a la nota.',
      });
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: getApiErrorMessage(error) });
    } finally {
      categoryActionLock.current = false;
    }
  };

  const handleRemoveCategory = async (noteId: string, categoryId: string) => {
    if (categoryActionLock.current) return;

    categoryActionLock.current = true;
    try {
      await removeCategoryMutation.mutateAsync({ noteId, categoryId });
      setFeedback({
        type: 'success',
        message: 'Categoría quitada de la nota.',
      });
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: getApiErrorMessage(error) });
    } finally {
      categoryActionLock.current = false;
    }
  };

  const handleCardAction = async (
    action: 'archive' | 'unarchive',
    note: Note,
  ) => {
    try {
      if (action === 'archive') {
        await archiveMutation.mutateAsync(note.id);
        setFeedback({
          type: 'success',
          message: 'Nota archivada correctamente.',
        });
      } else {
        await unarchiveMutation.mutateAsync(note.id);
        setFeedback({
          type: 'success',
          message: 'Nota desarchivada correctamente.',
        });
      }
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: getApiErrorMessage(error) });
    }
  };

  const openDeleteConfirmation = (note: Note) => {
    deleteMutation.reset();
    setDeleteError(null);
    setNoteToDelete(note);
  };

  const cancelDelete = () => {
    if (deleteMutation.isPending) return;

    setNoteToDelete(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!noteToDelete || deleteMutation.isPending) return;

    try {
      await deleteMutation.mutateAsync(noteToDelete.id);
      setNoteToDelete(null);
      setDeleteError(null);
      setFeedback({
        type: 'success',
        message: 'Nota eliminada permanentemente.',
      });
    } catch (error: unknown) {
      setDeleteError(getApiErrorMessage(error));
    }
  };

  const pendingActionFor = (note: Note): NoteAction | null => {
    if (archiveMutation.isPending && archiveMutation.variables === note.id) {
      return 'archive';
    }
    if (
      unarchiveMutation.isPending &&
      unarchiveMutation.variables === note.id
    ) {
      return 'unarchive';
    }
    if (deleteMutation.isPending && deleteMutation.variables === note.id) {
      return 'delete';
    }

    return null;
  };
  const categoryMutationPending =
    assignCategoryMutation.isPending || removeCategoryMutation.isPending;
  const categoriesReady =
    categoriesQuery.isSuccess && !noteCategoriesLoading && !noteCategoriesError;
  const pendingCategoryAction = assignCategoryMutation.isPending
    ? { ...assignCategoryMutation.variables, action: 'assign' as const }
    : removeCategoryMutation.isPending
      ? { ...removeCategoryMutation.variables, action: 'remove' as const }
      : null;

  return (
    <section>
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5 sm:mb-11">
        <div>
          <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-[#7e896d] uppercase">
            {content.eyebrow}
          </p>
          <h1 className="text-3xl leading-tight font-semibold tracking-[-0.045em] text-[#29372d] sm:text-[2.5rem]">
            {content.title}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#797f75] sm:text-[15px]">
            {content.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {data && !isError && (
            <span className="rounded-full border border-[#e4e6dc] bg-white px-3.5 py-2 text-xs font-medium text-[#737b6d]">
              {data.length} {data.length === 1 ? 'nota' : 'notas'}
            </span>
          )}
          {!archived && (
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#344735] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#293a2b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#596e51]"
              onClick={openCreate}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 5v14m-7-7h14"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
              </svg>
              Nueva nota
            </button>
          )}
        </div>
      </div>

      {!archived && (
        <section
          aria-label="Categorías y filtro"
          className="mb-7 rounded-2xl border border-[#e7e5dc] bg-white p-4 shadow-[0_3px_14px_rgba(38,48,35,0.025)] sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#344035]">
                Categorías
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#7b8176]">
                Organiza y filtra tus notas activas.
              </p>
            </div>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#dce2d5] bg-[#f7f8f3] px-3.5 py-2 text-xs font-semibold text-[#53644b] transition hover:bg-[#edf0e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#788368] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={openCategoryCreate}
              type="button"
            >
              Nueva categoría
            </button>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-medium text-[#60675d]">
              Filtrar notas activas
            </span>
            <select
              aria-label="Filtrar notas activas por categoría"
              className="min-h-11 w-full rounded-xl border border-[#dedfd6] bg-[#fbfbf8] px-3.5 py-2.5 text-sm text-[#465047] transition outline-none focus:border-[#849276] focus:ring-3 focus:ring-[#849276]/15 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={categoriesQuery.isPending || categoriesQuery.isError}
              onChange={(event) =>
                setSelectedCategoryId(event.currentTarget.value)
              }
              value={selectedCategoryId}
            >
              <option value="">Todas las notas activas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          {categoriesQuery.isPending && (
            <p className="mt-3 text-xs text-[#7b8176]" role="status">
              Cargando categorías…
            </p>
          )}
          {categoriesQuery.isError && (
            <div
              className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#8e4d3e]"
              role="alert"
            >
              <span>No se pudieron cargar las categorías.</span>
              <button
                className="rounded-lg px-2 py-1 font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a55343]"
                onClick={() => void categoriesQuery.refetch()}
                type="button"
              >
                Reintentar
              </button>
            </div>
          )}
          {categoriesQuery.isSuccess && categories.length === 0 && (
            <p className="mt-3 text-xs leading-5 text-[#7b8176]">
              Aún no hay categorías. Crea una para poder asignarla a tus notas.
            </p>
          )}
          {noteCategoriesError && (
            <div
              className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#8e4d3e]"
              role="alert"
            >
              <span>No se pudieron cargar las categorías de las notas.</span>
              <button
                className="rounded-lg px-2 py-1 font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a55343]"
                onClick={() => void retryNoteCategories()}
                type="button"
              >
                Reintentar
              </button>
            </div>
          )}
        </section>
      )}

      <div className="mb-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#e6e7df]" />
        <span className="text-[10px] font-semibold tracking-[0.16em] text-[#a1a397] uppercase">
          {archived ? 'Archivo' : 'Recientes'}
        </span>
        <span className="h-px flex-1 bg-[#e6e7df]" />
      </div>

      {isPending ? (
        <NotesQueryState archived={archived} type="loading" />
      ) : isError ? (
        <NotesQueryState
          archived={archived}
          onRetry={() => void refetch()}
          type="error"
        />
      ) : data.length === 0 && activeCategoryId ? (
        <div className="rounded-2xl border border-dashed border-[#d9dbd1] bg-[#fafaf7] px-6 py-12 text-center sm:px-10">
          <h2 className="text-base font-semibold text-[#344035]">
            No hay notas en esta categoría
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7b8176]">
            Prueba otra categoría o vuelve a mostrar todas tus notas activas.
          </p>
          <button
            className="mt-5 rounded-xl border border-[#dce2d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#53644b] transition hover:bg-[#f0f2eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#788368]"
            onClick={() => setSelectedCategoryId('')}
            type="button"
          >
            Mostrar todas las notas
          </button>
        </div>
      ) : data.length === 0 ? (
        <NotesQueryState archived={archived} type="empty" />
      ) : (
        <NotesGrid
          actionsDisabled={actionsPending}
          allCategories={categories}
          categoriesLoadError={categoriesQuery.isError || noteCategoriesError}
          categoriesReady={categoriesReady}
          categoriesForNote={(note) =>
            note.isArchived
              ? note.categories
              : categories.filter((category) =>
                  categoryIdsByNoteId.get(note.id)?.has(category.id),
                )
          }
          categoryActionPending={categoryMutationPending}
          notes={data}
          onAssignCategory={(noteId, categoryId) =>
            void handleAssignCategory(noteId, categoryId)
          }
          onArchive={(note) => void handleCardAction('archive', note)}
          onDelete={openDeleteConfirmation}
          onEdit={openEdit}
          onRemoveCategory={(noteId, categoryId) =>
            void handleRemoveCategory(noteId, categoryId)
          }
          onUnarchive={(note) => void handleCardAction('unarchive', note)}
          pendingCategoryAction={pendingCategoryAction}
          pendingActionFor={pendingActionFor}
          showCategories
        />
      )}
      {isCreatingCategory && (
        <CategoryEditorDialog
          errorMessage={categoryFormError}
          isSaving={createCategoryMutation.isPending}
          onClose={closeCategoryCreate}
          onSave={saveCategory}
        />
      )}
      {editorOpen && (
        <NoteEditorDialog
          key={isCreating ? 'create' : editingNote?.id}
          errorMessage={formError}
          isSaving={activeMutation.isPending}
          note={editingNote ?? undefined}
          onClose={closeEditor}
          onSave={saveNote}
        />
      )}
      {noteToDelete && (
        <DeleteNoteDialog
          errorMessage={deleteError}
          isDeleting={deleteMutation.isPending}
          note={noteToDelete}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}
      {feedback && (
        <FeedbackToast message={feedback.message} type={feedback.type} />
      )}
    </section>
  );
}
