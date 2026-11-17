export interface AuthenticatedUser {
  id: string;
  username: string;
}

export interface AuthenticatedRequest {
  authUser: AuthenticatedUser;
}

export interface LoginResult {
  user: AuthenticatedUser;
  token: string;
  expiresIn: number;
}
