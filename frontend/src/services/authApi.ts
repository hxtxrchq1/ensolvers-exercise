import { httpClient } from './http';
import type { AuthenticatedUser, LoginCredentials } from '@/types/auth';

export async function login(
  credentials: LoginCredentials,
): Promise<AuthenticatedUser> {
  const response = await httpClient.post<{ user: AuthenticatedUser }>(
    '/auth/login',
    credentials,
  );

  return response.data.user;
}

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  const response = await httpClient.get<AuthenticatedUser>('/auth/me');

  return response.data;
}

export async function logout(): Promise<void> {
  await httpClient.post('/auth/logout');
}
