import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import type { SignOptions } from 'jsonwebtoken';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [
    AuditoriaModule,
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '15m') as SignOptions['expiresIn'],
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
