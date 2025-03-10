import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

/**
 * 요청 인증을 확인하는 가드
 * Authorization 헤더에 유효한 토큰이 있는지 확인합니다.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    // 토큰 포맷 확인 (Bearer 토큰 형식)
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('유효하지 않은 인증 토큰 형식입니다.');
    }

    try {
      // 여기서 토큰을 검증하는 로직 추가
      // 예: this.jwtService.verify(token);

      // 사용자 정보를 요청 객체에 설정
      request['user'] = { id: 1, email: 'example@example.com' };

      return true;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류';
      this.logger.error(`인증 오류: ${errorMessage}`);
      throw new UnauthorizedException('유효하지 않은 인증 토큰입니다.');
    }
  }
}
