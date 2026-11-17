import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { DemoUserCredentials, UsersRepository } from './users.repository';

@Injectable()
export class PrismaUsersRepository extends UsersRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  upsertDemoUser(credentials: DemoUserCredentials): Promise<User> {
    const { username, passwordHash, passwordSalt } = credentials;

    return this.prisma.user.upsert({
      where: { username },
      create: { username, passwordHash, passwordSalt },
      update: { passwordHash, passwordSalt },
    });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }
}
