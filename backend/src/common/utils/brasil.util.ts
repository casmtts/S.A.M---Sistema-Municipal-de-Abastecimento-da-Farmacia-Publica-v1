export const somenteNumeros = (valor: string): string => valor.replace(/\D/g, '');

export const normalizarCpf = (valor: string): string => somenteNumeros(valor);

export const cpfValido = (valor: string): boolean => {
  const cpf = normalizarCpf(valor);
  if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) return false;

  const calcularDigito = (base: string): number => {
    const soma = base.split('').reduce((total, numero, indice) => total + Number(numero) * (base.length + 1 - indice), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return calcularDigito(cpf.slice(0, 9)) === Number(cpf[9])
    && calcularDigito(cpf.slice(0, 10)) === Number(cpf[10]);
};

export const normalizarTelefone = (valor?: string): string | undefined => {
  if (!valor) return undefined;
  return somenteNumeros(valor);
};

export const telefoneValido = (valor: string): boolean => {
  const telefone = somenteNumeros(valor);
  if (!/^[1-9]\d{9,10}$/.test(telefone)) return false;
  const assinante = telefone.slice(2);
  return telefone.length === 10 ? /^[2-5]\d{7}$/.test(assinante) : /^9\d{8}$/.test(assinante);
};
