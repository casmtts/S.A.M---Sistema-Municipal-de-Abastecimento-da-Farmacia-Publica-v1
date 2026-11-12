import { Controller, Post, Patch, Body, Request, Res, Get, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { RegisterDto } from './dto/register-dto';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { clearSessionCookie, setSessionCookie } from '../../common/utils/session-cookie.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000, blockDuration: 300000 } })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto, { ip: req.ip, userAgent: req.get('user-agent'), requestId: req.requestId });
    this.setSessionCookie(res, result.access_token);
    return { usuario: result.usuario };
  }

  @Get('me')
  async me(@Request() req: any) {
    return { usuario: await this.authService.obterUsuario(req.user.id) };
  }

  @Patch('profile')
  async updateProfile(@Body() dto: UpdateProfileDto, @Request() req: any) {
    return { usuario: await this.authService.atualizarPerfil(req.user.id, dto, { ip: req.ip, userAgent: req.get('user-agent'), requestId: req.requestId }) };
  }

  @Public()
  @Get('session')
  async session(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.sam_session;
    const result = await this.authService.obterSessao(token);
    if (token && !result.usuario) this.clearSessionCookie(res);
    return result;
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000, blockDuration: 300000 } })
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Request() req: any) {
    return this.authService.register(registerDto, { ip: req.ip, userAgent: req.get('user-agent'), requestId: req.requestId });
  }

  @Post('logout')
  async logout(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.logout(req.user.id, { ip: req.ip, userAgent: req.get('user-agent'), requestId: req.requestId });
    this.clearSessionCookie(res);
    return result;
  }

  @Patch('password')
  async changePassword(@Body() dto: ChangePasswordDto, @Request() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.changePassword(req.user.id, dto, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.requestId,
    });
    this.setSessionCookie(res, result.access_token);
    return { message: result.message };
  }

  @Post('logout-all')
  async logoutAll(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.revokeSessions(req.user.id, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.requestId,
    });
    this.clearSessionCookie(res);
    return result;
  }

  private setSessionCookie(response: Response, token: string) {
    setSessionCookie(response, token);
  }

  private clearSessionCookie(response: Response) {
    clearSessionCookie(response);
  }
}
