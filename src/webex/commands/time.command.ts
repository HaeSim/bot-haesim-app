import { Injectable } from '@nestjs/common';
import { Command } from '../interfaces/command.interface';
import { Bot } from '../interfaces/webex-bot.interface';

@Injectable()
export class TimeCommand implements Command {
  getPattern(): string {
    return '시간';
  }

  async execute(bot: Bot): Promise<void> {
    const now = new Date();
    await bot.say(`현재 시간은 ${now.toLocaleString('ko-KR')} 입니다.`);
  }

  getHelpText(): string {
    return '**시간** - 현재 시간 확인';
  }

  getPriority(): number {
    return 10;
  }
}
