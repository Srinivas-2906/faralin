import { Module } from '@nestjs/common';
import { FaralinModule } from '../faralin/faralin.module';
import {
  AdminProblemTracksController,
  PortfolioArtifactsController,
  ProblemTracksController,
} from './problem-tracks.controller';
import { ProblemTracksService } from './problem-tracks.service';
import { AiTutorService } from './ai-tutor.service';
import { RubricScorerService } from './rubric-scorer.service';
import { TrustService } from './trust.service';
import { CopyleaksService } from './copyleaks.service';

@Module({
  imports: [FaralinModule],
  controllers: [ProblemTracksController, PortfolioArtifactsController, AdminProblemTracksController],
  providers: [
    ProblemTracksService,
    AiTutorService,
    RubricScorerService,
    TrustService,
    CopyleaksService,
  ],
  exports: [ProblemTracksService],
})
export class ProblemTracksModule {}
