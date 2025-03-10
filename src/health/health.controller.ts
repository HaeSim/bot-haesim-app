import { Controller, Get } from '@nestjs/common';
import { Connection } from 'typeorm';

// 오류 처리를 위한 타입 정의
interface ErrorWithMessage {
  message: string;
}

@Controller('health')
export class HealthController {
  constructor(private connection: Connection) {}

  @Get()
  getHealth() {
    return { status: 'ok' };
  }

  @Get('db')
  async getDatabaseHealth() {
    try {
      // 데이터베이스 연결 확인
      await this.connection.query('SELECT 1 FROM DUAL');
      return { status: 'ok', message: 'Database connection is healthy' };
    } catch (error: unknown) {
      // 타입 명시 및 안전한 타입 변환
      const err = error as ErrorWithMessage;
      return {
        status: 'error',
        message: 'Database connection failed',
        error: err.message,
      };
    }
  }
}
