import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const config = { get: jest.fn().mockReturnValue('segredo-com-mais-de-32-caracteres-para-teste') };

  it('consulta o usuário atual e aplica a versão da sessão', async () => {
    const prisma = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'usuario-1',
          email: 'usuario@exemplo.com',
          role: 'ADMIN',
          ativo: true,
          tokenVersion: 3,
        }),
      },
    };
    const strategy = new JwtStrategy(config as any, prisma as any);

    await expect(strategy.validate({ sub: 'usuario-1', tokenVersion: 3 })).resolves.toEqual({
      id: 'usuario-1',
      email: 'usuario@exemplo.com',
      role: 'ADMIN',
    });
  });

  it('rejeita usuário inativo ou token revogado', async () => {
    const prisma = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'usuario-1',
          email: 'usuario@exemplo.com',
          role: 'ADMIN',
          ativo: false,
          tokenVersion: 2,
        }),
      },
    };
    const strategy = new JwtStrategy(config as any, prisma as any);

    await expect(strategy.validate({ sub: 'usuario-1', tokenVersion: 2 })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
