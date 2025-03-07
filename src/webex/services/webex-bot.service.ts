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
} from '../interfaces/webex-bot.interface';
import { CommandRegistryService } from './command-registry.service';
import { GreetingCommand } from '../commands/greeting.command';
import { HelpCommand } from '../commands/help.command';
import { TimeCommand } from '../commands/time.command';
import { DefaultCommand } from '../commands/default.command';

@Injectable()
export class WebexBotService implements OnModuleInit {
  private readonly logger = new Logger(WebexBotService.name);
  private framework: WebexFramework;
  private readonly apiUrl = 'https://webexapis.com/v1';

  constructor(
    private configService: ConfigService,
    private commandRegistry: CommandRegistryService,
    private greetingCommand: GreetingCommand,
    private helpCommand: HelpCommand,
    private timeCommand: TimeCommand,
    private defaultCommand: DefaultCommand,
  ) {
    const token = this.configService.get<string>('BOT_ACCESS_TOKEN');

    if (!token) {
      this.logger.error('BOT_ACCESS_TOKEN 환경 변수가 설정되지 않았습니다.');
      throw new Error('BOT_ACCESS_TOKEN 환경 변수가 필요합니다.');
    }

    // 봇 ID 로깅
    const botId = this.configService.get<string>('BOT_ID');
    this.logger.log(`설정된 BOT_ID: ${botId || '설정되지 않음'}`);

    // 도메인 설정 로깅
    const domainName = this.configService.get<string>('DOMAIN_NAME');
    this.logger.log(`설정된 DOMAIN_NAME: ${domainName || '설정되지 않음'}`);

    // Framework 설정
    const config = {
      token: token,
      webhookUrl: this.configService.get<string>('DOMAIN_NAME')
        ? `https://${this.configService.get<string>('DOMAIN_NAME')}/webhook`
        : undefined,
      // Webhook을 사용하지 않고 웹소켓 사용 시에는 webhookUrl을 제공하지 않습니다
    };

    this.logger.log(`Webhook URL: ${config.webhookUrl || '웹소켓 모드 사용'}`);

    // Framework 인스턴스 생성 시 타입 캐스팅
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.framework = new Framework(config) as unknown as WebexFramework;

    // 기본 이벤트 핸들러 등록
    this.setupFrameworkListeners();
  }

  onModuleInit() {
    // 명령어 등록
    this.registerCommands();

    // 프레임워크 시작
    this.framework
      .start()
      .then(() => {
        this.logger.log('Webex Bot 프레임워크가 시작되었습니다.');
        this.logger.log(`봇 ID: ${this.configService.get<string>('BOT_ID')}`);
      })
      .catch((err: Error) => {
        this.logger.error(`Webex Bot 프레임워크 시작 실패: ${err.message}`);
      });
  }

  private registerCommands() {
    // 명령어 등록
    this.commandRegistry.registerCommand(this.greetingCommand);
    this.commandRegistry.registerCommand(this.helpCommand);
    this.commandRegistry.registerCommand(this.timeCommand);
    this.commandRegistry.registerCommand(this.defaultCommand);

    // 프레임워크 설정
    this.commandRegistry.setFramework(this.framework);
  }

  private setupFrameworkListeners() {
    // 초기화 완료 이벤트
    this.framework.on('initialized', () => {
      this.logger.log('프레임워크가 성공적으로 초기화되었습니다!');
    });

    // 디버깅을 위한 추가 이벤트 리스너
    this.framework.on('log', (msg: string) => {
      this.logger.log(`Framework 로그: ${msg}`);
    });

    this.framework.on('error', (err: Error) => {
      this.logger.error(`Framework 오류: ${err.message}`);
    });

    // 메시지 이벤트 추가
    this.framework.on('message', (bot: Bot, trigger: Trigger) => {
      this.logger.log(
        `새 메시지 수신: ${trigger.text} (발신자: ${trigger.person.email})`,
      );
    });

    // 스페이스에 봇이 추가될 때 이벤트
    this.framework.on('spawn', (bot: Bot, id: string, addedBy: string) => {
      if (!addedBy) {
        this.logger.log(
          `이미 존재하는 스페이스에 봇 객체가 생성되었습니다: ${bot.room.title}`,
        );
      } else {
        void bot.say(
          '안녕하세요! 저는 DEAN 봇입니다. 도움이 필요하시면 "도움말"이라고 말씀해주세요.',
        );
      }
    });
  }

  async processWebhook(webhookData: WebhookData): Promise<any> {
    this.logger.log(`웹훅 처리: ${JSON.stringify(webhookData)}`);

    try {
      // 메시지 발신자 로깅
      this.logger.log(`메시지 발신자 ID: ${webhookData.data.personId}`);
      this.logger.log(`봇 ID: ${this.configService.get<string>('BOT_ID')}`);
      this.logger.log(`처리 중인 메시지 ID: ${webhookData.data.id}`);
      this.logger.log(`메시지 룸 ID: ${webhookData.data.roomId}`);
      this.logger.log(`발신자 이메일: ${webhookData.data.personEmail}`);

      // 봇이 보낸 메시지인지 확인 (이메일로 체크)
      if (webhookData.data.personEmail.endsWith('@webex.bot')) {
        this.logger.log('봇이 보낸 메시지이므로 무시합니다.');
        return { status: 'ignored_bot_message' };
      }

      // 메시지 ID를 사용하여 메시지 세부 정보 조회
      const messageDetails = await this.getMessageDetails(webhookData.data.id);
      this.logger.log(`메시지 내용: ${messageDetails.text}`);

      // 사용자 정보 가져오기
      const personDetails = await this.getPersonDetails(
        webhookData.data.personId,
      );
      this.logger.log(
        `사용자 정보: ${personDetails.displayName}(${webhookData.data.personEmail})`,
      );

      // 명령어 처리 및 응답 생성 (비동기)
      const responseText = await this.commandRegistry.processCommand(
        messageDetails.text,
        webhookData.data.roomId,
        webhookData.data.personEmail,
        personDetails.displayName,
      );
      this.logger.log(`생성된 응답: ${responseText}`);

      // Webex API를 사용하여 응답 메시지 전송
      const token = this.configService.get<string>('BOT_ACCESS_TOKEN');
      await axios.post(
        `${this.apiUrl}/messages`,
        {
          roomId: webhookData.data.roomId,
          text: responseText,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      this.logger.log(
        `응답 메시지 전송 완료: ${responseText.substring(0, 50)}${responseText.length > 50 ? '...' : ''}`,
      );

      return { status: 'success' };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`웹훅 처리 중 오류 발생: ${err.message}`);

      // 타입 안전한 방식으로 스택 접근
      if ('stack' in err) {
        this.logger.error(`오류 스택: ${err.stack}`);
      }

      throw error;
    }
  }

  async getMessageDetails(messageId: string): Promise<MessageDetails> {
    try {
      const token = this.configService.get<string>('BOT_ACCESS_TOKEN');
      const response = await axios.get<MessageDetails>(
        `${this.apiUrl}/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`메시지 상세 정보 가져오기 실패: ${err.message}`);
      throw error;
    }
  }

  // 사용자 정보 가져오기 메서드 수정
  async getPersonDetails(personId: string): Promise<PersonDetails> {
    try {
      const token = this.configService.get<string>('BOT_ACCESS_TOKEN');
      const response = await axios.get<PersonDetails>(
        `${this.apiUrl}/people/${personId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`사용자 정보 가져오기 실패: ${err.message}`);
      throw new Error(`사용자 정보 가져오기 실패: ${err.message}`);
    }
  }
}
