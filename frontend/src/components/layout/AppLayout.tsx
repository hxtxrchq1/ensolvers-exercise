import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorMessage } from '@/services/httpError';

function LogoutControl({ mobile = false }: { mobile?: boolean }) {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setError(null);
    setIsLoggingOut(true);

    try {
      await logout();
    } catch (logoutError: unknown) {
      setError(getApiErrorMessage(logoutError));
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      className={
        mobile
          ? 'flex min-w-0 items-center gap-2'
          : 'mt-auto border-t border-[#e9e9e1] pt-5'
      }
    >
      <span className="max-w-40 truncate text-xs font-medium text-[#777c72]">
        {user?.username}
      </span>
      <button
        aria-label={`Cerrar sesión${user ? ` de ${user.username}` : ''}`}
        className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#dedfd6] bg-white px-2.5 py-2 text-xs font-semibold text-[#60675d] transition hover:bg-[#f4f4ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#788368] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isLoggingOut}
        onClick={() => void handleLogout()}
        type="button"
      >
        {isLoggingOut ? (
          <span
            aria-hidden="true"
            className="size-3.5 animate-spin rounded-full border-2 border-[#849276]/35 border-t-[#53644b]"
          />
        ) : (
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10m4-3 4-4-4-4m4 4H9"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
          </svg>
        )}
        <span>{isLoggingOut ? 'Saliendo…' : 'Salir'}</span>
      </button>
      {error && (
        <p className="text-xs text-[#8e4d3e]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function NotesNavigation({ mobile = false }: { mobile?: boolean }) {
  const linkClass = ({ isActive }: { isActive: boolean }) => {
    const appearance = isActive
      ? 'bg-[#e9ede3] text-[#344735]'
      : 'text-[#777c72] hover:bg-[#f0f1eb] hover:text-[#344735]';

    return mobile
      ? `group flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-1.5 py-2 text-xs font-medium transition-colors ${appearance}`
      : `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${appearance}`;
  };

  return (
    <nav
      aria-label="Vistas de notas"
      className={mobile ? 'flex gap-1' : 'space-y-1'}
    >
      <NavLink className={linkClass} end to="/">
        <svg
          aria-hidden="true"
          className="size-[18px] shrink-0"
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
            d="M14 4v4.5h4.5M9 13h6m-6 3.5h6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
        <span>Activas</span>
      </NavLink>
      <NavLink className={linkClass} to="/archived">
        <svg
          aria-hidden="true"
          className="size-[18px] shrink-0"
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
        <span>Archivadas</span>
      </NavLink>
    </nav>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-[#344735] text-[#f4f2e9] shadow-sm">
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
        <p className="text-[15px] leading-tight font-semibold tracking-[-0.03em] text-[#2d3b30]">
          notas
        </p>
        <p className="mt-1 hidden text-[10px] leading-tight font-medium tracking-[0.17em] text-[#92968b] uppercase sm:block">
          espacio personal
        </p>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f7f7f3] text-[#303a31]">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-[#e9e9e1] bg-[#fbfbf8] px-6 py-8 lg:flex">
        <BrandMark />
        <div className="mt-14">
          <p className="mb-3 px-3.5 text-[10px] font-semibold tracking-[0.17em] text-[#a0a297] uppercase">
            Biblioteca
          </p>
          <NotesNavigation />
        </div>       
        <LogoutControl />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-[#e9e9e1] bg-[#fbfbf8]/95 px-4 py-3 backdrop-blur-md sm:px-5 lg:hidden">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between gap-3">
              <BrandMark />
              <LogoutControl mobile />
            </div>
            <div className="mt-3">
              <NotesNavigation mobile />
            </div>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-64px)] max-w-6xl px-5 py-9 sm:px-8 sm:py-12 lg:min-h-screen lg:px-12 lg:py-14">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
