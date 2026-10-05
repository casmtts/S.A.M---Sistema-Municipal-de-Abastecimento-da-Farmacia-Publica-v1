import { AuthController } from './auth.controller';

describe('AuthController cookie session', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalExpiresIn = process.env.JWT_EXPIRES_IN;

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalExpiresIn === undefined) delete process.env.JWT_EXPIRES_IN;
    else process.env.JWT_EXPIRES_IN = originalExpiresIn;
  });

  it('envia a sessão em cookie HttpOnly e não inclui JWT no JSON', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_EXPIRES_IN = '12h';
    const authService = { login: jest.fn().mockResolvedValue({ access_token: 'jwt-secret', usuario: { id: 'user-1', role: 'ADMIN' } }) };
    const controller = new AuthController(authService as any);
    const response = { cookie: jest.fn() } as any;

    const result = await controller.login({ email: 'admin@example.gov', senha: 'not-a-real-password' } as any, { ip: '127.0.0.1', get: () => 'test', requestId: 'request-1' }, response);

    expect(result).toEqual({ usuario: { id: 'user-1', role: 'ADMIN' } });
    expect(JSON.stringify(result)).not.toContain('jwt-secret');
    expect(response.cookie).toHaveBeenCalledWith('sam_session', 'jwt-secret', expect.objectContaining({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 12 * 60 * 60 * 1000,
    }));
  });

  it('limpa o cookie após registrar logout', async () => {
    const authService = { logout: jest.fn().mockResolvedValue({ message: 'Logout registrado.' }) };
    const controller = new AuthController(authService as any);
    const response = { clearCookie: jest.fn() } as any;

    await controller.logout({ user: { id: 'user-1' }, ip: '127.0.0.1', get: () => 'test' }, response);

    expect(response.clearCookie).toHaveBeenCalledWith('sam_session', expect.objectContaining({ path: '/', sameSite: 'strict' }));
  });

  it('consulta a sessão de forma anônima sem exigir autenticação', async () => {
    const authService = { obterSessao: jest.fn().mockResolvedValue({ usuario: null }) };
    const controller = new AuthController(authService as any);

    await expect(controller.session({ cookies: {} }, {} as any)).resolves.toEqual({ usuario: null });
    expect(authService.obterSessao).toHaveBeenCalledWith(undefined);
  });
});
