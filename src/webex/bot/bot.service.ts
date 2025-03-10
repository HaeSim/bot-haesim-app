import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import * as Framework from 'webex-node-bot-framework';
import axios from 'axios';
import {
  Bot,
  Trigger,
  WebexFramework,
  WebhookData,
  MessageDetails,
  PersonDetails,
  ErrorWithMessage,
  MessageResponse,
  PersonResponse,
  WebexApiResponse,
} from '../interfaces/webex-types';
import { CommandsService } from '../commands/commands.service';

@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);
  private framework: WebexFramework;
  private readonly apiUrl = 'https://webexapis.com/v1';

  constructor(
    private configService: ConfigService,
    private webexCommands: CommandsService,
  ) {
    // Webex 프레임워크 초기화
    const config = {
      token: this.configService.get<string>('BOT_ACCESS_TOKEN'),
      webhookUrl: `https://${this.configService.get<string>('DOMAIN_NAME')}/webex-bot/webhook`,
      removeWebhooksOnStart: true,
    };

    // WebexFramework 타입으로 안전하게 변환
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    this.framework = new Framework(config);
    this.logger.log('Webex Bot 프레임워크 초기화됨');
  }

  onModuleInit() {
    this.setupFrameworkListeners();
    this.registerCommandsToFramework();

    // 프레임워크 시작
    this.framework
      .start()
      .then(() => {
        this.logger.log('Webex Bot 프레임워크 시작됨');
      })
      .catch((err: unknown) => {
        const error = err as ErrorWithMessage;
        this.logger.error(`Webex Bot 프레임워크 시작 실패: ${error.message}`);
      });
  }

  private registerCommandsToFramework() {
    try {
      // 모든 명령어 가져오기
      const commands = this.webexCommands.getCommands();

      // 각 명령어를 프레임워크에 등록
      commands.forEach((command) => {
        this.framework.hears(
          command.pattern,
          (bot: Bot, trigger: Trigger) => {
            void (async () => {
              try {
                this.logger.log(
                  `명령어 실행: ${command.pattern} - 사용자: ${trigger.person.displayName}`,
                );
                const result = await command.execute(bot, trigger);
                if (result) {
                  await bot.say(result);
                }
              } catch (err) {
                const error = err as ErrorWithMessage;
                this.logger.error(
                  `명령어 실행 오류 [${command.pattern}]: ${error.message}`,
                );
                await bot.say(
                  `명령 실행 중 오류가 발생했습니다: ${error.message}`,
                );
              }
            })();
          },
          command.helpText,
          command.priority,
        );
      });

      this.logger.log(`${commands.length}개의 명령어가 등록됨`);
    } catch (err) {
      const error = err as ErrorWithMessage;
      this.logger.error(`명령어 등록 실패: ${error.message}`);
    }
  }

  private setupFrameworkListeners() {
    // 메시지 생성 이벤트 리스너
    this.framework.on('message', (bot: Bot, trigger: Trigger) => {
      void (async () => {
        try {
          // 명령어 매칭 (텍스트가 있을 경우)
          if (trigger.text) {
            const command = this.webexCommands.findMatchingCommand(
              trigger.text,
            );
            if (!command) {
              // 매칭되는 명령어가 없으면 도움말 제안
              this.logger.log(
                `매칭되는 명령어 없음: "${trigger.text}" - 사용자: ${trigger.person.displayName}`,
              );
              await bot.say(
                '이 명령어를 이해할 수 없습니다. "/도움말"을 입력하여 사용 가능한 명령어를 확인하세요.',
              );
            }
          }
        } catch (err) {
          const error = err as ErrorWithMessage;
          this.logger.error(`메시지 처리 오류: ${error.message}`);
        }
      })();
    });

    // 기타 이벤트 리스너...
  }

  async processWebhook(webhookData: WebhookData): Promise<any> {
    try {
      // 웹훅 데이터 기본 검증
      if (!webhookData || !webhookData.data || !webhookData.data.id) {
        this.logger.warn('유효하지 않은 웹훅 데이터');
        return { status: 'error', message: 'Invalid webhook data' };
      }

      // 메시지 세부정보 가져오기
      const messageId = webhookData.data.id;
      const messageDetails = await this.getMessageDetails(messageId);

      if (!messageDetails) {
        this.logger.warn(`메시지 정보를 가져올 수 없음: ${messageId}`);
        return { status: 'error', message: 'Could not get message details' };
      }

      // 봇 자신의 메시지인 경우 무시 (루프 방지)
      try {
        const botDetails = await this.framework.getBotInfo();
        if (messageDetails.personEmail === botDetails.emails[0]) {
          this.logger.debug('봇 자신의 메시지 무시');
          return { status: 'ignored', message: 'Bot message ignored' };
        }
      } catch (err) {
        const error = err as ErrorWithMessage;
        this.logger.error(`봇 정보 가져오기 실패: ${error.message}`);
      }

      // 사용자 세부정보 가져오기
      const personDetails = await this.getPersonDetails(
        webhookData.data.personId,
      );

      // 명령어 처리 로직
      const roomId = webhookData.data.roomId;
      const message = messageDetails.text;

      // 봇 객체 생성
      const bot: Bot = {
        say: async (messageContent) => {
          return this.sendMessage(roomId, messageContent);
        },
        room: {
          title:
            webhookData.data.roomType === 'group' ? '그룹 채팅' : '1:1 채팅',
          id: roomId,
        },
      };

      // 트리거 객체 생성
      const trigger: Trigger = {
        person: {
          displayName: personDetails?.displayName || '알 수 없는 사용자',
          email: personDetails?.emails?.[0] || messageDetails.personEmail,
        },
        text: message,
        message: {
          text: message,
        },
      };

      // 매칭되는 명령어 찾기
      const command = this.webexCommands.findMatchingCommand(message);
      if (command) {
        // 명령어 실행
        this.logger.log(
          `명령어 실행: ${command.pattern} - 사용자: ${trigger.person.displayName}`,
        );
        try {
          const result = await command.execute(bot, trigger);
          if (result) {
            await bot.say(result);
          }
          return { status: 'success', command: command.pattern };
        } catch (err) {
          const error = err as ErrorWithMessage;
          this.logger.error(
            `명령어 실행 오류 [${command.pattern}]: ${error.message}`,
          );
          await bot.say(`명령 실행 중 오류가 발생했습니다: ${error.message}`);
          return { status: 'error', message: error.message };
        }
      } else {
        // 매칭되는 명령어가 없으면 도움말 제안
        this.logger.log(
          `매칭되는 명령어 없음: "${message}" - 사용자: ${trigger.person.displayName}`,
        );
        await bot.say(
          '이 명령어를 이해할 수 없습니다. "/도움말"을 입력하여 사용 가능한 명령어를 확인하세요.',
        );
        return { status: 'unknown_command' };
      }
    } catch (err) {
      const error = err as ErrorWithMessage;
      this.logger.error(`웹훅 처리 오류: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }

  private async sendMessage(
    roomId: string,
    message: string | Record<string, unknown>,
  ): Promise<MessageResponse> {
    try {
      let messagePayload: Record<string, unknown>;

      if (typeof message === 'string') {
        messagePayload = {
          roomId,
          text: message,
        };
      } else {
        messagePayload = {
          roomId,
          ...message,
        };
      }

      const response = await axios.post<MessageResponse>(
        `${this.apiUrl}/messages`,
        messagePayload,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>(
              'WEBEX_BOT_TOKEN',
            )}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (err) {
      const error = err as ErrorWithMessage;
      this.logger.error(`메시지 전송 실패: ${error.message}`);
      throw new Error(`메시지 전송 실패: ${error.message}`);
    }
  }

  async getMessageDetails(messageId: string): Promise<MessageDetails> {
    try {
      const response = await axios.get<
        WebexApiResponse<{
          text: string;
          personEmail: string;
        }>
      >(`${this.apiUrl}/messages/${messageId}`, {
        headers: {
          Authorization: `Bearer ${this.configService.get<string>(
            'WEBEX_BOT_TOKEN',
          )}`,
        },
      });

      return {
        text: response.data.data.text || '',
        personEmail: response.data.data.personEmail,
      };
    } catch (err) {
      const error = err as ErrorWithMessage;
      this.logger.error(`메시지 세부정보 가져오기 실패: ${error.message}`);
      throw new Error(`메시지 세부정보 가져오기 실패: ${error.message}`);
    }
  }

  async getPersonDetails(personId: string): Promise<PersonDetails> {
    try {
      const response = await axios.get<WebexApiResponse<PersonResponse>>(
        `${this.apiUrl}/people/${personId}`,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>(
              'WEBEX_BOT_TOKEN',
            )}`,
          },
        },
      );

      const person: PersonResponse = response.data.data;
      return {
        id: person.id,
        emails: person.emails,
        displayName: person.displayName,
        firstName: person.firstName,
        lastName: person.lastName,
        avatar: person.avatar,
        orgId: person.orgId,
        created: person.created,
      };
    } catch (err) {
      const error = err as ErrorWithMessage;
      this.logger.error(`사용자 세부정보 가져오기 실패: ${error.message}`);
      throw new Error(`사용자 세부정보 가져오기 실패: ${error.message}`);
    }
  }
}
