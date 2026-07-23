import { Module } from '@nestjs/common';
import { SupportBotController, SupportMyController } from './support-customer.controller';
import { SupportController } from './support.controller';
import {
  SupportLiveController,
  SupportStreamController,
} from './support-stream.controller';
import { StreamChatService } from './stream-chat.service';
import { SupportBotService } from './support-bot.service';
import { SupportLiveService } from './support-live.service';
import { SupportService } from './support.service';

@Module({
  controllers: [
    SupportController,
    SupportBotController,
    SupportMyController,
    SupportStreamController,
    SupportLiveController,
  ],
  providers: [SupportService, SupportBotService, StreamChatService, SupportLiveService],
  exports: [SupportBotService, StreamChatService, SupportLiveService],
})
export class SupportModule {}
