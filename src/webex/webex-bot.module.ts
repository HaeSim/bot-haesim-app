import { Module } from '@nestjs/common';
import { WebexBotController } from './webex-bot.controller';
import { WebexBotService } from './services/webex-bot.service';
import { CommandRegistryService } from './services/command-registry.service';
import { GreetingCommand } from './commands/greeting.command';
import { HelpCommand } from './commands/help.command';
import { TimeCommand } from './commands/time.command';
import { DefaultCommand } from './commands/default.command';

@Module({
  controllers: [WebexBotController],
  providers: [
    WebexBotService,
    CommandRegistryService,
    GreetingCommand,
    HelpCommand,
    TimeCommand,
    DefaultCommand,
  ],
  exports: [WebexBotService],
})
export class WebexBotModule {}
