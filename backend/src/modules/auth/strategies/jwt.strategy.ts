import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { sessionAbsoluteMaxSeconds } from '../../../common/utils/session-cookie.util';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: (request: any) => request?.cookies?.sam_session || null,
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const agora = Math.floor(Date.now() / 1000);
    const authAt = Number(payload.authAt ?? payload.iat ?? 0);
    if (!authAt || agora - authAt > sessionAbsoluteMaxSeconds()) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, ativo: true, tokenVersion: true },
    });
    if (!usuario?.ativo || usuario.tokenVersion !== (payload.tokenVersion ?? 0)) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }
    return { id: usuario.id, email: usuario.email, role: usuario.role, tokenVersion: usuario.tokenVersion, iat: payload.iat, authAt };
  }
}
