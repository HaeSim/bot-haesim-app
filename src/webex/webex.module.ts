import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { CommandsModule } from './commands/commands.module';

@Module({
  imports: [BotModule, CommandsModule],
  exports: [BotModule],
})
export class WebexModule {}
