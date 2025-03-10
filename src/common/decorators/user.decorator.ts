import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// 사용자 인터페이스 정의
export interface UserData {
  id: number;
  email: string;
  [key: string]: unknown;
}

/**
 * 요청에서 사용자 정보를 추출하는 데코레이터
 * @example
 * @Get('profile')
 * getProfile(@User() user: UserData) {
 *   return user;
 * }
 */
export const User = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: UserData }>();
    const user = request.user;

    return data && user ? user[data] : user;
  },
);
