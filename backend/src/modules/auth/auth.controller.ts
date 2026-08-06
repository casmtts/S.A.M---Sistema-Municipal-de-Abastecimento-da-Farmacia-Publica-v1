import { Controller, Post, Body, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { RegisterDto } from './dto/register-dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    return this.authService.login(loginDto, { ip: req.ip, userAgent: req.get('user-agent') });
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Request() req: any) {
    return this.authService.register(registerDto, { ip: req.ip, userAgent: req.get('user-agent') });
  }

  @Post('logout')
  async logout(@Request() req: any) {
    return this.authService.logout(req.user.id, { ip: req.ip, userAgent: req.get('user-agent') });
  }
}
