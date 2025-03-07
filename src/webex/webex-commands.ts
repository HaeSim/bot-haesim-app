import { Injectable } from '@nestjs/common';
import { Command, Bot, Trigger } from './interfaces/webex-types';

@Injectable()
export class WebexCommands {
  private commands: Command[] = [];

  constructor() {
    this.registerCommands();
  }

  private registerCommands(): void {
    // 인사 명령어
    this.commands.push({
      pattern: '안녕',
      execute: async (bot: Bot, trigger: Trigger): Promise<void> => {
        await bot.say(
          `안녕하세요! ${trigger.person.displayName}님. 무엇을 도와드릴까요?`,
        );
      },
      helpText: '**안녕** - 인사하기',
      priority: 10,
    });

    // 도움말 명령어
    this.commands.push({
      pattern: '도움말',
      execute: async (bot: Bot): Promise<void> => {
        const helpTexts = this.commands
          .sort((a, b) => a.priority - b.priority)
          .map((cmd) => cmd.helpText)
          .join('\n');

        await bot.say(`다음 명령어를 사용할 수 있습니다:\n${helpTexts}`);
      },
      helpText: '**도움말** - 사용 가능한 명령어 확인',
      priority: 5,
    });

    // 시간 명령어
    this.commands.push({
      pattern: '시간',
      execute: async (bot: Bot): Promise<void> => {
        const now = new Date();
        await bot.say(`현재 시간은 ${now.toLocaleString('ko-KR')} 입니다.`);
      },
      helpText: '**시간** - 현재 시간 확인',
      priority: 10,
    });

    // 기본 명령어 (아무 명령어도 일치하지 않을 때)
    this.commands.push({
      pattern: /.*/,
      execute: async (bot: Bot, trigger: Trigger): Promise<void> => {
        await bot.say(
          `"${trigger.text}" 명령어를 이해하지 못했습니다. '도움말'을 입력하여 사용 가능한 명령어를 확인하세요.`,
        );
      },
      helpText: '', // 도움말에는 표시되지 않음
      priority: 1000, // 가장 낮은 우선순위
    });
  }

  /**
   * 모든 명령어 반환
   */
  getCommands(): Command[] {
    return this.commands;
  }

  /**
   * 메시지에 맞는 명령어 찾기
   */
  findMatchingCommand(message: string): Command | null {
    const sortedCommands = [...this.commands].sort(
      (a, b) => a.priority - b.priority,
    );

    for (const command of sortedCommands) {
      if (typeof command.pattern === 'string') {
        if (message.includes(command.pattern)) {
          return command;
        }
      } else if (command.pattern instanceof RegExp) {
        if (command.pattern.test(message)) {
          return command;
        }
      }
    }

    return null;
  }
}
