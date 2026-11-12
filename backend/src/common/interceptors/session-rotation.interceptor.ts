import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../../modules/auth/auth.service';
import { SESSION_COOKIE, sessionRotateSeconds, setSessionCookie } from '../utils/session-cookie.util';

/**
 * Rotaciona o cookie de sessão: depois de 10 minutos (SESSION_ROTATE_SECONDS) de
 * emissão, a próxima requisição autenticada bem-sucedida recebe um token novo.
 * O token antigo continua válido só até expirar; a vida máxima absoluta da sessão
 * (authAt) nunca é estendida, e papel/permissões são relidos do banco a cada requisição.
 */
@Injectable()
export class SessionRotationInterceptor implements NestInterceptor {
  constructor(private readonly auth: AuthService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();

    return next.handle().pipe(
      tap(() => {
        const user = request.user;
        if (!user?.iat || !request.cookies?.[SESSION_COOKIE]) return;
        if (response.headersSent) return;
        // Login, troca de senha e logout já definem/limpam o cookie por conta própria.
        const setCookie = response.getHeader('Set-Cookie');
        if (setCookie && String(setCookie).includes(`${SESSION_COOKIE}=`)) return;
        const ageSeconds = Math.floor(Date.now() / 1000) - user.iat;
        if (ageSeconds < sessionRotateSeconds()) return;
        setSessionCookie(response, this.auth.assinarSessao(user, user.authAt));
      }),
    );
  }
}
