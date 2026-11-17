import axios from 'axios';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/services/http';
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
} from '@/services/authApi';
import { getApiErrorMessage } from '@/services/httpError';
import type { AuthenticatedUser, LoginCredentials } from '@/types/auth';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setUser(await getCurrentUser());
    } catch (requestError: unknown) {
      if (
        axios.isAxiosError(requestError) &&
        requestError.response?.status === 401
      ) {
        setUser(null);
      } else {
        setError(getApiErrorMessage(requestError));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const interceptorId = httpClient.interceptors.response.use(
      (response) => response,
      (requestError: unknown) => {
        if (
          axios.isAxiosError(requestError) &&
          requestError.response?.status === 401 &&
          requestError.config?.url !== '/auth/login'
        ) {
          queryClient.clear();
          setUser(null);
        }

        return Promise.reject(requestError);
      },
    );

    return () => httpClient.interceptors.response.eject(interceptorId);
  }, [queryClient]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const authenticatedUser = await loginRequest(credentials);
      queryClient.clear();
      setError(null);
      setUser(authenticatedUser);
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    queryClient.clear();
    setUser(null);
    setError(null);
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, isLoading, error, login, logout, refresh }),
    [user, isLoading, error, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
}
