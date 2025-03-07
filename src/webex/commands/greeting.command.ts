import { Injectable } from '@nestjs/common';
import { Command } from '../interfaces/command.interface';
import { Bot, Trigger } from '../interfaces/webex-bot.interface';

@Injectable()
export class GreetingCommand implements Command {
  getPattern(): string {
    return '안녕';
  }

  async execute(bot: Bot, trigger: Trigger): Promise<void> {
    await bot.say(
      `안녕하세요! ${trigger.person.displayName}님. 무엇을 도와드릴까요?`,
    );
  }

  getHelpText(): string {
    return '**안녕** - 인사하기';
  }

  getPriority(): number {
    return 10;
  }
}
