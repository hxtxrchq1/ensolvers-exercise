import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Note, NoteInput } from '@/types/note';

const noteSchema = z.object({
  title: z
    .string()
    .min(1, 'Escribe un título.')
    .max(200, 'El título no puede superar los 200 caracteres.')
    .regex(/\S/, 'El título no puede contener solo espacios.'),
  content: z
    .string()
    .min(1, 'Escribe el contenido de la nota.')
    .regex(/\S/, 'El contenido no puede contener solo espacios.'),
});

type NoteFormValues = z.infer<typeof noteSchema>;

interface NoteEditorDialogProps {
  note?: Note;
  isSaving: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSave: (values: NoteInput) => Promise<void>;
}

export function NoteEditorDialog({
  note,
  isSaving,
  errorMessage,
  onClose,
  onSave,
}: NoteEditorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = 'note-editor-title';
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: note?.title ?? '',
      content: note?.content ?? '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      if (dialog?.open) {
        dialog.close();
      }
    };
  }, []);

  const submit = handleSubmit(async (values) => {
    await onSave(values);
  });

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-xl overflow-y-auto rounded-3xl border border-[#e7e5dc] bg-[#fbfbf8] p-0 text-[#303a31] shadow-[0_24px_90px_rgba(27,38,28,0.24)] backdrop:bg-[#172018]/45 backdrop:backdrop-blur-[2px] sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)]"
      onCancel={(event) => {
        event.preventDefault();
        if (!isSaving) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          if (!isSaving) onClose();
        }
      }}
    >
      <form className="p-5 sm:p-8" onSubmit={submit}>
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-semibold tracking-[0.17em] text-[#7e896d] uppercase">
              {note ? 'Tu biblioteca' : 'Nueva idea'}
            </p>
            <h2
              className="text-2xl font-semibold tracking-[-0.04em] text-[#29372d]"
              id={titleId}
            >
              {note ? 'Editar nota' : 'Crear una nota'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#797f75]">
              {note
                ? 'Ajusta el título o el contenido cuando quieras.'
                : 'Dale un lugar a esa idea antes de que se escape.'}
            </p>
          </div>
          <button
            aria-label="Cerrar formulario"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#858a80] transition hover:bg-[#eff0eb] hover:text-[#344735] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#788368] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.7"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label
              className="mb-2 block text-sm font-medium text-[#485248]"
              htmlFor="note-title"
            >
              Título
            </label>
            <input
              {...register('title')}
              aria-describedby={errors.title ? 'note-title-error' : undefined}
              aria-invalid={Boolean(errors.title)}
              autoComplete="off"
              autoFocus
              className="w-full rounded-xl border border-[#dedfd6] bg-white px-4 py-3 text-sm text-[#303a31] transition outline-none placeholder:text-[#a4a79d] focus:border-[#849276] focus:ring-3 focus:ring-[#849276]/15 aria-invalid:border-[#b96a58] aria-invalid:focus:ring-[#b96a58]/15"
              id="note-title"
              maxLength={200}
              placeholder="Por ejemplo: Ideas para el fin de semana"
            />
            {errors.title && (
              <p
                className="mt-2 text-xs font-medium text-[#a55343]"
                id="note-title-error"
                role="alert"
              >
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-[#485248]"
              htmlFor="note-content"
            >
              Contenido
            </label>
            <textarea
              {...register('content')}
              aria-describedby={
                errors.content ? 'note-content-error' : undefined
              }
              aria-invalid={Boolean(errors.content)}
              className="min-h-40 w-full resize-y rounded-xl border border-[#dedfd6] bg-white px-4 py-3 text-sm leading-6 text-[#303a31] transition outline-none placeholder:text-[#a4a79d] focus:border-[#849276] focus:ring-3 focus:ring-[#849276]/15 aria-invalid:border-[#b96a58] aria-invalid:focus:ring-[#b96a58]/15 sm:min-h-48"
              id="note-content"
              placeholder="Anota lo que quieras recordar..."
              rows={7}
            />
            {errors.content && (
              <p
                className="mt-2 text-xs font-medium text-[#a55343]"
                id="note-content-error"
                role="alert"
              >
                {errors.content.message}
              </p>
            )}
          </div>
        </div>

        {errorMessage && (
          <p
            className="mt-5 rounded-xl border border-[#eadbd2] bg-[#fff7f2] px-4 py-3 text-sm leading-5 text-[#8e4d3e]"
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#ecece4] pt-5 sm:flex-row sm:justify-end">
          <button
            className="rounded-xl border border-[#dedfd6] bg-white px-5 py-3 text-sm font-medium text-[#60675d] transition hover:bg-[#f4f4ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#788368] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-28"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#344735] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#293a2b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#596e51] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-36"
            disabled={isSaving}
            type="submit"
          >
            {isSaving && (
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
              />
            )}
            {isSaving
              ? 'Guardando…'
              : note
                ? 'Guardar cambios'
                : 'Guardar nota'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
