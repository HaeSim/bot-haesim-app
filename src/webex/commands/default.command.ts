import { Injectable } from '@nestjs/common';
import { Command } from '../interfaces/command.interface';
import { Bot } from '../interfaces/webex-bot.interface';

@Injectable()
export class DefaultCommand implements Command {
  getPattern(): RegExp {
    return /.*/;
  }

  async execute(bot: Bot): Promise<void> {
    await bot.say(
      '죄송합니다. 이해하지 못했습니다. "도움말"을 입력하시면 사용 가능한 명령어를 확인할 수 있습니다.',
    );
  }

  getHelpText(): string {
    return '';
  }

  getPriority(): number {
    return 99999; // 가장 낮은 우선순위
  }
}
