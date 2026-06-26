import { Module } from '@nestjs/common';
import { FaralinEngineService, PortfolioService } from './faralin-engine.service';

@Module({
  providers: [FaralinEngineService, PortfolioService],
  exports: [FaralinEngineService, PortfolioService],
})
export class FaralinModule {}
