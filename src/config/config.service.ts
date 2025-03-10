import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private nestConfigService: NestConfigService) {}

  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.nestConfigService.get<T>(key) || defaultValue;
  }
}
