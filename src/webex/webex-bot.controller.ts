import { Controller, Post, Body, Logger } from '@nestjs/common';
import { WebexBotService } from './services/webex-bot.service';
import { WebhookData } from './interfaces/webex-bot.interface';

@Controller('webhook')
export class WebexBotController {
  private readonly logger = new Logger(WebexBotController.name);

  constructor(private readonly webexBotService: WebexBotService) {}

  @Post()
  async handleWebhook(@Body() webhookData: WebhookData): Promise<any> {
    this.logger.log(`웹훅 수신: ${JSON.stringify(webhookData)}`);

    try {
      // 웹훅 데이터 처리
      return await this.webexBotService.processWebhook(webhookData);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`웹훅 처리 중 오류 발생: ${err.message}`);
      throw error;
    }
  }
}
