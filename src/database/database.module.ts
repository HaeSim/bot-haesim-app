import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'oracle',
        username: configService.get<string>('DB_USERNAME', 'ADMIN'),
        password: configService.get<string>('DB_PASSWORD'),
        // TLS 연결 문자열 (포트 1521 사용)
        connectString: `(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1521)(host=adb.ap-chuncheon-1.oraclecloud.com))(connect_data=(service_name=gbf7daacac132c8_botdb_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))`,
        // 로컬 개발 환경에서도 synchronize를 false로 설정하여 스키마 충돌 방지
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') !== 'production',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        // TLS 설정
        ssl: true,
        // extra 옵션에서 walletLocation 제거
        extra: {},
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
