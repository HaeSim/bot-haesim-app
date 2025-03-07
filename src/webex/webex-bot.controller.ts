import { Controller, Post, Body, Logger } from '@nestjs/common';
import { WebexBotService } from './webex-bot.service';
import { WebhookData } from './interfaces/webex-types';

@Controller('webex-bot')
export class WebexBotController {
  private readonly logger = new Logger(WebexBotController.name);

  constructor(private readonly webexBotService: WebexBotService) {}

  /**
   * Webex Webhook 요청 처리
   */
  @Post('webhook')
  async handleWebhook(@Body() webhookData: WebhookData): Promise<any> {
    this.logger.log(`Webhook 요청 수신: ${webhookData.id}`);
    return this.webexBotService.processWebhook(webhookData);
  }
}
