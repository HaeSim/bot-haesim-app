import { Injectable, Logger } from '@nestjs/common';
import { Command, Bot, Trigger } from '../interfaces/webex-types';
import { MessagesService } from '../../messages/messages.service';

// 오류 처리를 위한 타입 정의
interface ErrorWithMessage {
  message: string;
}

@Injectable()
export class CommandsService {
  private readonly logger = new Logger(CommandsService.name);
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
    this.logger.log(`명령어 등록됨: ${command.pattern}`);
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
    // 정규표현식 패턴 먼저 검사
    for (const command of this.commands) {
      if (command.pattern instanceof RegExp && command.pattern.test(text)) {
        return command;
      }
    }

    // 문자열 패턴 검사
    for (const command of this.commands) {
      if (
        typeof command.pattern === 'string' &&
        text.toLowerCase().includes(command.pattern.toLowerCase())
      ) {
        return command;
      }
    }

    return undefined;
  }

  /**
   * 도움말 명령어 생성
   */
  private createHelpCommand(): Command {
    return {
      pattern: /^\/도움말|\/help$/i,
      execute: async (bot: Bot): Promise<string> => {
        const helpText = this.commands
          .map((cmd) => {
            const pattern =
              cmd.pattern instanceof RegExp
                ? cmd.pattern.toString()
                : `"${cmd.pattern}"`;
            return `- ${pattern}: ${cmd.helpText}`;
          })
          .join('\n');

        return `# 사용 가능한 명령어\n${helpText}`;
      },
      helpText: '사용 가능한 모든 명령어 목록을 표시합니다.',
      priority: 1000,
    };
  }

  /**
   * 에코 명령어 생성
   */
  private createEchoCommand(): Command {
    return {
      pattern: /^\/에코|\/echo\s+(.+)$/i,
      execute: async (bot: Bot, trigger: Trigger): Promise<string> => {
        const match = trigger.text.match(/^\/에코|\/echo\s+(.+)$/i);
        if (match && match[1]) {
          return `에코: ${match[1]}`;
        }
        return '에코할 텍스트를 입력해주세요. 예: /에코 안녕하세요';
      },
      helpText: '입력한 텍스트를 그대로 반복합니다. 사용법: /에코 [메시지]',
      priority: 100,
    };
  }

  /**
   * 인사 명령어 생성
   */
  private createGreetingCommand(): Command {
    return {
      pattern: /^안녕|hello|hi$/i,
      execute: async (bot: Bot, trigger: Trigger): Promise<string> => {
        return `안녕하세요, ${trigger.person.displayName}님! 무엇을 도와드릴까요?`;
      },
      helpText: '인사를 합니다.',
      priority: 10,
    };
  }

  /**
   * 히스토리 명령어 생성
   */
  private createHistoryCommand(): Command {
    return {
      pattern: /^\/히스토리|\/history$/i,
      execute: async (bot: Bot, trigger: Trigger): Promise<string> => {
        try {
          if (!bot.room.id) {
            return '대화방 ID를 확인할 수 없습니다.';
          }

          const messages = await this.messagesService.findByRoomId(bot.room.id);

          if (messages.length === 0) {
            return '이 대화방에 저장된 메시지가 없습니다.';
          }

          const formattedMessages = messages
            .map(
              (msg) =>
                `- ${new Date(msg.createdAt).toLocaleString()}: ${msg.TEXT}`,
            )
            .join('\n');

          return `# 이 대화방의 메시지 히스토리\n${formattedMessages}`;
        } catch (err) {
          const error = err as ErrorWithMessage;
          this.logger.error(`히스토리 명령어 실행 중 오류: ${error.message}`);
          throw new Error(
            `메시지 히스토리를 가져오는 중 오류가 발생했습니다: ${error.message}`,
          );
        }
      },
      helpText: '현재 대화방의 메시지 히스토리를 표시합니다.',
      priority: 50,
    };
  }

  /**
   * 메시지 저장 명령어 생성
   */
  private createSaveMessageCommand(): Command {
    return {
      pattern: /^\/저장|\/save\s+(.+)$/i,
      execute: async (bot: Bot, trigger: Trigger): Promise<string> => {
        try {
          const match = trigger.text.match(/^\/저장|\/save\s+(.+)$/i);
          if (!match || !match[1]) {
            return '저장할 메시지를 입력해주세요. 예: /저장 중요한 메모';
          }

          if (!bot.room.id) {
            return '대화방 ID를 확인할 수 없습니다.';
          }

          const message = match[1];
          await this.messagesService.create(
            message,
            trigger.person.email,
            bot.room.id,
          );

          return `메시지가 성공적으로 저장되었습니다: "${message}"`;
        } catch (err) {
          const error = err as ErrorWithMessage;
          this.logger.error(`저장 명령어 실행 중 오류: ${error.message}`);
          throw new Error(
            `메시지 저장 중 오류가 발생했습니다: ${error.message}`,
          );
        }
      },
      helpText: '메시지를 데이터베이스에 저장합니다. 사용법: /저장 [메시지]',
      priority: 50,
    };
  }
}
