import { Module } from '@nestjs/common';
import { WebexBotController } from './webex-bot.controller';
import { WebexBotService } from './webex-bot.service';
import { WebexCommands } from './webex-commands';

@Module({
  controllers: [WebexBotController],
  providers: [WebexBotService, WebexCommands],
  exports: [WebexBotService],
})
export class WebexBotModule {}
