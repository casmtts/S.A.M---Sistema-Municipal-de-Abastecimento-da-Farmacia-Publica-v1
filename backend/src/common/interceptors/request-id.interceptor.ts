import { randomUUID } from 'crypto';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    const requestId = randomUUID();
    request.requestId = requestId;
    response.setHeader('X-Request-Id', requestId);
    return next.handle();
  }
}
