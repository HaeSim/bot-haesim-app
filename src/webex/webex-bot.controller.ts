import { Controller, Post, Body, Logger } from '@nestjs/common';
import { WebexBotService } from './webex-bot.service';

interface WebhookData {
  id: string;
  name: string;
  targetUrl: string;
  resource: string;
  event: string;
  orgId: string;
  createdBy: string;
  appId: string;
  ownedBy: string;
  status: string;
  created: string;
  actorId: string;
  data: {
    id: string;
    personId: string;
    roomId: string;
    roomType: string;
    personEmail: string;
    created: string;
  };
}

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
