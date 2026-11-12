import { maskCpf, maskTelefone, neutralizeFormula } from './privacy.util';

describe('privacy.util', () => {
  it('mascara CPF mantendo apenas os dígitos centrais', () => {
    expect(maskCpf('123.456.789-09')).toBe('***.456.789-**');
    expect(maskCpf('12345678909')).toBe('***.456.789-**');
    expect(maskCpf('')).toBe('');
    expect(maskCpf('123')).toBe('***');
  });
  it('mascara telefone', () => {
    expect(maskTelefone('(63) 99999-1234')).toBe('(63) *****-**34');
    expect(maskTelefone(null)).toBe('');
  });
  it('neutraliza injeção de fórmulas', () => {
    expect(neutralizeFormula('=HYPERLINK("x")')).toBe(`'=HYPERLINK("x")`);
    expect(neutralizeFormula('+1')).toBe("'+1");
    expect(neutralizeFormula('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(neutralizeFormula('Dipirona')).toBe('Dipirona');
    expect(neutralizeFormula(10)).toBe(10);
  });
});
