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
        connectString: `(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1521)(host=adb.ap-chuncheon-1.oraclecloud.com))(connect_data=(service_name=gbf7daacac132c8_botdb_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))`,
        username: configService.get<string>('DB_USERNAME', 'ADMIN'),
        password: configService.get<string>('DB_PASSWORD'),
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') !== 'production',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        // TLS 설정
        ssl: true,
        extra: {
          // TLS를 사용하지만 지갑 파일은 사용하지 않음
          // walletLocation: null,
        },
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
