import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      message: this.messageFor(status),
    });
  }

  private messageFor(status: number) {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Verifique os dados informados e tente novamente.';
      case HttpStatus.UNAUTHORIZED:
        return 'Não foi possível autenticar ou acessar este recurso.';
      case HttpStatus.FORBIDDEN:
        return 'Você não tem permissão para realizar esta ação.';
      case HttpStatus.NOT_FOUND:
        return 'O recurso solicitado não foi encontrado.';
      case HttpStatus.CONFLICT:
        return 'Já existe um cadastro com esses dados.';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.';
      default:
        return 'Não foi possível concluir a operação agora. Tente novamente mais tarde.';
    }
  }
}
