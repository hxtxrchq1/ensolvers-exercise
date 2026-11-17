interface NotesQueryStateProps {
  archived: boolean;
  onRetry?: () => void;
  type: 'loading' | 'empty' | 'error';
}

export function NotesQueryState({
  archived,
  onRetry,
  type,
}: NotesQueryStateProps) {
  if (type === 'loading') {
    return (
      <div
        aria-label="Cargando notas"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        role="status"
      >
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="min-h-64 animate-pulse rounded-2xl border border-[#e7e5dc] bg-white p-7"
          >
            <div className="mb-7 h-6 w-24 rounded-full bg-[#eff0eb]" />
            <div className="mb-4 h-5 w-3/4 rounded bg-[#eff0eb]" />
            <div className="mb-2 h-3 w-full rounded bg-[#f3f3ef]" />
            <div className="mb-2 h-3 w-5/6 rounded bg-[#f3f3ef]" />
            <div className="mt-12 h-3 w-2/5 rounded bg-[#f3f3ef]" />
          </div>
        ))}
        <span className="sr-only">Cargando notas…</span>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div
        className="rounded-2xl border border-[#eadbd2] bg-[#fffaf7] px-6 py-10 text-center sm:px-10"
        role="alert"
      >
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#f5e9e1] text-[#9a6048]">
          <svg
            aria-hidden="true"
            className="size-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 8v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.73 3h14.94a2 2 0 0 0 1.73-3L13.7 3.9a2 2 0 0 0-3.46 0Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-[#403b37]">
          No pudimos cargar las notas
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#77716d]">
          Comprueba que la API esté disponible e inténtalo de nuevo.
        </p>
        <button
          className="mt-5 rounded-lg border border-[#d9c9bf] px-4 py-2 text-sm font-medium text-[#76503f] transition hover:bg-[#f8eee8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6048]"
          onClick={onRetry}
          type="button"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-[#d9dbd1] bg-[#fafaf7] px-6 py-14 text-center sm:px-10">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#eef0e9] text-[#728064]">
        <svg
          aria-hidden="true"
          className="size-7"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M7 3.75h7.5L19 8.25v11A1.75 1.75 0 0 1 17.25 21h-10A1.75 1.75 0 0 1 5.5 19.25v-13A2.5 2.5 0 0 1 8 3.75Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path
            d="M14 4v4.5h4.5M9 13h6m-6 3.5h4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-[#344035]">
        {archived ? 'Todavía no hay notas archivadas' : 'Tu espacio está listo'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7b8176]">
        {archived
          ? 'Las notas que archives aparecerán aquí.'
          : 'Cuando tengas notas, aparecerán aquí para que puedas volver a ellas.'}
      </p>
    </div>
  );
}
