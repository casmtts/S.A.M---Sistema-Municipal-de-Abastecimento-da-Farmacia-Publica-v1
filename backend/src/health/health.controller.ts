import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('check')
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    } catch {
      throw new ServiceUnavailableException('Serviço temporariamente indisponível.');
    }
  }
}
