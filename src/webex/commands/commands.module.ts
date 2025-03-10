import { Module } from '@nestjs/common';
import { CommandsService } from './commands.service';
import { MessagesModule } from '../../messages/messages.module';

@Module({
  imports: [MessagesModule],
  providers: [CommandsService],
  exports: [CommandsService],
})
export class CommandsModule {}
