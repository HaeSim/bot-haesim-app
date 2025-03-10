import { Module } from '@nestjs/common';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { CommandsModule } from '../commands/commands.module';
import { ConfigModule } from '../../config/config.module';

@Module({
  imports: [CommandsModule, ConfigModule],
  controllers: [BotController],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
