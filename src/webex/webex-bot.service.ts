import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  WebexInfo,
} from './interfaces/webex-types';
import { WebexCommands } from './webex-commands';

@Injectable()
export class WebexBotService implements OnModuleInit {
  private readonly logger = new Logger(WebexBotService.name);
  private framework: WebexFramework;
  private readonly apiUrl = 'https://webexapis.com/v1';

  constructor(
    private configService: ConfigService,
    private webexCommands: WebexCommands,
  ) {
    // 프레임워크 초기화
    const config = {
      webhookUrl: `https://${this.configService.get<string>('DOMAIN_NAME')}/webex-bot/webhook`,
      token: this.configService.get<string>('BOT_ACCESS_TOKEN'),
      removeDeviceRegistrationsOnStart: true,
    };

    this.logger.log(`봇 초기화 - 토큰: ${config.token ? '설정됨' : '없음'}`);
    this.logger.log(`봇 초기화 - Webhook URL: ${config.webhookUrl}`);

    // 타입 안전하게 프레임워크 초기화
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const frameworkInstance = new Framework(config);
    this.framework = frameworkInstance as unknown as WebexFramework;
  }

  onModuleInit() {
    this.setupFrameworkListeners();
    this.registerCommandsToFramework();

    // 프레임워크 시작
    this.framework
      .start()
      .then(() => {
        this.logger.log('Webex Bot 프레임워크가 시작되었습니다.');
      })
      .catch((err: ErrorWithMessage) => {
        this.logger.error(`Webex Bot 프레임워크 시작 실패: ${err.message}`);
      });
  }

  /**
   * 명령어 등록
   */
  private registerCommandsToFramework() {
    const commands = this.webexCommands.getCommands();

    for (const command of commands) {
      this.framework.hears(
        command.pattern,
        // Promise를 반환하지 않도록 수정
        (bot: Bot, trigger: Trigger) => {
          // 비동기 처리를 void 컨텍스트에서 처리
          void (async () => {
            try {
              await command.execute(bot, trigger);
            } catch (error) {
              // 에러 객체 타입 처리
              const err = error as ErrorWithMessage;
              this.logger.error(
                `명령어 실행 오류 (${command.helpText}): ${err.message}`,
              );
              await bot.say('명령어 처리 중 오류가 발생했습니다.');
            }
          })();
        },
        command.helpText,
        command.priority,
      );
    }
  }

  /**
   * 프레임워크 이벤트 리스너 설정
   */
  private setupFrameworkListeners() {
    // Initialized 이벤트 핸들러
    this.framework.on('initialized', () => {
      this.logger.log(
        `프레임워크가 초기화되었습니다. ${this.framework['email']}에 연결됨`,
      );
    });

    // 스토리지 싱크 이벤트 핸들러
    this.framework.on('storage-sync', () => {
      this.logger.log('프레임워크 스토리지 동기화됨');
    });

    // 에러 이벤트 핸들러
    this.framework.on('error', (err: ErrorWithMessage) => {
      this.logger.error(`프레임워크 에러: ${err.message}`);
    });

    // 스파크 클라이언트 에러 핸들러
    this.framework.on('spawn', (bot, framework, info: WebexInfo) => {
      // info 객체가 존재하고 personDisplayName 속성이 있는 경우에만 로그 출력
      if (info?.personDisplayName) {
        this.logger.log(
          `새로운 Bot 객체 생성됨, 사용자: ${info.personDisplayName}`,
        );
      } else {
        this.logger.log('새로운 Bot 객체 생성됨');
      }
    });
  }

  /**
   * Webhook 데이터 처리
   */
  async processWebhook(webhookData: WebhookData): Promise<any> {
    try {
      // 메시지 세부 정보 가져오기
      const messageDetails = await this.getMessageDetails(webhookData.data.id);

      // 사용자 세부 정보 가져오기
      const personDetails = await this.getPersonDetails(
        webhookData.data.personId,
      );

      // 인커밍 메시지 로깅
      this.logger.log(
        `메시지 받음: "${messageDetails.text}" from ${personDetails.displayName}`,
      );

      // 봇이 보낸 메시지는 무시
      if (messageDetails.personEmail === this.framework['email']) {
        this.logger.log('봇 자신이 보낸 메시지 무시됨');
        return { status: 'ignored' };
      }

      // 메시지에 해당하는 명령어 찾기
      const command = this.webexCommands.findMatchingCommand(
        messageDetails.text,
      );

      if (command) {
        // 수동으로 트리거 및 봇 객체 생성
        const trigger: Trigger = {
          person: {
            displayName: personDetails.displayName,
            email: personDetails.emails[0],
          },
          text: messageDetails.text,
          message: {
            text: messageDetails.text,
          },
        };

        const bot: Bot = {
          say: async (message): Promise<MessageResponse> => {
            return this.sendMessage(webhookData.data.roomId, message);
          },
          room: {
            title: 'Direct Message',
            id: webhookData.data.roomId,
          },
        };

        // 명령어 실행
        try {
          await command.execute(bot, trigger);
          return { status: 'success' };
        } catch (error) {
          const err = error as ErrorWithMessage;
          this.logger.error(`명령어 실행 오류: ${err.message}`);
          await bot.say('명령어 처리 중 오류가 발생했습니다.');
          return { status: 'error', error: err.message };
        }
      }

      return { status: 'ignored' };
    } catch (error) {
      const err = error as ErrorWithMessage;
      this.logger.error(`Webhook 처리 오류: ${err.message}`);
      return { status: 'error', error: err.message };
    }
  }

  /**
   * 메시지 전송
   */
  private async sendMessage(
    roomId: string,
    message: string | Record<string, unknown>,
  ): Promise<MessageResponse> {
    try {
      const headers = {
        Authorization: `Bearer ${this.configService.get<string>('BOT_ACCESS_TOKEN')}`,
      };

      const payload: Record<string, unknown> = {
        roomId,
      };

      if (typeof message === 'string') {
        payload.text = message;
      } else {
        payload.markdown = message;
      }

      const response = await axios.post<MessageResponse>(
        `${this.apiUrl}/messages`,
        payload,
        {
          headers,
        },
      );
      return response.data;
    } catch (error) {
      const err = error as ErrorWithMessage;
      this.logger.error(`메시지 전송 오류: ${err.message}`);
      throw error;
    }
  }

  /**
   * 메시지 세부 정보 가져오기
   */
  async getMessageDetails(messageId: string): Promise<MessageDetails> {
    try {
      const headers = {
        Authorization: `Bearer ${this.configService.get<string>('BOT_ACCESS_TOKEN')}`,
      };

      const response = await axios.get<MessageResponse>(
        `${this.apiUrl}/messages/${messageId}`,
        {
          headers,
        },
      );

      return {
        text: response.data.text || '',
        personEmail: response.data.personEmail || '',
      };
    } catch (error) {
      const err = error as ErrorWithMessage;
      this.logger.error(`메시지 세부 정보 조회 오류: ${err.message}`);
      throw error;
    }
  }

  /**
   * 사용자 세부 정보 가져오기
   */
  async getPersonDetails(personId: string): Promise<PersonDetails> {
    try {
      const headers = {
        Authorization: `Bearer ${this.configService.get<string>('BOT_ACCESS_TOKEN')}`,
      };

      const response = await axios.get<PersonResponse>(
        `${this.apiUrl}/people/${personId}`,
        {
          headers,
        },
      );

      return {
        id: response.data.id,
        emails: response.data.emails || [],
        displayName: response.data.displayName || '',
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        avatar: response.data.avatar,
        orgId: response.data.orgId,
        created: response.data.created,
      };
    } catch (error) {
      const err = error as ErrorWithMessage;
      this.logger.error(`사용자 세부 정보 조회 오류: ${err.message}`);
      throw error;
    }
  }
}
