import { Injectable, Logger } from '@nestjs/common';
import { Command, Bot, Trigger } from './interfaces/webex-types';
import { MessagesService } from '../messages/messages.service';

// 오류 처리를 위한 타입 정의
interface ErrorWithMessage {
  message: string;
}

@Injectable()
export class WebexCommands {
  private readonly logger = new Logger(WebexCommands.name);
  private commands: Command[] = [];

  constructor(private messagesService: MessagesService) {
    // 기본 명령어 등록
    this.registerCommand(this.createHelpCommand());
    this.registerCommand(this.createEchoCommand());
    this.registerCommand(this.createGreetingCommand());

    // 데이터베이스 관련 명령어
    this.registerCommand(this.createHistoryCommand());
    this.registerCommand(this.createSaveMessageCommand());
  }

  /**
   * 명령어 등록
   */
  registerCommand(command: Command): void {
    this.commands.push(command);
  }

  /**
   * 모든 명령어 반환
   */
  getCommands(): Command[] {
    return this.commands;
  }

  /**
   * 입력 텍스트와 매칭되는 명령어 찾기
   */
  findMatchingCommand(text: string): Command | undefined {
    for (const command of this.commands) {
      if (typeof command.pattern === 'string') {
        if (text.toLowerCase() === command.pattern.toLowerCase()) {
          return command;
        }
      } else if (command.pattern instanceof RegExp) {
        if (command.pattern.test(text)) {
          return command;
        }
      }
    }
    return undefined;
  }

  /**
   * 도움말 명령어 생성
   */
  private createHelpCommand(): Command {
    return {
      pattern: /^help$/i,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      execute: async (bot: Bot, _trigger: Trigger): Promise<void> => {
        // _trigger로 변경하여 미사용 변수 ESLint 경고 해결
        let helpText = '## 사용 가능한 명령어\n\n';

        // 모든 명령어의 도움말 추가
        for (const command of this.commands) {
          const pattern =
            typeof command.pattern === 'string'
              ? command.pattern
              : command.pattern.toString();
          helpText += `- **${pattern}**: ${command.helpText}\n`;
        }

        await bot.say(helpText);
      },
      helpText: '사용 가능한 모든 명령어 목록을 보여줍니다.',
      priority: 1000,
    };
  }

  /**
   * 에코 명령어 생성
   */
  private createEchoCommand(): Command {
    return {
      pattern: /^echo (.+)$/i,
      execute: async (bot: Bot, trigger: Trigger): Promise<void> => {
        const match = trigger.text.match(/^echo (.+)$/i);
        if (match && match[1]) {
          await bot.say(`에코: ${match[1]}`);
        } else {
          await bot.say('에코할 텍스트를 입력해주세요. 예: echo 안녕하세요');
        }
      },
      helpText: '입력한 메시지를 그대로 반환합니다. 예: echo 안녕하세요',
      priority: 0,
    };
  }

  /**
   * 인사 명령어 생성
   */
  private createGreetingCommand(): Command {
    return {
      pattern: /^(안녕|hello|hi)$/i,
      execute: async (bot: Bot, trigger: Trigger): Promise<void> => {
        const userName = trigger.person.displayName || '사용자';
        const currentHour = new Date().getHours();

        let greeting = '';
        if (currentHour < 12) {
          greeting = '좋은 아침이에요';
        } else if (currentHour < 18) {
          greeting = '안녕하세요';
        } else {
          greeting = '좋은 저녁이에요';
        }

        await bot.say(`${greeting}, ${userName}님! 무엇을 도와드릴까요?`);

        // 메시지 저장 (선택적)
        try {
          await this.messagesService.create(
            trigger.text,
            trigger.person.email,
            bot.room.id || 'unknown',
          );
        } catch (error: unknown) {
          const err = error as ErrorWithMessage;
          this.logger.warn(`메시지 저장 실패: ${err.message}`);
          // 사용자에게 에러를 보여주지 않음 (무음 실패)
        }
      },
      helpText: '인사를 합니다.',
      priority: 0,
    };
  }

  /**
   * 히스토리 명령어 생성
   */
  private createHistoryCommand(): Command {
    return {
      pattern: /^history$/i,
      execute: async (bot: Bot, trigger: Trigger): Promise<void> => {
        try {
          // 현재 명령어도 저장
          await this.messagesService.create(
            trigger.text,
            trigger.person.email,
            bot.room.id || 'unknown',
          );

          // 대화 내역 조회
          const messages = await this.messagesService.findByRoomId(
            bot.room.id || 'unknown',
          );

          if (messages.length === 0) {
            await bot.say('이전 대화 내역이 없습니다.');
            return;
          }

          let response = '## 최근 대화 내역\n\n';
          for (const msg of messages) {
            response += `- **${new Date(msg.createdAt).toLocaleString()}**: ${msg.TEXT} (${msg.userId})\n`;
          }

          await bot.say(response);
        } catch (error: unknown) {
          const err = error as ErrorWithMessage;
          this.logger.error(`대화 내역 조회 오류: ${err.message}`);
          await bot.say('대화 내역을 조회하는 중 오류가 발생했습니다.');
        }
      },
      helpText: '최근 대화 내역을 보여줍니다.',
      priority: 0,
    };
  }

  /**
   * 메시지 저장 명령어 생성
   */
  private createSaveMessageCommand(): Command {
    return {
      pattern: /^save (.+)$/i,
      execute: async (bot: Bot, trigger: Trigger): Promise<void> => {
        try {
          // 정규식에서 텍스트 추출
          const match = trigger.text.match(/^save (.+)$/i);
          if (!match || !match[1]) {
            await bot.say(
              '저장할 메시지를 입력해주세요. 예: save 중요한 메시지',
            );
            return;
          }

          const messageText = match[1];

          // 메시지 저장
          const savedMessage = await this.messagesService.create(
            messageText,
            trigger.person.email,
            bot.room.id || 'unknown',
          );

          await bot.say({
            markdown: `메시지가 저장되었습니다: "${messageText}"\n\nID: ${savedMessage.ID}`,
          });
        } catch (error: unknown) {
          const err = error as ErrorWithMessage;
          this.logger.error(`메시지 저장 오류: ${err.message}`);
          await bot.say('메시지 저장 중 오류가 발생했습니다.');
        }
      },
      helpText: '메시지를 데이터베이스에 저장합니다. 예: save 중요한 메시지',
      priority: 0,
    };
  }
}
