import { lastValueFrom, of } from 'rxjs';
import { SessionRotationInterceptor } from './session-rotation.interceptor';

function contexto(request: any, response: any) {
  return { getType: () => 'http', switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as any;
}

describe('SessionRotationInterceptor', () => {
  const agora = () => Math.floor(Date.now() / 1000);
  const auth = { assinarSessao: jest.fn().mockReturnValue('novo-token') };
  const interceptor = new SessionRotationInterceptor(auth as any);
  const resposta = () => ({ headersSent: false, getHeader: jest.fn().mockReturnValue(undefined), cookie: jest.fn() });
  const usuario = (idadeSegundos: number) => ({ id: 'u1', email: 'a@b.gov', role: 'ADMIN', tokenVersion: 1, iat: agora() - idadeSegundos, authAt: agora() - 100 });

  beforeEach(() => auth.assinarSessao.mockClear());

  it('não rotaciona antes de 10 minutos', async () => {
    const res = resposta();
    await lastValueFrom(interceptor.intercept(contexto({ user: usuario(599), cookies: { sam_session: 'x' } }, res), { handle: () => of('ok') }));
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('emite token novo com cookie HttpOnly a partir de 10 minutos, preservando authAt', async () => {
    const res = resposta();
    const user = usuario(601);
    await lastValueFrom(interceptor.intercept(contexto({ user, cookies: { sam_session: 'x' } }, res), { handle: () => of('ok') }));
    expect(auth.assinarSessao).toHaveBeenCalledWith(user, user.authAt);
    expect(res.cookie).toHaveBeenCalledWith('sam_session', 'novo-token', expect.objectContaining({ httpOnly: true, sameSite: 'strict' }));
  });

  it('não sobrescreve cookie já definido ou limpo pelo handler (login, senha, logout)', async () => {
    const res = resposta();
    res.getHeader.mockReturnValue(['sam_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT']);
    await lastValueFrom(interceptor.intercept(contexto({ user: usuario(900), cookies: { sam_session: 'x' } }, res), { handle: () => of('ok') }));
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('ignora rotas públicas (sem usuário autenticado)', async () => {
    const res = resposta();
    await lastValueFrom(interceptor.intercept(contexto({ cookies: {} }, res), { handle: () => of('ok') }));
    expect(res.cookie).not.toHaveBeenCalled();
  });
});
