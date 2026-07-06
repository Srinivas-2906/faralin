import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { UniversitiesModule } from './universities/universities.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { FaralinModule } from './faralin/faralin.module';
import { ContentModule } from './content/content.module';
import { ApplicationsModule } from './applications/applications.module';
import { AdminModule } from './admin/admin.module';
import { ProblemTracksModule } from './problem-tracks/problem-tracks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    PrismaModule,
    AuthModule,
    StudentsModule,
    UniversitiesModule,
    AssessmentsModule,
    FaralinModule,
    ContentModule,
    ApplicationsModule,
    AdminModule,
    ProblemTracksModule,
  ],
})
export class AppModule {}
