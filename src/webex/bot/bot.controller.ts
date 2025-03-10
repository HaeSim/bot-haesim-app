import { Controller, Post, Body, Logger } from '@nestjs/common';
import { BotService } from './bot.service';
import { WebhookData } from '../interfaces/webex-types';

@Controller('webex-bot')
export class BotController {
  private readonly logger = new Logger(BotController.name);

  constructor(private readonly botService: BotService) {}

  /**
   * Webex Webhook 요청 처리
   */
  @Post('webhook')
  async handleWebhook(@Body() webhookData: WebhookData): Promise<any> {
    this.logger.log(`Webhook 요청 수신: ${webhookData.id}`);
    return this.botService.processWebhook(webhookData);
  }
}
