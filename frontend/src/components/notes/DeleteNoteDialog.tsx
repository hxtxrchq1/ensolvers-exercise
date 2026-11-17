import { useEffect, useRef } from 'react';
import type { Note } from '@/types/note';

interface DeleteNoteDialogProps {
  note: Note;
  isDeleting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteNoteDialog({
  note,
  isDeleting,
  errorMessage,
  onCancel,
  onConfirm,
}: DeleteNoteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      if (dialog?.open) {
        dialog.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="delete-note-title"
      aria-describedby="delete-note-description"
      className="fixed m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-md overflow-y-auto rounded-3xl border border-[#e7e5dc] bg-[#fbfbf8] p-0 text-[#303a31] shadow-[0_24px_90px_rgba(27,38,28,0.24)] backdrop:bg-[#172018]/45 backdrop:backdrop-blur-[2px] sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)]"
      onCancel={(event) => {
        event.preventDefault();
        if (!isDeleting) onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !isDeleting) onCancel();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          if (!isDeleting) onCancel();
        }
      }}
    >
      <div className="p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f7ebe5] text-[#a75f4b]">
            <svg
              aria-hidden="true"
              className="size-5"
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
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="mb-1.5 text-[10px] font-semibold tracking-[0.16em] text-[#a06452] uppercase">
              Eliminación permanente
            </p>
            <h2
              className="text-xl leading-snug font-semibold tracking-[-0.035em] text-[#29372d]"
              id="delete-note-title"
            >
              ¿Eliminar esta nota?
            </h2>
          </div>
        </div>

        <p
          className="mt-5 text-sm leading-6 break-words text-[#74796f]"
          id="delete-note-description"
        >
          <span className="font-semibold text-[#465047]">{note.title}</span> se
          eliminará de forma permanente. Esta acción no se puede deshacer.
        </p>

        {errorMessage && (
          <p
            className="mt-4 rounded-xl border border-[#eadbd2] bg-[#fff7f2] px-4 py-3 text-sm leading-5 text-[#8e4d3e]"
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#ecece4] pt-5 sm:flex-row sm:justify-end">
          <button
            className="rounded-xl border border-[#dedfd6] bg-white px-5 py-3 text-sm font-medium text-[#60675d] transition hover:bg-[#f4f4ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#788368] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-28"
            disabled={isDeleting}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a55343] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8e4739] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a55343] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-40"
            disabled={isDeleting}
            onClick={() => void onConfirm()}
            type="button"
          >
            {isDeleting && (
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
              />
            )}
            {isDeleting ? 'Eliminando…' : 'Eliminar definitivamente'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
