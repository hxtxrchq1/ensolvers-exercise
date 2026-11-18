import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorMessage } from '@/services/httpError';

const loginSchema = z.object({
  username: z.string().min(1, 'Escribe tu usuario.').max(100),
  password: z.string().min(1, 'Escribe tu contraseña.').max(128),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginLocationState {
  from?: string;
}

export function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const location = useLocation();
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
    mode: 'onSubmit',
  });

  if (isLoading) {
    return (
      <main
        className="app-shell flex min-h-screen items-center justify-center px-5 text-sm text-[#697168]"
        role="status"
      >
        Verificando la sesión…
      </main>
    );
  }

  if (user) {
    const state = location.state as LoginLocationState | null;
    return <Navigate replace to={state?.from || '/'} />;
  }

  const submit = handleSubmit(async (credentials) => {
    setRequestError(null);

    try {
      await login(credentials);
    } catch (error: unknown) {
      setRequestError(getApiErrorMessage(error));
    }
  });

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-[1.75rem] border border-white/90 bg-white/80 p-6 shadow-[0_24px_70px_rgba(39,45,58,0.11)] backdrop-blur-sm sm:p-9">
        <div className="mb-8">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#f5c96d] text-[#25262b] shadow-[0_4px_18px_rgba(245,201,109,0.2)]">
              <svg
                aria-hidden="true"
                className="size-5"
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
            <div>
              <p className="text-base font-bold tracking-[-0.03em] text-[#20232a]">
                NoteApp
              </p>
              <p className="mt-0.5 text-[10px] font-medium tracking-[0.14em] text-[#858a96] uppercase">
                tus ideas, a mano
              </p>
            </div>
          </div>
          <p className="mb-2 text-[10px] font-bold tracking-[0.17em] text-[#727b8c] uppercase">
            Espacio personal
          </p>
          <h1 className="text-3xl font-bold tracking-[-0.045em] text-[#20232a]">
            Iniciar sesión
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#707581]">
            Ingresa tus credenciales para acceder a tus notas.
          </p>
        </div>

        <form className="space-y-5" onSubmit={submit}>
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-[#444a54]"
              htmlFor="login-username"
            >
              Usuario
            </label>
            <input
              {...register('username')}
              aria-describedby={
                errors.username ? 'login-username-error' : undefined
              }
              aria-invalid={Boolean(errors.username)}
              autoComplete="username"
              autoFocus
              className="w-full rounded-xl border border-[#dfe2e9] bg-white px-4 py-3 text-sm text-[#30343a] transition outline-none focus:border-[#818b9d] focus:ring-3 focus:ring-[#818b9d]/15 aria-invalid:border-[#b96a58]"
              id="login-username"
            />
            {errors.username && (
              <p
                className="mt-2 text-xs font-medium text-[#a55343]"
                id="login-username-error"
                role="alert"
              >
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-semibold text-[#444a54]"
              htmlFor="login-password"
            >
              Contraseña
            </label>
            <input
              {...register('password')}
              aria-describedby={
                errors.password ? 'login-password-error' : undefined
              }
              aria-invalid={Boolean(errors.password)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-[#dfe2e9] bg-white px-4 py-3 text-sm text-[#30343a] transition outline-none focus:border-[#818b9d] focus:ring-3 focus:ring-[#818b9d]/15 aria-invalid:border-[#b96a58]"
              id="login-password"
              type="password"
            />
            {errors.password && (
              <p
                className="mt-2 text-xs font-medium text-[#a55343]"
                id="login-password-error"
                role="alert"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {requestError && (
            <p
              className="rounded-xl border border-[#eadbd2] bg-[#fff7f2] px-4 py-3 text-sm leading-5 text-[#8e4d3e]"
              role="alert"
            >
              {requestError}
            </p>
          )}

          <button
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#22252c] px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(30,34,40,0.15)] transition hover:bg-[#393c45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#596e51] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting && (
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
              />
            )}
            {isSubmitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  );
}
