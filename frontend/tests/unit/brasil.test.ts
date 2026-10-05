import { describe, expect, it } from 'vitest';
import { cpfValido, formatarCpf, formatarTelefone, somenteNumeros, telefoneValido } from '../../src/utils/brasil';

describe('formatadores e validadores brasileiros', () => {
  it('remove pontuação de documentos e telefones', () => {
    expect(somenteNumeros('529.982.247-25')).toBe('52998224725');
    expect(formatarCpf('52998224725')).toBe('529.982.247-25');
    expect(formatarTelefone('11987654321')).toBe('(11) 98765-4321');
  });

  it('valida CPF e telefone e rejeita valores inválidos', () => {
    expect(cpfValido('529.982.247-25')).toBe(true);
    expect(cpfValido('111.111.111-11')).toBe(false);
    expect(telefoneValido('(11) 98765-4321')).toBe(true);
    expect(telefoneValido('00000000000')).toBe(false);
  });
});
