import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios-module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { MedicamentosModule } from './modules/medicamentos/medicamentos.module';
import { FornecedoresModule } from './modules/fornecedores/fornecedores.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { UnidadesSaudeModule } from './modules/unidadesSaude/unidades-saude.module';
import { MovimentacoesModule } from './modules/movimentacoes/movimentacoes.module';
import { RelatoriosModule } from './modules/relatorios/relatorios.module';
import { PermissoesModule } from './modules/permissoes/permissoes.module';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    MedicamentosModule,
    FornecedoresModule,
    PedidosModule,
    UnidadesSaudeModule,
    MovimentacoesModule,
    RelatoriosModule,
    PermissoesModule,
    AuditoriaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule { }
