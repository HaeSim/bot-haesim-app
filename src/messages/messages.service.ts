import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

// 오류 처리를 위한 타입 정의
interface ErrorWithMessage {
  message: string;
}

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async findAll(): Promise<Message[]> {
    try {
      return await this.messagesRepository.find();
    } catch (err) {
      const error = err as ErrorWithMessage;
      this.logger.error(`메시지 조회 실패: ${error.message}`);
      throw new Error(`메시지 조회 중 오류 발생: ${error.message}`);
    }
  }

  async create(text: string, userId: string, roomId: string): Promise<Message> {
    try {
      const message = this.messagesRepository.create({
        TEXT: text,
        userId,
        roomId,
      });
      return await this.messagesRepository.save(message);
    } catch (err) {
      const error = err as ErrorWithMessage;
      this.logger.error(`메시지 저장 실패: ${error.message}`);
      throw new Error(`메시지 저장 중 오류 발생: ${error.message}`);
    }
  }

  async findByRoomId(roomId: string): Promise<Message[]> {
    try {
      return await this.messagesRepository.find({
        where: { roomId },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    } catch (err) {
      const error = err as ErrorWithMessage;
      this.logger.error(`룸 ID로 메시지 조회 실패: ${error.message}`);
      throw new Error(`메시지 조회 중 오류 발생: ${error.message}`);
    }
  }
}
