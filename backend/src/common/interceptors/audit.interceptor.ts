import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { catchError, tap, throwError } from 'rxjs';
import { AuditoriaService } from '../../modules/auditoria/auditoria.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditoria: AuditoriaService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const path = String(request.originalUrl || request.url || '');
    const method = String(request.method || 'GET');
    if (path.startsWith('/auth') || path.startsWith('/auditoria') || path.startsWith('/permissoes') || path.startsWith('/usuarios') || method === 'GET' && !path.includes('/exportar')) return next.handle();
    const { modulo, recurso } = this.resourceFromPath(path);
    const acao = this.actionFromRequest(method, path);
    const evento = { usuarioId: request.user?.id, requestId: request.requestId, acao, modulo, recurso, recursoId: request.params?.id, descricao: `${acao} em ${recurso || modulo}`, dadosDepois: method === 'POST' || method === 'PATCH' ? request.body : undefined, ip: request.ip, userAgent: request.get('user-agent') };
    return next.handle().pipe(
      tap(() => { void this.auditoria.registrar(evento); }),
      catchError((error) => { void this.auditoria.registrar({ ...evento, sucesso: false, erro: 'Falha na operação' }); return throwError(() => error); }),
    );
  }

  private actionFromRequest(method: string, path: string) {
    if (path.includes('/aprovar')) return 'PEDIDO_APROVADO';
    if (path.includes('/entregar')) return 'PEDIDO_ENTREGUE';
    if (path.includes('/cancelar')) return 'PEDIDO_CANCELADO';
    if (path.includes('/toggle')) return 'STATUS_ALTERADO';
    if (path.includes('/exportar')) return 'RELATORIO_EXPORTADO';
    return { POST: 'REGISTRO_CRIADO', PATCH: 'REGISTRO_ATUALIZADO', DELETE: 'REGISTRO_REMOVIDO' }[method] || 'OPERACAO_REALIZADA';
  }

  private resourceFromPath(path: string) {
    const segmento = path.split('?')[0].split('/').filter(Boolean)[0] || 'sistema';
    const labels: Record<string, [string, string]> = { medicamentos: ['estoque', 'Medicamento'], pedidos: ['pedidos', 'Pedido'], fornecedores: ['fornecedores', 'Fornecedor'], 'unidades-saude': ['unidades', 'UnidadeSaude'], movimentacoes: ['estoque', 'Movimentacao'], relatorios: ['relatorios', 'Relatorio'] };
    const [modulo, recurso] = labels[segmento] || [segmento, segmento];
    return { modulo, recurso };
  }
}
