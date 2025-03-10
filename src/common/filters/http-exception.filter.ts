import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// HTTP 예외 응답 타입 정의
interface HttpExceptionResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

/**
 * HTTP 예외를 처리하는 필터
 * 모든 HTTP 예외를 잡아서 일관된 형식의 응답으로 변환합니다.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse() as
      | string
      | HttpExceptionResponse;

    // 로그 남기기
    this.logger.error(
      `HTTP 오류 발생: ${request.method} ${request.url} - ${status}`,
      exception.stack,
    );

    // 응답 변환
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        typeof errorResponse === 'object'
          ? errorResponse.message || '오류가 발생했습니다.'
          : errorResponse || '오류가 발생했습니다.',
    });
  }
}
