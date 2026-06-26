import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';

@Module({
  controllers: [ContentController, KnowledgeController],
  providers: [ContentService, KnowledgeService],
})
export class ContentModule {}
