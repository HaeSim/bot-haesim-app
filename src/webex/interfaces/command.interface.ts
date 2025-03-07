import { Bot, Trigger } from './webex-bot.interface';

export interface Command {
  // 명령어를 식별하는 패턴 (문자열 또는 정규식)
  getPattern(): string | RegExp;

  // 명령어 실행 메서드
  execute(bot: Bot, trigger: Trigger): Promise<void>;

  // 도움말 텍스트
  getHelpText(): string;

  // 우선순위 (낮을수록 먼저 처리)
  getPriority(): number;
}
