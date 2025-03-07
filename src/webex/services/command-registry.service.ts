import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Command } from '../interfaces/command.interface';
import { WebexFramework } from '../interfaces/webex-bot.interface';
import { Bot, Trigger } from '../interfaces/webex-bot.interface';

@Injectable()
export class CommandRegistryService implements OnModuleInit {
  private readonly logger = new Logger(CommandRegistryService.name);
  private commands: Command[] = [];
  private framework: WebexFramework | null = null;

  constructor() {}

  onModuleInit() {
    this.logger.log('CommandRegistryService가 초기화되었습니다.');
  }

  registerCommand(command: Command): void {
    this.commands.push(command);
    this.logger.log(`명령어 등록됨: ${command.getHelpText()}`);

    // 프레임워크가 이미 설정되어 있으면 명령어 등록
    if (this.framework) {
      this.registerCommandToFramework(command);
    }
  }

  setFramework(framework: WebexFramework): void {
    this.framework = framework;

    // 프레임워크가 설정되면 모든 명령어 등록
    this.commands.forEach((command) => {
      this.registerCommandToFramework(command);
    });
  }

  private registerCommandToFramework(command: Command): void {
    if (!this.framework) {
      this.logger.warn('프레임워크가 설정되지 않았습니다.');
      return;
    }

    this.framework.hears(
      command.getPattern(),
      (bot, trigger) => {
        void command.execute(bot, trigger);
      },
      command.getHelpText(),
      command.getPriority(),
    );

    this.logger.log(`프레임워크에 명령어 등록됨: ${command.getHelpText()}`);
  }

  getCommands(): Command[] {
    return [...this.commands];
  }

  generateResponse(message: string): string {
    message = message.trim().toLowerCase();

    for (const command of this.commands) {
      const pattern = command.getPattern();

      if (
        typeof pattern === 'string' &&
        message.includes(pattern.toLowerCase())
      ) {
        const response = `명령어 ${pattern}에 응답합니다.`;
        return response;
      } else if (pattern instanceof RegExp && pattern.test(message)) {
        return '알 수 없는 명령어입니다. "도움말"을 입력하세요.';
      }
    }

    return '죄송합니다. 이해하지 못했습니다. "도움말"을 입력하세요.';
  }

  processCommand(
    message: string,
    roomId: string,
    personEmail: string,
    personDisplayName: string,
  ): string {
    message = message.trim().toLowerCase();

    // 명령어 찾기
    for (const command of this.commands) {
      const pattern = command.getPattern();

      if (
        (typeof pattern === 'string' &&
          message.includes(pattern.toLowerCase())) ||
        (pattern instanceof RegExp && pattern.test(message))
      ) {
        // 가상 봇 객체 생성 - Bot 인터페이스에 맞게 타입 지정
        const virtualBot: Bot = {
          say: (text: string | object): Promise<any> => {
            // 실제 Promise를 반환하도록 수정
            return Promise.resolve(
              typeof text === 'string' ? text : JSON.stringify(text),
            );
          },
          room: {
            id: roomId,
            title: '가상 룸', // Bot 인터페이스 요구사항 충족
          },
        };

        // 가상 트리거 객체 생성 - Trigger 인터페이스에 맞게 타입 지정
        const virtualTrigger: Trigger = {
          text: message,
          person: {
            email: personEmail,
            displayName: personDisplayName,
          },
          message: {
            text: message,
          },
        };

        try {
          // 명령어 실행 결과 반환
          const result = command.execute(virtualBot, virtualTrigger);
          if (result instanceof Promise) {
            // Promise를 반환하는 경우 기본 응답 제공
            return `명령어 "${typeof pattern === 'string' ? pattern : '정규식 패턴'}"를 실행 중입니다.`;
          }
          return (
            (result as unknown as string) ||
            `명령어 "${typeof pattern === 'string' ? pattern : '정규식 패턴'}"가 실행되었습니다.`
          );
        } catch (err) {
          // 변수명 변경하여 사용하지 않는 변수 문제 해결
          this.logger.error(
            `명령어 실행 중 오류 발생: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
          );
          return '명령어 실행 중 오류가 발생했습니다.';
        }
      }
    }

    return '죄송합니다. 이해하지 못했습니다. "도움말"을 입력하세요.';
  }
}
