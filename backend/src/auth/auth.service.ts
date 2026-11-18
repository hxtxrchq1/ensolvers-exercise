import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import {
  createHmac,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { AuthenticatedUser, LoginResult } from './auth.types.js';
import { LoginDto } from './dto/login.dto.js';
import { UsersRepository } from './users.repository.js';

const scrypt = promisify(nodeScrypt);
const PASSWORD_HASH_BYTES = 64;
const DUMMY_SALT = '00'.repeat(16);
const DUMMY_HASH = '00'.repeat(PASSWORD_HASH_BYTES);
const TOKEN_ISSUER = 'notes-app';

interface TokenHeader {
  alg: string;
  typ: string;
}

interface TokenPayload {
  sub: string;
  username: string;
  iss: string;
  iat: number;
  exp: number;
}

function encodeSegment(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decodeSegment<T>(value: string): T | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;

  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

function parseExpiration(value: string): number {
  const match = /^([1-9]\d*)(s|m|h|d)$/.exec(value);
  if (!match) {
    throw new Error('JWT_EXPIRES_IN debe ser una duración positiva.');
  }

  const amount = Number(match[1]);
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  const multiplier = match[2] ? multipliers[match[2]] : undefined;
  if (!multiplier) {
    throw new Error('JWT_EXPIRES_IN debe incluir una unidad válida.');
  }
  const seconds = amount * multiplier;

  if (!Number.isSafeInteger(seconds)) {
    throw new Error('JWT_EXPIRES_IN excede el valor permitido.');
  }

  return seconds;
}

function publicUser(user: User): AuthenticatedUser {
  return { id: user.id, username: user.username };
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly jwtSecret: string;
  private readonly tokenLifetime: number;
  private readonly demoUsername: string;
  private readonly demoPassword: string;

  constructor(
    private readonly usersRepository: UsersRepository,
    configService: ConfigService,
  ) {
    this.jwtSecret = configService.getOrThrow<string>('JWT_SECRET');
    this.tokenLifetime = parseExpiration(
      configService.getOrThrow<string>('JWT_EXPIRES_IN'),
    );
    this.demoUsername = configService.getOrThrow<string>('DEMO_USERNAME');
    this.demoPassword = configService.getOrThrow<string>('DEMO_PASSWORD');
  }

  async onModuleInit(): Promise<void> {
    const existingUser = await this.usersRepository.findByUsername(
      this.demoUsername,
    );

    if (existingUser) {
      const currentHash = await this.hashPassword(
        this.demoPassword,
        existingUser.passwordSalt,
      );
      if (this.passwordMatches(currentHash, existingUser.passwordHash)) return;
    }

    const passwordSalt = randomBytes(16).toString('hex');
    const passwordHash = await this.hashPassword(
      this.demoPassword,
      passwordSalt,
    );

    await this.usersRepository.upsertDemoUser({
      username: this.demoUsername,
      passwordHash,
      passwordSalt,
    });
  }

  async login(credentials: LoginDto): Promise<LoginResult> {
    const user =
      credentials.username === this.demoUsername
        ? await this.usersRepository.findByUsername(credentials.username)
        : null;
    const salt = user?.passwordSalt ?? DUMMY_SALT;
    const expectedHash = user?.passwordHash ?? DUMMY_HASH;
    const passwordHash = await this.hashPassword(credentials.password, salt);
    const isValid = this.passwordMatches(passwordHash, expectedHash);

    if (!user || !isValid) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    const userInfo = publicUser(user);
    const now = Math.floor(Date.now() / 1000);
    const token = this.signToken({
      sub: userInfo.id,
      username: userInfo.username,
      iss: TOKEN_ISSUER,
      iat: now,
      exp: now + this.tokenLifetime,
    });

    return { user: userInfo, token, expiresIn: this.tokenLifetime };
  }

  verifyToken(token: string): AuthenticatedUser {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('La sesión no es válida.');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    if (!/^[A-Za-z0-9_-]+$/.test(encodedSignature)) {
      throw new UnauthorizedException('La sesión no es válida.');
    }
    const header = decodeSegment<TokenHeader>(encodedHeader);
    const payload = decodeSegment<TokenPayload>(encodedPayload);
    const expectedSignature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
    );

    let actualSignature: Buffer;
    try {
      actualSignature = Buffer.from(encodedSignature, 'base64url');
    } catch {
      throw new UnauthorizedException('La sesión no es válida.');
    }

    const expected = Buffer.from(expectedSignature, 'base64url');
    if (
      !header ||
      header.alg !== 'HS256' ||
      header.typ !== 'JWT' ||
      actualSignature.length !== expected.length ||
      !timingSafeEqual(actualSignature, expected) ||
      !payload ||
      typeof payload.sub !== 'string' ||
      typeof payload.username !== 'string' ||
      payload.username !== this.demoUsername ||
      payload.iss !== TOKEN_ISSUER ||
      !Number.isInteger(payload.iat) ||
      !Number.isInteger(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000) ||
      payload.exp <= payload.iat
    ) {
      throw new UnauthorizedException('La sesión no es válida o expiró.');
    }

    return { id: payload.sub, username: payload.username };
  }

  private signToken(payload: TokenPayload): string {
    const header = encodeSegment({ alg: 'HS256', typ: 'JWT' });
    const body = encodeSegment(payload);
    const content = `${header}.${body}`;

    return `${content}.${this.createSignature(content)}`;
  }

  private createSignature(content: string): string {
    return createHmac('sha256', this.jwtSecret)
      .update(content)
      .digest('base64url');
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    const hash = (await scrypt(password, salt, PASSWORD_HASH_BYTES)) as Buffer;

    return hash.toString('hex');
  }

  private passwordMatches(actualHash: string, expectedHash: string): boolean {
    if (!/^[a-f\d]{128}$/i.test(actualHash)) return false;

    const actual = Buffer.from(actualHash, 'hex');
    const expected = /^[a-f\d]{128}$/i.test(expectedHash)
      ? Buffer.from(expectedHash, 'hex')
      : Buffer.from(DUMMY_HASH, 'hex');

    return timingSafeEqual(actual, expected) && expectedHash !== DUMMY_HASH;
  }
}
