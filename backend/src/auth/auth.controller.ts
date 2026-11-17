import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest, AuthenticatedUser } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

const SESSION_COOKIE_NAME = 'notes_session';
const SESSION_COOKIE_PATH = '/api';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @Header('Cache-Control', 'no-store')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: AuthenticatedUser }> {
    const result = await this.authService.login(dto);
    response.cookie(SESSION_COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: SESSION_COOKIE_PATH,
      maxAge: result.expiresIn * 1000,
    });

    return { user: result.user };
  }

  @Get('me')
  @Header('Cache-Control', 'no-store')
  me(@Req() request: Request & AuthenticatedRequest): AuthenticatedUser {
    return request.authUser;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'no-store')
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: SESSION_COOKIE_PATH,
    });
  }
}
