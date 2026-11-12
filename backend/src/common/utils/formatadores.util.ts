const TZ = 'America/Sao_Paulo';

export const formatadores = {
  // Formatar data para DD/MM/YYYY (fuso Brasília)
  data: (data: Date | string): string => {
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', { timeZone: TZ });
  },

  // Formatar data e hora (fuso Brasília)
  dataHora: (data: Date | string): string => {
    const d = new Date(data);
    return d.toLocaleString('pt-BR', { timeZone: TZ });
  },

  // Formatar hora (fuso Brasília)
  hora: (data: Date | string): string => {
    const d = new Date(data);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
  },

  // Data para nome de arquivo (fuso Brasília)
  dataArquivo: (): string => {
    const agora = new Date();
    const partes = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ }).formatToParts(agora);
    const get = (t: string) => partes.find(p => p.type === t)?.value ?? '00';
    return `${get('day')}-${get('month')}-${get('year')}`;
  },

  // Hora para nome de arquivo (fuso Brasília)
  horaArquivo: (): string => {
    const agora = new Date();
    const partes = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ, hour12: false }).formatToParts(agora);
    const get = (t: string) => partes.find(p => p.type === t)?.value ?? '00';
    return `${get('hour')}-${get('minute')}`;
  },

  // Obter data e hora atual formatada (fuso Brasília)
  getDataHoraAtual: (): { data: string; hora: string } => {
    const agora = new Date();
    return {
      data: agora.toLocaleDateString('pt-BR', { timeZone: TZ }),
      hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ }),
    };
  },

  // Moeda brasileira
  moeda: (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  },

  // CPF
  cpf: (cpf: string): string => {
    if (!cpf) return '';
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length !== 11) return cpf;
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  // Telefone
  telefone: (telefone: string): string => {
    if (!telefone) return '';
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  },
};