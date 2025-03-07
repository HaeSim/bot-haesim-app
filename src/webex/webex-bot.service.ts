import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Framework from 'webex-node-bot-framework';
import axios from 'axios';

// Framework 타입 정의
interface Bot {
  say: (message: any) => Promise<any>;
  room: {
    title: string;
  };
}

interface TriggerPerson {
  displayName: string;
  email: string;
}

interface Trigger {
  person: TriggerPerson;
  text: string;
  message: {
    text: string;
  };
}

interface WebhookData {
  data: {
    id: string;
    personId: string;
    roomId: string;
  };
}

interface MessageDetails {
  text: string;
  personEmail: string;
}

// Framework 클래스에 대한 타입 정의
interface WebexFramework {
  start: () => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  hears: (
    phrase: string | RegExp,
    callback: (bot: Bot, trigger: Trigger) => void,
    helpText?: string,
    priority?: number,
  ) => void;
}

@Injectable()
export class WebexBotService implements OnModuleInit {
  private readonly logger = new Logger(WebexBotService.name);
  private framework: WebexFramework;
  private readonly apiUrl = 'https://webexapis.com/v1';

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('BOT_ACCESS_TOKEN');

    if (!token) {
      this.logger.error('BOT_ACCESS_TOKEN 환경 변수가 설정되지 않았습니다.');
      throw new Error('BOT_ACCESS_TOKEN 환경 변수가 필요합니다.');
    }

    // Framework 설정
    const config = {
      token: token,
      webhookUrl: this.configService.get<string>('DOMAIN_NAME')
        ? `https://${this.configService.get<string>('DOMAIN_NAME')}/webhook`
        : undefined,
      // Webhook을 사용하지 않고 웹소켓 사용 시에는 webhookUrl을 제공하지 않습니다
    };

    // Framework 인스턴스 생성 시 타입 캐스팅
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.framework = new Framework(config) as unknown as WebexFramework;

    // 기본 이벤트 핸들러 등록
    this.setupFrameworkListeners();
  }

  onModuleInit() {
    // 프레임워크 시작
    this.framework
      .start()
      .then(() => {
        this.logger.log('Webex Bot 프레임워크가 시작되었습니다.');
      })
      .catch((err: Error) => {
        this.logger.error(`Webex Bot 프레임워크 시작 실패: ${err.message}`);
      });
  }

  private setupFrameworkListeners() {
    // 초기화 완료 이벤트
    this.framework.on('initialized', () => {
      this.logger.log('프레임워크가 성공적으로 초기화되었습니다!');
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

    // 명령어 처리
    this.framework.hears(
      '안녕',
      (bot: Bot, trigger: Trigger) => {
        void bot.say(
          `안녕하세요! ${trigger.person.displayName}님. 무엇을 도와드릴까요?`,
        );
      },
      '**안녕** - 인사하기',
    );

    this.framework.hears(
      '도움말',
      (bot: Bot) => {
        void bot.say(
          '다음 명령어를 사용할 수 있습니다:\n- 안녕: 인사하기\n- 도움말: 도움말 보기\n- 시간: 현재 시간 확인하기',
        );
      },
      '**도움말** - 사용 가능한 명령어 확인',
    );

    this.framework.hears(
      '시간',
      (bot: Bot) => {
        const now = new Date();
        void bot.say(`현재 시간은 ${now.toLocaleString('ko-KR')} 입니다.`);
      },
      '**시간** - 현재 시간 확인',
    );

    // 예상치 못한 입력 처리
    this.framework.hears(
      /.*/,
      (bot: Bot) => {
        void bot.say(
          '죄송합니다. 이해하지 못했습니다. "도움말"을 입력하시면 사용 가능한 명령어를 확인할 수 있습니다.',
        );
      },
      undefined,
      99999,
    );
  }

  processWebhook(webhookData: WebhookData): Promise<any> {
    // async 키워드 제거
    this.logger.log(`웹훅 처리: ${JSON.stringify(webhookData)}`);
    return Promise.resolve({ status: 'success' });
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
}
