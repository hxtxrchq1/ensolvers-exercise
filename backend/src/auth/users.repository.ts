import { User } from '@prisma/client';

export interface DemoUserCredentials {
  username: string;
  passwordHash: string;
  passwordSalt: string;
}

export abstract class UsersRepository {
  abstract upsertDemoUser(credentials: DemoUserCredentials): Promise<User>;

  abstract findByUsername(username: string): Promise<User | null>;
}
