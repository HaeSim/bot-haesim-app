import { Injectable } from '@nestjs/common';
import { Command } from '../interfaces/command.interface';
import { Bot } from '../interfaces/webex-bot.interface';

@Injectable()
export class HelpCommand implements Command {
  getPattern(): string {
    return '도움말';
  }

  async execute(bot: Bot): Promise<void> {
    await bot.say(
      '다음 명령어를 사용할 수 있습니다:\n- 안녕: 인사하기\n- 도움말: 도움말 보기\n- 시간: 현재 시간 확인하기',
    );
  }

  getHelpText(): string {
    return '**도움말** - 사용 가능한 명령어 확인';
  }

  getPriority(): number {
    return 10;
  }
}
