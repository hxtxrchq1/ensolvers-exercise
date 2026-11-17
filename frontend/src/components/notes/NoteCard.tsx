import type { CSSProperties } from 'react';
import type { Note, NoteAction } from '@/types/note';
import type { Category } from '@/types/category';

const dateFormatter = new Intl.DateTimeFormat('es-UY', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

interface NoteCardProps {
  note: Note;
  showCategories: boolean;
  categoriesReady: boolean;
  categoriesLoadError: boolean;
  categories: Category[];
  allCategories: Category[];
  actionsDisabled: boolean;
  categoryActionPending: boolean;
  pendingCategoryAction: {
    categoryId: string;
    action: 'assign' | 'remove';
  } | null;
  pendingAction: NoteAction | null;
  onEdit: (note: Note) => void;
  onArchive: (note: Note) => void;
  onUnarchive: (note: Note) => void;
  onDelete: (note: Note) => void;
  onAssignCategory: (noteId: string, categoryId: string) => void;
  onRemoveCategory: (noteId: string, categoryId: string) => void;
}

export function NoteCard({
  note,
  showCategories,
  categoriesReady,
  categoriesLoadError,
  categories,
  allCategories,
  actionsDisabled,
  categoryActionPending,
  pendingCategoryAction,
  pendingAction,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
  onAssignCategory,
  onRemoveCategory,
}: NoteCardProps) {
  const availableCategories = allCategories.filter(
    (category) => !categories.some((assigned) => assigned.id === category.id),
  );
  const cardColor = categories.find((category) => category.color)?.color;
  const cardStyle = cardColor
    ? ({
        '--note-color': cardColor,
        '--note-wash': `color-mix(in srgb, ${cardColor} 24%, white)`,
        '--note-edge': `color-mix(in srgb, ${cardColor} 58%, white)`,
      } as CSSProperties)
    : undefined;

  return (
    <article
      className={`note-card group relative flex min-h-64 flex-col overflow-hidden rounded-[1.35rem] border p-5 shadow-[0_5px_18px_rgba(30,34,40,0.07)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(30,34,40,0.13)] sm:p-6 ${cardColor ? 'note-card-colored' : 'border-[#e5e3dc] bg-[#fffefa]'}`}
      style={cardStyle}
    >
      <div className="mb-5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/55 px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] text-[#30343a]/70 uppercase backdrop-blur-sm">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-current"
          />
          {note.isArchived ? 'Archivada' : 'Activa'}
        </span>
        <button
          aria-label={`Editar nota: ${note.title}`}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/55 px-3 text-xs font-semibold text-[#30343a]/75 transition hover:bg-white/85 hover:text-[#202329] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#53644b] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={actionsDisabled}
          onClick={() => onEdit(note)}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="m14.5 5.5 4 4M4 20l4.25-.85L19 7.4a2.12 2.12 0 0 0-3-3L5.25 15.15 4 20Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
          </svg>
          Editar
        </button>
      </div>

      <h2 className="mb-3 text-lg leading-snug font-bold tracking-[-0.035em] text-[#282b30]">
        {note.title}
      </h2>
      <p className="min-w-0 flex-1 text-sm leading-6 break-words whitespace-pre-wrap text-[#34373c]/85">
        {note.content}
      </p>

      {showCategories && (
        <div className="mt-5 border-t border-black/10 pt-4">
          <p className="mb-2 text-[10px] font-bold tracking-[0.12em] text-[#34373c]/55 uppercase">
            Categorías
          </p>
          <div
            aria-label={`Categorías de ${note.title}`}
            className="flex min-h-7 flex-wrap items-center gap-2"
          >
            {!categoriesReady ? (
              <span
                className="text-xs text-[#8a8e83]"
                role={categoriesLoadError ? 'alert' : 'status'}
              >
                {categoriesLoadError
                  ? 'No se pudieron cargar las categorías.'
                  : 'Cargando categorías…'}
              </span>
            ) : categories.length === 0 ? (
              <span className="text-xs text-[#8a8e83]">Sin categorías</span>
            ) : (
              categories.map((category) => {
                const isRemoving =
                  pendingCategoryAction?.action === 'remove' &&
                  pendingCategoryAction.categoryId === category.id;

                return (
                  <span
                    key={category.id}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/60 bg-white/55 py-1 pr-1 pl-2.5 text-xs font-semibold text-[#34373c]"
                  >
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full bg-[#87966e]"
                      style={
                        category.color
                          ? { backgroundColor: category.color }
                          : undefined
                      }
                    />
                    <span className="max-w-32 truncate">{category.name}</span>
                    <button
                      aria-label={`Quitar categoría ${category.name} de ${note.title}`}
                      className="flex size-6 shrink-0 items-center justify-center rounded-full text-[#4b5056] transition hover:bg-white/80 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#53644b] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={actionsDisabled || categoryActionPending}
                      onClick={() => onRemoveCategory(note.id, category.id)}
                      type="button"
                    >
                      {isRemoving ? (
                        <span
                          aria-hidden="true"
                          className="size-3 animate-spin rounded-full border-2 border-[#849276]/35 border-t-[#53644b]"
                        />
                      ) : (
                        <svg
                          aria-hidden="true"
                          className="size-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="m7 7 10 10M17 7 7 17"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeWidth="1.8"
                          />
                        </svg>
                      )}
                    </button>
                  </span>
                );
              })
            )}
          </div>
          {!note.isArchived &&
            categoriesReady &&
            allCategories.length > categories.length && (
              <label className="mt-3 block">
                <span className="sr-only">
                  Asignar categoría a {note.title}
                </span>
                <select
                  aria-label={`Asignar categoría a ${note.title}`}
                  className="min-h-9 w-full rounded-lg border border-white/70 bg-white/65 px-3 py-2 text-xs font-semibold text-[#41464c] transition outline-none focus:border-[#849276] focus:ring-3 focus:ring-[#849276]/15 disabled:cursor-not-allowed disabled:bg-[#f3f3ef] disabled:opacity-60"
                  disabled={
                    actionsDisabled ||
                    !categoriesReady ||
                    categoryActionPending ||
                    availableCategories.length === 0
                  }
                  onChange={(event) => {
                    const categoryId = event.currentTarget.value;
                    event.currentTarget.value = '';
                    if (categoryId) onAssignCategory(note.id, categoryId);
                  }}
                  value=""
                >
                  <option value="">
                    {pendingCategoryAction?.action === 'assign'
                      ? 'Asignando categoría…'
                      : 'Asignar categoría…'}
                  </option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-black/10 pt-4 text-xs text-[#34373c]/55">
        <span>
          Creada{' '}
          <time dateTime={note.createdAt}>{formatDate(note.createdAt)}</time>
        </span>
        {note.updatedAt !== note.createdAt && (
          <span>
            Editada{' '}
            <time dateTime={note.updatedAt}>{formatDate(note.updatedAt)}</time>
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-black/10 pt-3">
        {note.isArchived ? (
          <button
            className="inline-flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#f0f2eb] px-2 py-2 text-[11px] font-semibold text-[#53644b] transition hover:bg-[#e6eadf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#788368] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={actionsDisabled}
            onClick={() => onUnarchive(note)}
            type="button"
          >
            {pendingAction === 'unarchive' ? (
              <span
                aria-hidden="true"
                className="size-3.5 animate-spin rounded-full border-2 border-[#849276]/35 border-t-[#53644b]"
              />
            ) : (
              <svg
                aria-hidden="true"
                className="size-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 19V5m0 0L6.5 10.5M12 5l5.5 5.5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.6"
                />
              </svg>
            )}
            <span>Desarchivar</span>
          </button>
        ) : (
          <button
            className="inline-flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#f0f2eb] px-2 py-2 text-[11px] font-semibold text-[#53644b] transition hover:bg-[#e6eadf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#788368] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={actionsDisabled}
            onClick={() => onArchive(note)}
            type="button"
          >
            {pendingAction === 'archive' ? (
              <span
                aria-hidden="true"
                className="size-3.5 animate-spin rounded-full border-2 border-[#849276]/35 border-t-[#53644b]"
              />
            ) : (
              <svg
                aria-hidden="true"
                className="size-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 5.5h16v3H4v-3Zm1.5 3h13v9.75A1.75 1.75 0 0 1 16.75 20h-9.5a1.75 1.75 0 0 1-1.75-1.75V8.5Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
                <path
                  d="M9 12.5h6"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
              </svg>
            )}
            <span>Archivar</span>
          </button>
        )}
        <button
          className="inline-flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#eedfd8] px-2 py-2 text-[11px] font-semibold text-[#995d4c] transition hover:bg-[#fff5f0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b77966] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={actionsDisabled}
          onClick={() => onDelete(note)}
          type="button"
        >
          {pendingAction === 'delete' ? (
            <span
              aria-hidden="true"
              className="size-3.5 animate-spin rounded-full border-2 border-[#c59789]/35 border-t-[#995d4c]"
            />
          ) : (
            <svg
              aria-hidden="true"
              className="size-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M4.5 7h15m-13.5 0 .8 12.1A1.5 1.5 0 0 0 7.3 20.5h9.4a1.5 1.5 0 0 0 1.5-1.4L19 7m-9 0V4.5h4V7m-4 4v5m4-5v5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          )}
          <span>Eliminar</span>
        </button>
      </div>
    </article>
  );
}
