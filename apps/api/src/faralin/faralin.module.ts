import { Module } from '@nestjs/common';
import { AchievementLedgerService } from './achievement-ledger.service';
import { AwardAccountService } from './award-account.service';
import { CampaignService } from './campaign.service';
import { FaralinEngineService, PortfolioService } from './faralin-engine.service';
import { ProjectionService } from './projection.service';

@Module({
  providers: [
    FaralinEngineService,
    PortfolioService,
    ProjectionService,
    AchievementLedgerService,
    AwardAccountService,
    CampaignService,
  ],
  exports: [
    FaralinEngineService,
    PortfolioService,
    ProjectionService,
    AchievementLedgerService,
    AwardAccountService,
    CampaignService,
  ],
})
export class FaralinModule {}
