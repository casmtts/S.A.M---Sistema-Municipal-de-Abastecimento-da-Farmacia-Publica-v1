import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { PrivacidadeController } from './privacidade.controller';
import { PrivacidadeService } from './privacidade.service';

@Module({ imports: [PrismaModule, AuditoriaModule], controllers: [PrivacidadeController], providers: [PrivacidadeService] })
export class PrivacidadeModule {}
