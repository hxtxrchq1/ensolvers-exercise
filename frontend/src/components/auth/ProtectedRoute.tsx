import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute() {
  const { user, isLoading, error, refresh } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-5 text-sm text-[#697168]"
        role="status"
      >
        Verificando la sesión…
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div
          className="w-full max-w-md rounded-2xl border border-[#eadbd2] bg-white p-6 text-center"
          role="alert"
        >
          <h1 className="font-semibold text-[#344035]">
            No se pudo verificar la sesión
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#797f75]">{error}</p>
          <button
            className="mt-5 rounded-xl bg-[#344735] px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#596e51]"
            onClick={() => void refresh()}
            type="button"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  return <Outlet />;
}
