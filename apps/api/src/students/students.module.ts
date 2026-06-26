import { Module } from '@nestjs/common';
import { FaralinModule } from '../faralin/faralin.module';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [FaralinModule],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
