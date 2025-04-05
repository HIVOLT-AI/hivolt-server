import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SavedAgentController } from './saved-agent.controller';
import { SavedAgentService } from './saved-agent.service';
import { SavedAgentSchema } from 'src/schema/saved-agent.schema';
import { MarketplaceAgentSchema } from 'src/schema/marketplace-agent.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'SavedAgent', schema: SavedAgentSchema },
      { name: 'MarketplaceAgent', schema: MarketplaceAgentSchema },
    ]),
  ],
  controllers: [SavedAgentController],
  providers: [SavedAgentService],
})
export class SavedAgentModule {} 