import { Controller, Post, Body, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { RegisterDto } from './dto/register-dto';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000, blockDuration: 300000 } })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    return this.authService.login(loginDto, { ip: req.ip, userAgent: req.get('user-agent'), requestId: req.requestId });
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000, blockDuration: 300000 } })
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Request() req: any) {
    return this.authService.register(registerDto, { ip: req.ip, userAgent: req.get('user-agent'), requestId: req.requestId });
  }

  @Post('logout')
  async logout(@Request() req: any) {
    return this.authService.logout(req.user.id, { ip: req.ip, userAgent: req.get('user-agent'), requestId: req.requestId });
  }
}
