import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';

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
    } catch (error: unknown) {
      const err = error as ErrorWithMessage;
      this.logger.error(`메시지 조회 오류: ${err.message}`);
      throw error;
    }
  }

  async create(text: string, userId: string, roomId: string): Promise<Message> {
    try {
      const message = new Message();
      message.TEXT = text;
      message.userId = userId;
      message.roomId = roomId;

      return await this.messagesRepository.save(message);
    } catch (error: unknown) {
      const err = error as ErrorWithMessage;
      this.logger.error(`메시지 저장 오류: ${err.message}`);
      throw error;
    }
  }

  async findByRoomId(roomId: string): Promise<Message[]> {
    try {
      return await this.messagesRepository.find({
        where: { roomId },
        order: { createdAt: 'DESC' },
        take: 10,
      });
    } catch (error: unknown) {
      const err = error as ErrorWithMessage;
      this.logger.error(`룸별 메시지 조회 오류: ${err.message}`);
      throw error;
    }
  }
}
