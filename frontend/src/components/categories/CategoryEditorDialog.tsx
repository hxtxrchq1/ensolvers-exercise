import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import type { CategoryInput } from '@/types/category';

const categorySchema = z.object({
  name: z.string().regex(/\S/, 'Escribe un nombre para la categoría.'),
  hasColor: z.boolean(),
  color: z.string(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryEditorDialogProps {
  isSaving: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSave: (values: CategoryInput) => Promise<void>;
}

export function CategoryEditorDialog({
  isSaving,
  errorMessage,
  onClose,
  onSave,
}: CategoryEditorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', hasColor: false, color: '#49684c' },
    mode: 'onSubmit',
  });
  const [hasColor, selectedColor] = useWatch({
    control,
    name: ['hasColor', 'color'],
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  const submit = handleSubmit(
    async ({ name, hasColor: includeColor, color }) => {
      await onSave({ name, ...(includeColor ? { color } : {}) });
    },
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="category-editor-title"
      className="fixed m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-lg overflow-y-auto rounded-3xl border border-[#e7e5dc] bg-[#fbfbf8] p-0 text-[#303a31] shadow-[0_24px_90px_rgba(27,38,28,0.24)] backdrop:bg-[#172018]/45 backdrop:backdrop-blur-[2px] sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)]"
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
              Tu biblioteca
            </p>
            <h2
              className="text-2xl font-semibold tracking-[-0.04em] text-[#29372d]"
              id="category-editor-title"
            >
              Nueva categoría
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#797f75]">
              Organiza tus notas con una etiqueta propia.
            </p>
          </div>
          <button
            aria-label="Cerrar formulario de categoría"
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
              htmlFor="category-name"
            >
              Nombre
            </label>
            <input
              {...register('name')}
              aria-describedby={errors.name ? 'category-name-error' : undefined}
              aria-invalid={Boolean(errors.name)}
              autoComplete="off"
              autoFocus
              className="w-full rounded-xl border border-[#dedfd6] bg-white px-4 py-3 text-sm text-[#303a31] transition outline-none placeholder:text-[#a4a79d] focus:border-[#849276] focus:ring-3 focus:ring-[#849276]/15 aria-invalid:border-[#b96a58] aria-invalid:focus:ring-[#b96a58]/15"
              id="category-name"
              placeholder="Por ejemplo: Trabajo"
            />
            {errors.name && (
              <p
                className="mt-2 text-xs font-medium text-[#a55343]"
                id="category-name-error"
                role="alert"
              >
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-[#e7e5dc] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#485248]">
                  Color de categoría
                </p>
                <p className="mt-1 text-xs leading-5 text-[#8a8e83]">
                  Opcional. Puedes crearla sin color.
                </p>
              </div>
              {hasColor && (
                <span
                  aria-label={`Vista previa del color ${selectedColor}`}
                  className="size-9 shrink-0 rounded-full border border-black/10 shadow-inner"
                  style={{ backgroundColor: selectedColor }}
                />
              )}
            </div>

            <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-[#53604f]">
              <input
                {...register('hasColor')}
                className="size-4 accent-[#53644b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#788368]"
                type="checkbox"
              />
              Usar un color para esta categoría
            </label>

            {hasColor ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-[#f7f8f3] p-3">
                <label
                  aria-label="Abrir selector de color"
                  className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#dfe2d7] bg-white p-1 shadow-sm transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#788368] hover:border-[#9ca98c]"
                  htmlFor="category-color"
                >
                  <input
                    {...register('color')}
                    aria-label="Color de categoría"
                    className="size-full cursor-pointer rounded-lg border-0 bg-transparent p-0"
                    id="category-color"
                    type="color"
                  />
                </label>
                <div aria-live="polite">
                  <p className="text-xs font-medium text-[#60675d]">
                    Elige el color en la paleta
                  </p>
                  <output
                    className="mt-1 block font-mono text-sm font-semibold tracking-wide text-[#344735]"
                    htmlFor="category-color"
                  >
                    {selectedColor.toUpperCase()}
                  </output>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-[#8a8e83]">
                Esta categoría no tendrá color.
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
            {isSaving ? 'Guardando…' : 'Crear categoría'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
