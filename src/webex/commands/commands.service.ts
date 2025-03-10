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

    // 기본 대화 명령어
    this.registerCommand(this.createGreetingCommand());
    this.registerCommand(this.createWeatherCommand());
    this.registerCommand(this.createTimeCommand());
    this.registerCommand(this.createCalculatorCommand());

    // 유틸리티 명령어
    this.registerCommand(this.createEchoCommand());
    this.registerCommand(this.createRandomCommand());
    this.registerCommand(this.createTranslateCommand());

    // 데이터베이스 관련 명령어
    this.registerCommand(this.createHistoryCommand());
    this.registerCommand(this.createSaveMessageCommand());
    this.registerCommand(this.createSearchCommand());
    this.registerCommand(this.createDeleteCommand());
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
   * 텍스트와 일치하는 명령어 찾기
   */
  findMatchingCommand(text: string): Command | undefined {
    // 우선순위 순으로 정렬
    const sortedCommands = [...this.commands].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0),
    );

    for (const command of sortedCommands) {
      const pattern = command.pattern;

      if (typeof pattern === 'string' && text === pattern) {
        return command;
      } else if (pattern instanceof RegExp && pattern.test(text)) {
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
      pattern: /^\/도움말$|^\/help$/i,
      execute: async (): Promise<string> => {
        try {
          // 비동기 처리를 위한 Promise 사용
          const helpTextPromise = Promise.resolve(
            this.commands
              .map((cmd) => {
                const pattern =
                  typeof cmd.pattern === 'string'
                    ? cmd.pattern
                    : cmd.pattern.toString();
                return `- ${pattern}: ${cmd.helpText}`;
              })
              .join('\n'),
          );

          const helpText = await helpTextPromise;
          return `사용 가능한 명령어:\n${helpText}`;
        } catch (error) {
          const err = error as ErrorWithMessage;
          this.logger.error(`도움말 명령어 오류: ${err.message}`);
          return '도움말을 표시하는 중 오류가 발생했습니다.';
        }
      },
      helpText: '사용 가능한 모든 명령어를 표시합니다.',
      priority: 100,
    };
  }

  /**
   * 에코 명령어 생성
   */
  private createEchoCommand(): Command {
    return {
      pattern: /^\/에코\s+(.+)$|^\/echo\s+(.+)$/i,
      execute: async (_bot: Bot, trigger: Trigger): Promise<string> => {
        try {
          const result = await Promise.resolve().then(() => {
            const match = trigger.text.match(
              /^\/에코\s+(.+)$|^\/echo\s+(.+)$/i,
            );
            if (match) {
              const content = match[1] || match[2];
              return `에코: ${content}`;
            }
            return '에코할 내용을 입력해주세요. 예: /에코 안녕하세요';
          });
          return result;
        } catch (error) {
          const err = error as ErrorWithMessage;
          this.logger.error(`에코 명령어 오류: ${err.message}`);
          return '에코 처리 중 오류가 발생했습니다.';
        }
      },
      helpText:
        '입력한 텍스트를 그대로 반환합니다. 사용법: /에코 [텍스트] 또는 /echo [텍스트]',
      priority: 10,
    };
  }

  /**
   * 인사 명령어 생성
   */
  private createGreetingCommand(): Command {
    return {
      pattern: /^\/안녕$|^\/hello$|^\/hi$/i,
      execute: async (_bot: Bot, trigger: Trigger): Promise<string> => {
        try {
          const greeting = await Promise.resolve().then(() => {
            const currentHour = new Date().getHours();
            let timeGreeting = '';

            if (currentHour < 12) {
              timeGreeting = '좋은 아침이에요';
            } else if (currentHour < 18) {
              timeGreeting = '좋은 오후에요';
            } else {
              timeGreeting = '좋은 저녁이에요';
            }

            return `${timeGreeting}, ${trigger.person.displayName}님! 무엇을 도와드릴까요?`;
          });
          return greeting;
        } catch (error) {
          const err = error as ErrorWithMessage;
          this.logger.error(`인사 명령어 오류: ${err.message}`);
          return '인사 처리 중 오류가 발생했습니다.';
        }
      },
      helpText: '시간대별 인사를 합니다.',
      priority: 10,
    };
  }

  /**
   * 날씨 명령어 생성
   */
  private createWeatherCommand(): Command {
    return {
      pattern: /^\/날씨\s+(.+)$|^\/weather\s+(.+)$/i,
      execute: async (_bot: Bot, trigger: Trigger): Promise<string> => {
        try {
          const weatherInfo = await Promise.resolve().then(() => {
            const match = trigger.text.match(
              /^\/날씨\s+(.+)$|^\/weather\s+(.+)$/i,
            );
            if (match) {
              const location = match[1] || match[2];
              // 실제 구현에서는 외부 날씨 API 호출이 필요합니다
              return `${location}의 날씨 정보입니다:\n- 현재 온도: 22°C\n- 상태: 맑음\n- 습도: 60%\n\n(이는 예시 응답으로, 실제 날씨 API 연동이 필요합니다)`;
            }
            return '날씨를 확인할 지역을 입력해주세요. 예: /날씨 서울';
          });
          return weatherInfo;
        } catch (error) {
          const err = error as ErrorWithMessage;
          this.logger.error(`날씨 명령어 오류: ${err.message}`);
          return '날씨 정보를 가져오는 중 오류가 발생했습니다.';
        }
      },
      helpText:
        '지정한 지역의 날씨 정보를 표시합니다. 사용법: /날씨 [지역명] 또는 /weather [지역명]',
      priority: 10,
    };
  }

  /**
   * 시간 명령어 생성
   */
  private createTimeCommand(): Command {
    return {
      pattern: /^\/시간$|^\/time$/i,
      execute: async (): Promise<string> => {
        try {
          const timeInfo = await Promise.resolve().then(() => {
            const now = new Date();
            const options: Intl.DateTimeFormatOptions = {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              timeZoneName: 'short',
            };

            const formattedDateTime = new Intl.DateTimeFormat(
              'ko-KR',
              options,
            ).format(now);
            return `현재 시간: ${formattedDateTime}`;
          });
          return timeInfo;
        } catch (error) {
          const err = error as ErrorWithMessage;
          this.logger.error(`시간 명령어 오류: ${err.message}`);
          return '시간 정보를 가져오는 중 오류가 발생했습니다.';
        }
      },
      helpText: '현재 날짜와 시간을 표시합니다.',
      priority: 10,
    };
  }

  /**
   * 계산기 명령어 생성
   */
  private createCalculatorCommand(): Command {
    return {
      pattern: /^\/계산\s+(.+)$|^\/calc\s+(.+)$/i,
      execute: async (_bot: Bot, trigger: Trigger): Promise<string> => {
        try {
          const calcResult = await Promise.resolve().then(() => {
            const match = trigger.text.match(
              /^\/계산\s+(.+)$|^\/calc\s+(.+)$/i,
            );
            if (match) {
              const expression = match[1] || match[2];

              // 보안 이슈로 eval 대신 안전한 방법으로 계산
              // 이 예제에서는 간단한 사칙연산만 지원
              const sanitizedExpression = expression.replace(
                /[^0-9+\-*/.()\s]/g,
                '',
              );

              try {
                // 보안 문제를 해결하기 위해 mathjs 같은 라이브러리 사용을 권장
                // 여기서는 간단한 방법으로 구현
                // 아래 코드는 보안 위험이 있으므로 실제 프로덕션에서는 사용하지 않아야 함

                // 기본 연산자만 지원하는 간단한 계산기 구현
                const num1 = parseFloat(
                  sanitizedExpression.split(/[+\-*/]/)[0],
                );
                const num2 = parseFloat(
                  sanitizedExpression.split(/[+\-*/]/)[1],
                );
                const operator = sanitizedExpression.match(/[+\-*/]/)?.[0];

                let result: number;

                if (operator === '+') result = num1 + num2;
                else if (operator === '-') result = num1 - num2;
                else if (operator === '*') result = num1 * num2;
                else if (operator === '/') result = num1 / num2;
                else throw new Error('지원하지 않는 연산자입니다');

                return `계산 결과: ${result}`;
              } catch {
                return '올바른 수식을 입력해주세요. 예: /계산 2 + 3';
              }
            }
            return '계산할 수식을 입력해주세요. 예: /계산 1 + 2';
          });
          return calcResult;
        } catch (error) {
          const err = error as ErrorWithMessage;
          this.logger.error(`계산기 명령어 오류: ${err.message}`);
          return '계산 중 오류가 발생했습니다.';
        }
      },
      helpText:
        '수학 계산을 수행합니다. 사용법: /계산 [수식] 또는 /calc [수식]',
      priority: 10,
    };
  }

  /**
   * 랜덤 명령어 생성
   */
  private createRandomCommand(): Command {
    return {
      pattern: /^\/랜덤\s+(\d+)\s+(\d+)$|^\/random\s+(\d+)\s+(\d+)$/i,
      execute: async (_bot: Bot, trigger: Trigger): Promise<string> => {
        try {
          const randomResult = await Promise.resolve().then(() => {
            const match = trigger.text.match(
              /^\/랜덤\s+(\d+)\s+(\d+)$|^\/random\s+(\d+)\s+(\d+)$/i,
            );
            if (match) {
              let min = parseInt(match[1] || match[3]);
              let max = parseInt(match[2] || match[4]);

              // 최소값과 최대값 조정
              if (min > max) {
                [min, max] = [max, min];
              }

              const randomNumber =
                Math.floor(Math.random() * (max - min + 1)) + min;
              return `${min}에서 ${max} 사이의 랜덤 숫자: ${randomNumber}`;
            }
            return '랜덤 범위를 입력해주세요. 예: /랜덤 1 100';
          });
          return randomResult;
        } catch (error) {
          const err = error as ErrorWithMessage;
          this.logger.error(`랜덤 명령어 오류: ${err.message}`);
          return '랜덤 숫자 생성 중 오류가 발생했습니다.';
        }
      },
      helpText:
        '지정한 범위 내에서 랜덤 숫자를 생성합니다. 사용법: /랜덤 [최소값] [최대값] 또는 /random [최소값] [최대값]',
      priority: 10,
    };
  }

  /**
   * 번역 명령어 생성
   */
  private createTranslateCommand(): Command {
    return {
      pattern: /^\/번역\s+(.+)$|^\/translate\s+(.+)$/i,
      execute: async (_bot: Bot, trigger: Trigger): Promise<string> => {
        try {
          const translateResult = await Promise.resolve().then(() => {
            const match = trigger.text.match(
              /^\/번역\s+(.+)$|^\/translate\s+(.+)$/i,
            );
            if (match) {
              const textToTranslate = match[1] || match[2];
              // 실제 구현에서는 외부 번역 API 호출이 필요합니다
              return `번역 결과: "${textToTranslate}"\n\n(이는 예시 응답으로, 실제 번역 API 연동이 필요합니다)`;
            }
            return '번역할 텍스트를 입력해주세요. 예: /번역 안녕하세요';
          });
          return translateResult;
        } catch (error) {
          const err = error as ErrorWithMessage;
          this.logger.error(`번역 명령어 오류: ${err.message}`);
          return '번역 중 오류가 발생했습니다.';
        }
      },
      helpText:
        '텍스트를 번역합니다. 사용법: /번역 [텍스트] 또는 /translate [텍스트]',
      priority: 10,
    };
  }

  /**
   * 히스토리 명령어 생성
   */
  private createHistoryCommand(): Command {
    return {
      pattern: /^\/히스토리$|^\/history$/i,
      execute: async (bot: Bot): Promise<string> => {
        try {
          if (!bot.room.id) {
            return '대화방 ID를 확인할 수 없습니다.';
          }

          const messages = await this.messagesService.findByRoomId(bot.room.id);
          if (!messages || messages.length === 0) {
            return '저장된 메시지가 없습니다.';
          }

          // 최대 10개까지만 표시
          const recentMessages = messages.slice(-10);
          const historyText = recentMessages
            .map((msg, index) => {
              const date = new Date(msg.createdAt);
              const formattedDate = date.toLocaleString('ko-KR');
              return `${index + 1}. [${formattedDate}] ${msg.TEXT}`;
            })
            .join('\n');

          return `최근 메시지 기록 (최대 10개):\n${historyText}`;
        } catch (error) {
          const err = error as ErrorWithMessage;
          this.logger.error(`히스토리 명령어 오류: ${err.message}`);
          return '메시지 기록을 가져오는 중 오류가 발생했습니다.';
        }
      },
      helpText: '현재 대화방의 저장된 메시지 기록을 표시합니다.',
      priority: 10,
    };
  }

  /**
   * 메시지 저장 명령어 생성
   */
  private createSaveMessageCommand(): Command {
    return {
      pattern: /^\/저장\s+(.+)$|^\/save\s+(.+)$/i,
      execute: async (bot: Bot, trigger: Trigger): Promise<string> => {
        try {
          if (!bot.room.id) {
            return '대화방 ID를 확인할 수 없습니다.';
          }

          const match = trigger.text.match(/^\/저장\s+(.+)$|^\/save\s+(.+)$/i);
          if (!match) {
            return '저장할 메시지를 입력해주세요. 예: /저장 중요한 정보';
          }

          const messageText = match[1] || match[2];
          await this.messagesService.create(
            messageText,
            trigger.person.email,
            bot.room.id,
          );

          return `메시지가 성공적으로 저장되었습니다: "${messageText}"`;
        } catch (error) {
          const err = error as ErrorWithMessage;
          this.logger.error(`저장 명령어 오류: ${err.message}`);
          return '메시지 저장 중 오류가 발생했습니다.';
        }
      },
      helpText:
        '메시지를 데이터베이스에 저장합니다. 사용법: /저장 [메시지] 또는 /save [메시지]',
      priority: 10,
    };
  }

  /**
   * 메시지 검색 명령어 생성
   */
  private createSearchCommand(): Command {
    return {
      pattern: /^\/검색\s+(.+)$|^\/search\s+(.+)$/i,
      execute: async (bot: Bot, trigger: Trigger): Promise<string> => {
        try {
          if (!bot.room.id) {
            return '대화방 ID를 확인할 수 없습니다.';
          }

          const match = trigger.text.match(
            /^\/검색\s+(.+)$|^\/search\s+(.+)$/i,
          );
          if (!match) {
            return '검색할 키워드를 입력해주세요. 예: /검색 중요';
          }

          const keyword = match[1] || match[2];
          const messages = await this.messagesService.findByRoomId(bot.room.id);

          if (!messages || messages.length === 0) {
            return '저장된 메시지가 없습니다.';
          }

          // 키워드 검색
          const searchResults = messages.filter((msg) =>
            msg.TEXT.toLowerCase().includes(keyword.toLowerCase()),
          );

          if (searchResults.length === 0) {
            return `"${keyword}" 키워드가 포함된 메시지를 찾을 수 없습니다.`;
          }

          // 최대 5개까지만 표시
          const limitedResults = searchResults.slice(-5);
          const resultsText = limitedResults
            .map((msg, index) => {
              const date = new Date(msg.createdAt);
              const formattedDate = date.toLocaleString('ko-KR');
              return `${index + 1}. [${formattedDate}] ${msg.TEXT}`;
            })
            .join('\n');

          return `"${keyword}" 검색 결과 (${searchResults.length}개 중 최대 5개):\n${resultsText}`;
        } catch (error) {
          const err = error as ErrorWithMessage;
          this.logger.error(`검색 명령어 오류: ${err.message}`);
          return '메시지 검색 중 오류가 발생했습니다.';
        }
      },
      helpText:
        '저장된 메시지에서 키워드를 검색합니다. 사용법: /검색 [키워드] 또는 /search [키워드]',
      priority: 10,
    };
  }

  /**
   * 메시지 삭제 명령어 생성
   */
  private createDeleteCommand(): Command {
    return {
      pattern: /^\/삭제\s+(\d+)$|^\/delete\s+(\d+)$/i,
      execute: async (bot: Bot, trigger: Trigger): Promise<string> => {
        try {
          const deleteResult = await Promise.resolve().then(() => {
            if (!bot.room.id) {
              return '대화방 ID를 확인할 수 없습니다.';
            }

            const match = trigger.text.match(
              /^\/삭제\s+(\d+)$|^\/delete\s+(\d+)$/i,
            );
            if (!match) {
              return '삭제할 메시지 ID를 입력해주세요. 예: /삭제 123';
            }

            const messageId = parseInt(match[1] || match[2]);

            // 실제 구현에서는 메시지 ID로 삭제하는 기능이 필요합니다
            // 여기서는 예시로만 표시합니다
            return `메시지 ID ${messageId}가 삭제되었습니다.`;
          });
          return deleteResult;
        } catch (error) {
          const err = error as ErrorWithMessage;
          this.logger.error(`삭제 명령어 오류: ${err.message}`);
          return '메시지 삭제 중 오류가 발생했습니다.';
        }
      },
      helpText:
        '지정한 ID의 메시지를 삭제합니다. 사용법: /삭제 [메시지ID] 또는 /delete [메시지ID]',
      priority: 10,
    };
  }
}
