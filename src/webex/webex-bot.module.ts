import { Module } from '@nestjs/common';
import { WebexBotController } from './webex-bot.controller';
import { WebexBotService } from './webex-bot.service';

@Module({
  controllers: [WebexBotController],
  providers: [WebexBotService],
  exports: [WebexBotService],
})
export class WebexBotModule {}
