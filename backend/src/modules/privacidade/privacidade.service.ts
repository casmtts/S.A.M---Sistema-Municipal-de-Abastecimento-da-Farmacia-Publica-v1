import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreatePrivacyRequestDto } from './dto/create-privacy-request.dto';
import { prazoRespostaTitular } from '../../common/utils/retention.policy';
import { ResolvePrivacyRequestDto } from './dto/resolve-privacy-request.dto';

@Injectable()
export class PrivacidadeService {
  constructor(private readonly prisma: PrismaService, private readonly auditoria: AuditoriaService) {}

  private comPrazo<T extends { createdAt: Date; status: string }>(pedido: T) {
    const venceEm = prazoRespostaTitular(pedido.createdAt);
    const aberta = !['CONCLUIDA', 'RECUSADA'].includes(pedido.status);
    return { ...pedido, venceEm, atrasada: aberta && venceEm.getTime() < Date.now() };
  }

  /** Dados públicos do aviso de privacidade (art. 23, I e Res. CD/ANPD 18/2024, art. 9º). */
  aviso() {
    return {
      controlador: process.env.CONTROLADOR_NOME || 'Prefeitura Municipal — Secretaria de Saúde',
      encarregado: {
        nome: process.env.ENCARREGADO_NOME || 'Encarregado(a) pelo tratamento de dados pessoais',
        email: process.env.ENCARREGADO_EMAIL || null,
      },
      versao: '1.0',
      atualizadoEm: '2026-11-12',
      prazoRespostaDias: 15,
    };
  }

  async minhasSolicitacoes(usuarioId: string) {
    const pedidos = await this.prisma.solicitacaoPrivacidade.findMany({ where: { usuarioId }, orderBy: { createdAt: 'desc' } });
    return pedidos.map((p) => this.comPrazo(p));
  }

  async solicitar(usuarioId: string, dto: CreatePrivacyRequestDto, requestId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.solicitacaoPrivacidade.create({ data: { usuarioId, tipo: dto.tipo, descricao: dto.descricao?.trim() || null } });
      await this.auditoria.registrar({ usuarioId, requestId, acao: 'DIREITO_PRIVACIDADE_SOLICITADO', modulo: 'privacidade', recurso: 'SolicitacaoPrivacidade', recursoId: pedido.id, descricao: `Solicitação do tipo ${dto.tipo} registrada` }, tx);
      return pedido;
    });
  }

  async listar() {
    const pedidos = await this.prisma.solicitacaoPrivacidade.findMany({ orderBy: { createdAt: 'asc' }, include: { usuario: { select: { id: true, nome: true, email: true } } } });
    return pedidos.map((p) => this.comPrazo(p));
  }

  async atender(id: string, dto: ResolvePrivacyRequestDto, atendidaPor: string, requestId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const anterior = await tx.solicitacaoPrivacidade.findUnique({ where: { id } });
      if (!anterior) throw new NotFoundException('Solicitação de privacidade não encontrada.');
      if (anterior.status === 'CONCLUIDA' || anterior.status === 'RECUSADA') {
        throw new ConflictException('Esta solicitação já foi encerrada e não pode ser alterada. Abra um novo protocolo se necessário.');
      }
      if (dto.status !== 'EM_ANALISE' && anterior.status !== 'EM_ANALISE') {
        throw new ConflictException('A solicitação precisa estar em análise antes de ser concluída ou recusada.');
      }
      const atualizada = await tx.solicitacaoPrivacidade.update({ where: { id }, data: { status: dto.status, resposta: dto.resposta?.trim() || null, atendidaPor } });
      await this.auditoria.registrar({ usuarioId: atendidaPor, requestId, acao: 'DIREITO_PRIVACIDADE_ATENDIDO', modulo: 'privacidade', recurso: 'SolicitacaoPrivacidade', recursoId: id, descricao: `Solicitação atualizada para ${dto.status}`, dadosAntes: { tipo: anterior.tipo, status: anterior.status }, dadosDepois: { status: atualizada.status, resposta: atualizada.resposta } }, tx);
      return atualizada;
    });
  }

  async exportarDados(usuarioId: string) {
    const [usuario, pedidos, pedidosAprovados, movimentacoes, solicitacoes] = await Promise.all([
      this.prisma.usuario.findUnique({ where: { id: usuarioId }, select: { id: true, nome: true, email: true, cpf: true, telefone: true, cargo: true, role: true, ativo: true, unidadeId: true, createdAt: true, updatedAt: true, ultimoAcesso: true } }),
      this.prisma.pedido.findMany({ where: { solicitanteId: usuarioId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.pedido.findMany({ where: { aprovadorId: usuarioId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.movimentacao.findMany({ where: { responsavelId: usuarioId }, orderBy: { createdAt: 'asc' } }),
      this.minhasSolicitacoes(usuarioId),
    ]);
    return { exportadoEm: new Date().toISOString(), usuario, pedidosComoSolicitante: pedidos, pedidosComoAprovador: pedidosAprovados, movimentacoes, solicitacoes };
  }

  async pseudonimizar(usuarioId: string, atendidaPor: string, requestId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.findUnique({ where: { id: usuarioId } });
      if (!usuario) throw new NotFoundException('Usuário não encontrado.');
      if (usuario.role === 'SUPER_ADMIN') throw new NotFoundException('Conta protegida não pode ser pseudonimizada por este fluxo.');
      const pedido = await tx.solicitacaoPrivacidade.findFirst({ where: { usuarioId, tipo: 'ELIMINACAO' }, orderBy: { updatedAt: 'desc' } });
      if (pedido?.status !== 'CONCLUIDA') throw new NotFoundException('Conclua e avalie a solicitação de eliminação antes de pseudonimizar.');
      const suffix = usuario.id;
      const pseudonimizado = await tx.usuario.update({ where: { id: usuarioId }, data: {
        nome: `Usuário removido ${suffix}`,
        email: `removido+${suffix}@invalid.local`,
        cpf: `ANON-${suffix}`,
        telefone: null,
        cargo: null,
        unidadeId: null,
        senha: '!',
        ativo: false,
        tokenVersion: { increment: 1 },
      }, select: { id: true, ativo: true } });
      // Preserve historical stock records as created; rewriting their actor snapshot
      // would break the evidentiary ledger. The retained identifier is governed by the
      // municipality's retention schedule and applicable legal holds.
      await tx.solicitacaoPrivacidade.updateMany({ where: { usuarioId }, data: { descricao: null, resposta: null } });
      await this.auditoria.registrar({ usuarioId: atendidaPor, requestId, acao: 'DADOS_PESSOAIS_PSEUDONIMIZADOS', modulo: 'privacidade', recurso: 'Usuario', recursoId: usuarioId, descricao: 'Dados diretos pseudonimizados após análise de retenção' }, tx);
      return pseudonimizado;
    });
  }
}
