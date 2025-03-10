import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * 요청과 응답에 대한 로깅을 처리하는 인터셉터
 * 요청 처리 시간을 측정하고 로그를 남깁니다.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const now = Date.now();

    // 요청 시작 로그
    this.logger.log(
      `요청: ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - now;
          // 응답 완료 로그
          this.logger.log(
            `응답: ${method} ${url} - 상태코드: ${response.statusCode} - ${responseTime}ms`,
          );
        },
        error: (error: Error) => {
          const responseTime = Date.now() - now;
          // 오류 로그
          this.logger.error(
            `오류: ${method} ${url} - 상태코드: ${response.statusCode} - ${responseTime}ms`,
            error.stack,
          );
        },
      }),
    );
  }
}
