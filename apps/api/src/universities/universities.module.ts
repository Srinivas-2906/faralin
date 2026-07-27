import { Module } from '@nestjs/common';
import { FaralinModule } from '../faralin/faralin.module';
import { SupportModule } from '../support/support.module';
import { UniversitiesController } from './universities.controller';
import { UniversitiesService } from './universities.service';

@Module({
  imports: [SupportModule, FaralinModule],
  controllers: [UniversitiesController],
  providers: [UniversitiesService],
})
export class UniversitiesModule {}
