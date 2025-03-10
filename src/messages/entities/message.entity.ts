import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('MESSAGES') // Oracle에서는 대문자 테이블명 권장
export class Message {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column({ type: 'varchar2', length: 500 })
  TEXT: string;

  @Column({ name: 'USER_ID', type: 'varchar2', length: 100 })
  userId: string;

  @Column({ name: 'ROOM_ID', type: 'varchar2', length: 100 })
  roomId: string;

  @CreateDateColumn({ name: 'CREATED_AT', type: 'timestamp' })
  createdAt: Date;
}
