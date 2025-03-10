import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * 요청에 대한 기본 로깅을 담당하는 미들웨어
 * 요청이 들어올 때마다 로그를 기록합니다.
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';

    // 요청이 완료되면 로그 기록
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;

      // 상태 코드에 따라 로그 레벨 조정
      if (statusCode >= 500) {
        this.logger.error(
          `${method} ${originalUrl} ${statusCode} - ${contentLength} - ${userAgent} ${ip}`,
        );
      } else if (statusCode >= 400) {
        this.logger.warn(
          `${method} ${originalUrl} ${statusCode} - ${contentLength} - ${userAgent} ${ip}`,
        );
      } else {
        this.logger.log(
          `${method} ${originalUrl} ${statusCode} - ${contentLength} - ${userAgent} ${ip}`,
        );
      }
    });

    next();
  }
}
