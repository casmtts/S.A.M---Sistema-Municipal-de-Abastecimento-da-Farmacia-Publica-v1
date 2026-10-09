import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from '../../src/services/api';


describe('getApiErrorMessage', () => {
  it('mapeia status de autenticação e erros internos para mensagens seguras', () => {
    expect(getApiErrorMessage({ isAxiosError: true, config: { url: '/auth/login' }, response: { status: 401 } } as any)).toContain('inválidos');
    expect(getApiErrorMessage({ isAxiosError: true, response: { status: 500 } } as any)).toContain('mais tarde');
  });

  it('não expõe detalhes de erro de rede e usa mensagem genérica', () => {
    expect(getApiErrorMessage({ isAxiosError: true, message: 'secret database error' } as any)).toContain('conectar ao servidor');
  });
});
