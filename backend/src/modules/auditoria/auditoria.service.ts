import { createHmac } from 'crypto';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditoriaQueryDto, AuditoriaStatus } from './dto/auditoria-query.dto';

export type AuditoriaEvento = {
  usuarioId?: string;
  acao: string;
  modulo: string;
  recurso?: string;
  recursoId?: string;
  descricao: string;
  dadosAntes?: unknown;
  dadosDepois?: unknown;
  ip?: string;
  userAgent?: string;
  sucesso?: boolean;
  erro?: string;
  requestId?: string;
};

const SENSITIVE_KEYS = new Set([
  'cpf', 'telefone', 'nome', 'email', 'usuarioemail', 'usuarionome', 'ip', 'useragent',
  'senha', 'password', 'senhatual', 'novasenha', 'confirmarsenha',
  'token', 'access_token', 'authorization', 'cookie', 'set-cookie', 'jwt', 'secret',
]);

type AuditTransaction = Pick<Prisma.TransactionClient, 'usuario' | 'logAuditoria'>;

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registrar(evento: AuditoriaEvento, transaction?: AuditTransaction): Promise<void> {
    try {
      const persist = async (client: AuditTransaction) => {
        await client.logAuditoria.create({
          data: {
            usuarioId: evento.usuarioId,
            usuarioNome: evento.usuarioId ? `Conta ${evento.usuarioId.slice(0, 8)}` : 'Sistema',
            acao: evento.acao,
            modulo: evento.modulo,
            recurso: evento.recurso,
            recursoId: evento.recursoId,
            descricao: evento.descricao,
            dadosAntes: this.sanitize(evento.dadosAntes) as any,
            dadosDepois: this.sanitize(evento.dadosDepois) as any,
            ip: evento.ip ? this.hashAuditValue(evento.ip) : undefined,
            userAgent: undefined,
            sucesso: evento.sucesso ?? true,
            erro: evento.erro,
            requestId: evento.requestId,
          },
        });
      };

      if (transaction) await persist(transaction);
      else await this.prisma.$transaction(persist);
    } catch (error) {
      this.logger.error('Não foi possível registrar auditoria.', error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Não foi possível persistir o registro de auditoria.');
    }
  }

  async verificarIntegridade() {
    const [resultado] = await this.prisma.$queryRaw<Array<{ valido: boolean; total: bigint; sequenciaErro: bigint | null }>>`
      SELECT * FROM "logs_auditoria_verificar_integridade"()
    `;
    return {
      valido: resultado.valido,
      total: resultado.total.toString(),
      sequenciaErro: resultado.sequenciaErro?.toString() ?? null,
    };
  }

  async listar(query: AuditoriaQueryDto, maxLimit = 100) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || 20));
    const inicio = query.dataInicio ? new Date(query.dataInicio) : undefined;
    const fim = query.dataFim ? new Date(query.dataFim) : undefined;
    if (inicio && fim && fim.getTime() < inicio.getTime()) {
      throw new BadRequestException('O intervalo informado é inválido.');
    }
    if (inicio && fim && fim.getTime() - inicio.getTime() > 366 * 24 * 60 * 60 * 1000) {
      throw new BadRequestException('O intervalo máximo permitido é de 366 dias.');
    }
    const where = {
      ...(query.usuarioId ? { usuarioId: query.usuarioId } : {}),
      ...(query.acao ? { acao: query.acao } : {}),
      ...(query.modulo ? { modulo: query.modulo } : {}),
      ...(query.recurso ? { recurso: query.recurso } : {}),
      ...(query.status ? { sucesso: query.status === AuditoriaStatus.SUCESSO } : {}),
      ...(query.dataInicio || query.dataFim ? { createdAt: {
        ...(inicio ? { gte: inicio } : {}),
        ...(fim ? { lte: fim } : {}),
      } } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.logAuditoria.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.logAuditoria.count({ where }),
    ]);
    return {
      data: data.map((item) => ({ ...item, sequencia: item.sequencia.toString() })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async opcoes() {
    const [acoes, modulos, recursos, usuarios] = await Promise.all([
      this.prisma.logAuditoria.findMany({ distinct: ['acao'], select: { acao: true }, orderBy: { acao: 'asc' }, take: 200 }),
      this.prisma.logAuditoria.findMany({ distinct: ['modulo'], select: { modulo: true }, orderBy: { modulo: 'asc' }, take: 200 }),
      this.prisma.logAuditoria.findMany({ where: { recurso: { not: null } }, distinct: ['recurso'], select: { recurso: true }, orderBy: { recurso: 'asc' }, take: 200 }),
      this.prisma.logAuditoria.findMany({ where: { usuarioId: { not: null } }, distinct: ['usuarioId'], select: { usuarioId: true, usuarioNome: true, usuarioEmail: true }, orderBy: { usuarioNome: 'asc' }, take: 200 }),
    ]);
    return {
      acoes: acoes.map(({ acao }) => acao),
      modulos: modulos.map(({ modulo }) => modulo),
      recursos: recursos.flatMap(({ recurso }) => recurso ? [recurso] : []),
      usuarios: usuarios.flatMap(({ usuarioId, usuarioNome, usuarioEmail }) => usuarioId ? [{ id: usuarioId, nome: usuarioNome || usuarioEmail || 'Usuário', email: usuarioEmail }] : []),
      status: [
        { valor: AuditoriaStatus.SUCESSO, nome: 'Sucesso' },
        { valor: AuditoriaStatus.FALHA, nome: 'Falha' },
      ],
    };
  }

  async detalhar(id: string) {
    const item = await this.prisma.logAuditoria.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Registro de auditoria não encontrado');
    return { ...item, sequencia: item.sequencia.toString() };
  }

  async exportar(query: AuditoriaQueryDto, formato: 'PDF' | 'CSV') {
    const result = await this.listar({ ...query, page: '1', limit: '10000' }, 10000);
    const rows = result.data.map((item) => [
      item.sequencia, item.previousHash, item.eventHash, item.createdAt.toISOString(), item.usuarioNome || 'Sistema', item.usuarioEmail || '', item.acao,
      this.rotuloModulo(item.modulo), item.recurso || '', item.recursoId || '', item.descricao, item.ip || '', item.sucesso ? 'Sucesso' : 'Falha',
    ]);
    const headers = ['Sequência', 'Hash anterior', 'Hash do evento', 'Data', 'Usuário', 'E-mail', 'Ação', 'Módulo', 'Recurso', 'ID', 'Descrição', 'IP', 'Status'];
    if (formato === 'CSV') {
      const csv = [headers, ...rows].map((row) => row.map((value) => {
        const text = String(value);
        const safe = /^[\u0000-\u0020]*[=+\-@]/.test(text) ? `'${text}` : text;
        return `"${safe.replaceAll('"', '""')}"`;
      }).join(';')).join('\n');
      return { buffer: Buffer.from(`\ufeff${csv}`, 'utf8'), contentType: 'text/csv; charset=utf-8', filename: 'historico-auditoria.csv' };
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PdfPrinter = require('pdfmake');
    const printer = new PdfPrinter({ Roboto: { normal: 'Helvetica', bold: 'Helvetica-Bold' } });
    const doc = {
      content: [
        { text: 'Histórico de auditoria', style: 'header' },
        { text: `Registros: ${rows.length}`, margin: [0, 0, 0, 12] },
        { table: { headerRows: 1, widths: ['auto', '*', 'auto', '*', '*', '*', 'auto'], body: [
          ['Seq.', 'Hash do evento', 'Data', 'Usuário', 'Ação', 'Descrição', 'Status'],
          ...rows.map((row) => [row[0], row[2], new Date(row[3]).toLocaleString('pt-BR'), row[4], row[6], row[10], row[12]]),
        ] } },
      ],
      styles: { header: { fontSize: 16, bold: true, margin: [0, 0, 0, 8] } },
      defaultStyle: { fontSize: 7 },
    };
    return new Promise<{ buffer: Buffer; contentType: string; filename: string }>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const pdf = printer.createPdfKitDocument(doc);
      pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdf.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: 'application/pdf', filename: 'historico-auditoria.pdf' }));
      pdf.on('error', reject);
      pdf.end();
    });
  }

  private hashAuditValue(value: string) {
    const secret = process.env.AUDIT_IDENTIFIER_SECRET || process.env.JWT_SECRET || 'development-only-audit-key';
    return createHmac('sha256', secret).update(value).digest('hex');
  }

  private sanitize(value: unknown): unknown {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) return value.map((item) => this.sanitize(item));
    if (typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SENSITIVE_KEYS.has(key.toLowerCase()))
      .map(([key, item]) => [key, ['cpf', 'telefone'].includes(key.toLowerCase()) ? this.mask(String(item)) : this.sanitize(item)]));
  }

  private mask(value: string) {
    if (!value) return value;
    return `${value.slice(0, 3)}***${value.slice(-2)}`;
  }

  private rotuloModulo(value: string) {
    return value.toLowerCase() === 'auth' ? 'autenticação' : value;
  }
}
