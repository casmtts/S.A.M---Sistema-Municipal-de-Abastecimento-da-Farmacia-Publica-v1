import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { formatadores } from '../../common/utils/formatadores.util';
import { RelatorioOptionsDto, TipoRelatorio, FormatoRelatorio } from './dto/relatorio-options.dto';

// ✅ Importação correta do pdfmake
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake');

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

const printer = new PdfPrinter(fonts);

@Injectable()
export class RelatoriosService {
  private readonly logger = new Logger(RelatoriosService.name);

  constructor(private prisma: PrismaService) {}

  async gerarRelatorio(options: RelatorioOptionsDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    try {
      this.validarPeriodo(options);
      let dados: any[];
      let titulo: string;
      let colunas: any[];

      switch (options.tipo) {
        case TipoRelatorio.MEDICAMENTOS:
          const medicamentos = await this.getDadosMedicamentos();
          dados = medicamentos.dados;
          titulo = 'Relatório de Medicamentos';
          colunas = medicamentos.colunas;
          break;
        case TipoRelatorio.PEDIDOS:
          const pedidos = await this.getDadosPedidos(options);
          dados = pedidos.dados;
          titulo = 'Relatório de Pedidos';
          colunas = pedidos.colunas;
          break;
        case TipoRelatorio.MOVIMENTACOES:
          const movimentacoes = await this.getDadosMovimentacoes(options);
          dados = movimentacoes.dados;
          titulo = 'Relatório de Movimentações';
          colunas = movimentacoes.colunas;
          break;
        case TipoRelatorio.FORNECEDORES:
          const fornecedores = await this.getDadosFornecedores();
          dados = fornecedores.dados;
          titulo = 'Relatório de Fornecedores';
          colunas = fornecedores.colunas;
          break;
        case TipoRelatorio.UNIDADES:
          const unidades = await this.getDadosUnidades();
          dados = unidades.dados;
          titulo = 'Relatório de Unidades de Saúde';
          colunas = unidades.colunas;
          break;
        case TipoRelatorio.USUARIOS:
          const usuarios = await this.getDadosUsuarios();
          dados = usuarios.dados;
          titulo = 'Relatório de Usuários';
          colunas = usuarios.colunas;
          break;
        default:
        throw new BadRequestException('Tipo de relatório inválido.');
      }

      const { data: dataGeracao, hora: horaGeracao } = formatadores.getDataHoraAtual();
      const nomeArquivo = `${titulo.replace(/\s/g, '_')}_${formatadores.dataArquivo()}`;

      if (options.formato === FormatoRelatorio.EXCEL) {
        const buffer = await this.gerarExcel(dados, colunas, titulo, dataGeracao, horaGeracao);
        return {
          buffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          filename: `${nomeArquivo}.xlsx`,
        };
      } else {
        const buffer = await this.gerarPDFComPdfMake(dados, colunas, titulo, dataGeracao, horaGeracao);
        return {
          buffer,
          contentType: 'application/pdf',
          filename: `${nomeArquivo}.pdf`,
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Erro ao gerar relatório.', error.stack);
        if (error instanceof BadRequestException) throw error;
        throw new InternalServerErrorException('Não foi possível gerar o relatório.');
      }
      throw new InternalServerErrorException('Não foi possível gerar o relatório.');
    }
  }

  private validarPeriodo(options: RelatorioOptionsDto) {
    if (!options.dataInicio && !options.dataFim) return;
    if (!options.dataInicio || !options.dataFim) throw new BadRequestException('Informe o início e o fim do período.');
    const inicio = new Date(options.dataInicio);
    const fim = new Date(options.dataFim);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim < inicio || fim.getTime() - inicio.getTime() > 366 * 24 * 60 * 60 * 1000) {
      throw new BadRequestException('O intervalo informado é inválido.');
    }
  }

  // ==================== GERAR PDF COM PDFMAKE ====================

  private async gerarPDFComPdfMake(
    dados: any[],
    colunas: any[],
    titulo: string,
    dataGeracao: string,
    horaGeracao: string
  ): Promise<Buffer> {
    const tableBody = [
      colunas.map(c => ({ text: c.header, style: 'tableHeader', alignment: 'center' })),
      ...dados.map(item => colunas.map(c => ({ text: String(item[c.key] || '-'), style: 'tableCell' }))),
    ];

    const docDefinition = {
      pageOrientation: 'landscape',
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 40],
      defaultStyle: {
        fontSize: 9,
      },
      content: [
        {
          text: titulo,
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 0, 10],
        },
        {
          text: `Gerado em: ${dataGeracao} às ${horaGeracao} (Horário de Brasília)`,
          style: 'subheader',
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },
        {
          table: {
            headerRows: 1,
            widths: colunas.map(() => 'auto'),
            body: tableBody,
          },
          layout: {
            fillColor: (rowIndex: number) => {
              if (rowIndex === 0) return '#4472C4';
              return rowIndex % 2 === 0 ? '#F3F3F3' : null;
            },
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#CCCCCC',
            vLineColor: () => '#CCCCCC',
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 3,
            paddingBottom: () => 3,
          },
        },
        {
          text: `Total de registros: ${dados.length}`,
          alignment: 'right',
          margin: [0, 20, 0, 0],
          fontSize: 8,
          italics: true,
        },
      ],
      styles: {
        header: { fontSize: 16, bold: true, alignment: 'center' },
        subheader: { fontSize: 10, italics: true, alignment: 'center' },
        tableHeader: { fontSize: 10, bold: true, color: 'white', alignment: 'center' },
        tableCell: { fontSize: 9 },
      },
    };

    return new Promise((resolve, reject) => {
      try {
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks: Buffer[] = [];

        pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', (error: Error) => reject(error));

        pdfDoc.end();
      } catch (error) {
        if (error instanceof Error) {
          reject(new Error(`Erro ao gerar PDF: ${error.message}`));
        }
        reject(new Error('Erro desconhecido ao gerar PDF'));
      }
    });
  }

  // ==================== MÉTODOS DE DADOS ====================

  private async getDadosMedicamentos() {
    try {
      const medicamentos = await this.prisma.medicamento.findMany({
        orderBy: { nome: 'asc' },
      });

      const dados = medicamentos.map(m => ({
        Nome: m.nome,
        'Princípio Ativo': m.principioAtivo,
        Concentração: m.concentracao || '-',
        'Forma Farmacêutica': m.formaFarmaceutica || '-',
        Estoque: `${m.quantidadeAtual} un.`,
        Mínimo: `${m.quantidadeMinima} un.`,
        'Preço Unitário': formatadores.moeda(m.precoUnitario),
        Validade: formatadores.data(m.validade),
        Status: m.quantidadeAtual <= m.quantidadeMinima ? 'Baixo' : 'Normal',
      }));

      const colunas = [
        { header: 'Nome', key: 'Nome', width: 30 },
        { header: 'Princípio Ativo', key: 'Princípio Ativo', width: 30 },
        { header: 'Concentração', key: 'Concentração', width: 15 },
        { header: 'Forma Farmacêutica', key: 'Forma Farmacêutica', width: 20 },
        { header: 'Estoque', key: 'Estoque', width: 12 },
        { header: 'Mínimo', key: 'Mínimo', width: 10 },
        { header: 'Preço Unitário', key: 'Preço Unitário', width: 15 },
        { header: 'Validade', key: 'Validade', width: 12 },
        { header: 'Status', key: 'Status', width: 10 },
      ];

      return { dados, colunas };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erro ao buscar medicamentos: ${error.message}`);
      }
      throw new Error('Erro desconhecido ao buscar medicamentos');
    }
  }

  private async getDadosPedidos(options: RelatorioOptionsDto) {
    try {
      const where: any = {};

      if (options.status && options.status !== 'todos') {
        where.status = options.status;
      }

      if (options.dataInicio && options.dataFim) {
        where.dataSolicitacao = {
          gte: new Date(options.dataInicio),
          lte: new Date(options.dataFim),
        };
      }

      const pedidos = await this.prisma.pedido.findMany({
        where,
        include: {
          medicamento: true,
          solicitante: { select: { nome: true } },
        },
        orderBy: { dataSolicitacao: 'desc' },
      });

      const dados = pedidos.map(p => ({
        Medicamento: p.medicamentoNome,
        'Qtd. Solicitada': `${p.quantidadeSolicitada} un.`,
        'Qtd. Entregue': `${p.quantidadeEntregue} un.`,
        'Data Solicitação': formatadores.data(p.dataSolicitacao),
        'Data Prevista': formatadores.data(p.dataPrevistaEntrega),
        'Data Entrega': p.dataEntregaReal ? formatadores.data(p.dataEntregaReal) : '-',
        Status: this.getStatusPedidoLabel(p.status),
        'Valor Total': formatadores.moeda(p.valorTotal),
        Solicitante: p.solicitante?.nome || '-',
      }));

      const colunas = [
        { header: 'Medicamento', key: 'Medicamento', width: 30 },
        { header: 'Qtd. Solicitada', key: 'Qtd. Solicitada', width: 15 },
        { header: 'Qtd. Entregue', key: 'Qtd. Entregue', width: 15 },
        { header: 'Data Solicitação', key: 'Data Solicitação', width: 15 },
        { header: 'Data Prevista', key: 'Data Prevista', width: 12 },
        { header: 'Data Entrega', key: 'Data Entrega', width: 12 },
        { header: 'Status', key: 'Status', width: 12 },
        { header: 'Valor Total', key: 'Valor Total', width: 15 },
        { header: 'Solicitante', key: 'Solicitante', width: 20 },
      ];

      return { dados, colunas };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erro ao buscar pedidos: ${error.message}`);
      }
      throw new Error('Erro desconhecido ao buscar pedidos');
    }
  }

  private async getDadosMovimentacoes(options: RelatorioOptionsDto) {
    try {
      const where: any = {};

      if (options.dataInicio && options.dataFim) {
        where.data = {
          gte: new Date(options.dataInicio),
          lte: new Date(options.dataFim),
        };
      }

      const movimentacoes = await this.prisma.movimentacao.findMany({
        where,
        include: {
          medicamento: { select: { nome: true } },
          responsavel: { select: { nome: true } },
        },
        orderBy: { data: 'desc' },
      });

      const dados = movimentacoes.map(m => ({
        Data: formatadores.data(m.data),
        Hora: formatadores.hora(m.data),
        Medicamento: m.medicamentoNome,
        Tipo: this.getTipoMovimentacaoLabel(m.tipo),
        Quantidade: `${m.quantidade} un.`,
        Responsável: m.responsavelNome,
        Documento: m.documentoReferencia || '-',
        Observação: m.observacao || '-',
      }));

      const colunas = [
        { header: 'Data', key: 'Data', width: 12 },
        { header: 'Hora', key: 'Hora', width: 10 },
        { header: 'Medicamento', key: 'Medicamento', width: 30 },
        { header: 'Tipo', key: 'Tipo', width: 12 },
        { header: 'Quantidade', key: 'Quantidade', width: 12 },
        { header: 'Responsável', key: 'Responsável', width: 25 },
        { header: 'Documento', key: 'Documento', width: 15 },
        { header: 'Observação', key: 'Observação', width: 30 },
      ];

      return { dados, colunas };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erro ao buscar movimentações: ${error.message}`);
      }
      throw new Error('Erro desconhecido ao buscar movimentações');
    }
  }

  private async getDadosFornecedores() {
    try {
      const fornecedores = await this.prisma.fornecedor.findMany({
        orderBy: { nome: 'asc' },
      });

      const dados = fornecedores.map(f => ({
        Nome: f.nome,
        CNPJ: f.cnpj,
        Contato: f.contato || '-',
        Telefone: formatadores.telefone(f.telefone || ''),
        Email: f.email || '-',
        Cidade: f.cidade || '-',
        UF: f.uf || '-',
        Status: f.ativo ? '✅ Ativo' : '❌ Inativo',
      }));

      const colunas = [
        { header: 'Nome', key: 'Nome', width: 30 },
        { header: 'CNPJ', key: 'CNPJ', width: 18 },
        { header: 'Contato', key: 'Contato', width: 20 },
        { header: 'Telefone', key: 'Telefone', width: 15 },
        { header: 'Email', key: 'Email', width: 25 },
        { header: 'Cidade', key: 'Cidade', width: 20 },
        { header: 'UF', key: 'UF', width: 5 },
        { header: 'Status', key: 'Status', width: 10 },
      ];

      return { dados, colunas };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erro ao buscar fornecedores: ${error.message}`);
      }
      throw new Error('Erro desconhecido ao buscar fornecedores');
    }
  }

  private async getDadosUnidades() {
    try {
      const unidades = await this.prisma.unidadeSaude.findMany({
        orderBy: { nome: 'asc' },
      });

      const dados = unidades.map(u => ({
        Nome: u.nome,
        Código: u.codigo,
        Tipo: u.tipo,
        Responsável: u.responsavel || '-',
        Telefone: formatadores.telefone(u.telefone || ''),
        Cidade: u.cidade || '-',
        UF: u.uf || '-',
        Status: u.ativo ? '✅ Ativo' : '❌ Inativo',
      }));

      const colunas = [
        { header: 'Nome', key: 'Nome', width: 35 },
        { header: 'Código', key: 'Código', width: 12 },
        { header: 'Tipo', key: 'Tipo', width: 15 },
        { header: 'Responsável', key: 'Responsável', width: 25 },
        { header: 'Telefone', key: 'Telefone', width: 15 },
        { header: 'Cidade', key: 'Cidade', width: 20 },
        { header: 'UF', key: 'UF', width: 5 },
        { header: 'Status', key: 'Status', width: 10 },
      ];

      return { dados, colunas };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erro ao buscar unidades: ${error.message}`);
      }
      throw new Error('Erro desconhecido ao buscar unidades');
    }
  }

  private async getDadosUsuarios() {
    try {
      const usuarios = await this.prisma.usuario.findMany({
        select: {
          id: true,
          nome: true,
          email: true,
          cpf: true,
          role: true,
          ativo: true,
          cargo: true,
          createdAt: true,
        },
        orderBy: { nome: 'asc' },
      });

      const dados = usuarios.map(u => ({
        Nome: u.nome,
        Email: u.email,
        CPF: formatadores.cpf(u.cpf),
        Perfil: this.getRoleLabel(u.role),
        Cargo: u.cargo || '-',
        Status: u.ativo ? '✅ Ativo' : '❌ Inativo',
        'Data Cadastro': formatadores.data(u.createdAt),
      }));

      const colunas = [
        { header: 'Nome', key: 'Nome', width: 30 },
        { header: 'Email', key: 'Email', width: 30 },
        { header: 'CPF', key: 'CPF', width: 15 },
        { header: 'Perfil', key: 'Perfil', width: 15 },
        { header: 'Cargo', key: 'Cargo', width: 20 },
        { header: 'Status', key: 'Status', width: 10 },
        { header: 'Data Cadastro', key: 'Data Cadastro', width: 12 },
      ];

      return { dados, colunas };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erro ao buscar usuários: ${error.message}`);
      }
      throw new Error('Erro desconhecido ao buscar usuários');
    }
  }

  // ==================== GERADOR DE EXCEL ====================

  private async gerarExcel(dados: any[], colunas: any[], titulo: string, dataGeracao: string, horaGeracao: string): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(titulo.substring(0, 31));

      worksheet.mergeCells('A1', `${this.getColumnLetter(colunas.length)}1`);
      const titleCell = worksheet.getCell('A1');
      titleCell.value = titulo;
      titleCell.font = { size: 16, bold: true, name: 'Calibri' };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.mergeCells('A2', `${this.getColumnLetter(colunas.length)}2`);
      const dateCell = worksheet.getCell('A2');
      dateCell.value = `Gerado em: ${dataGeracao} às ${horaGeracao} (Horário de Brasília)`;
      dateCell.font = { size: 10, italic: true, name: 'Calibri' };
      dateCell.alignment = { horizontal: 'center' };

      worksheet.addRow([]);

      const headerRow = worksheet.addRow(colunas.map(c => c.header));
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 25;

      dados.forEach((item, index) => {
        const row = worksheet.addRow(colunas.map(c => item[c.key] || '-'));
        row.alignment = { vertical: 'middle' };
        row.height = 20;

        if (index % 2 === 1) {
          row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
          });
        }
      });

      colunas.forEach((col, idx) => {
        worksheet.getColumn(idx + 1).width = col.width;
        worksheet.getColumn(idx + 1).alignment = { vertical: 'middle' };
      });

      worksheet.eachRow(row => {
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });

      worksheet.views = [{ state: 'frozen', ySplit: 3 }];

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erro ao gerar Excel: ${error.message}`);
      }
      throw new Error('Erro desconhecido ao gerar Excel');
    }
  }

  private getColumnLetter(columnCount: number): string {
    let result = '';
    let n = columnCount;
    while (n > 0) {
      n--;
      result = String.fromCharCode(65 + (n % 26)) + result;
      n = Math.floor(n / 26);
    }
    return result;
  }

  // ==================== UTILITÁRIOS ====================

  private getStatusPedidoLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDENTE: '⏳ Pendente',
      APROVADO: '✅ Aprovado',
      EM_ANALISE: '🔍 Em Análise',
      ENVIADO: '📦 Enviado',
      ENTREGUE: '🎯 Entregue',
      CANCELADO: '❌ Cancelado',
    };
    return labels[status] || status;
  }

  private getTipoMovimentacaoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      ENTRADA: '📥 Entrada',
      SAIDA: '📤 Saída',
      DISPENSA: '💊 Dispensa',
    };
    return labels[tipo] || tipo;
  }

  private getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      ADMIN: '👑 Administrador',
      GESTOR: '📊 Gestor',
      FARMACEUTICO: '💊 Farmacêutico',
      ATENDENTE: '🏥 Atendente',
      CONSULTOR: '📈 Consultor',
    };
    return labels[role] || role;
  }
}
