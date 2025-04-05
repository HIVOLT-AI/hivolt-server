import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketplaceAgentController } from 'src/api/marketplace-agent/marketplace-agent.controller';
import { MarketplaceAgentService } from 'src/api/marketplace-agent/marketplace-agent.service';
import { MarketplaceAgentSchema } from 'src/schema/marketplace-agent.schema';
import { SavedAgentSchema } from 'src/schema/saved-agent.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'MarketplaceAgent', schema: MarketplaceAgentSchema },
      { name: 'SavedAgent', schema: SavedAgentSchema },
    ]),
  ],
  controllers: [MarketplaceAgentController],
  providers: [MarketplaceAgentService],
})
export class MarketplaceAgentModule {} 