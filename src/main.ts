// 가장 먼저 패치 파일을 가져옵니다
import './webex-patch';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // JSON 요청 처리를 위한 bodyParser 설정
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  // 환경 변수에서 포트 가져오기, 없으면 3000 사용
  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`애플리케이션 실행 중: http://localhost:${port}`);
}
void bootstrap();
