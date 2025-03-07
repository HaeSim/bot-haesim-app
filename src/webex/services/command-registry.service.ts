import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Command } from '../interfaces/command.interface';
import { WebexFramework } from '../interfaces/webex-bot.interface';

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
}
