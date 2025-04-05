import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MarketplaceAgent } from 'src/schema/marketplace-agent.schema';
import { SavedAgent } from 'src/schema/saved-agent.schema';

@Injectable()
export class SavedAgentService {
  constructor(
    @InjectModel('SavedAgent')
    private readonly savedAgentModel: Model<SavedAgent>,
    @InjectModel('MarketplaceAgent')
    private readonly marketplaceAgentModel: Model<MarketplaceAgent>,
  ) {}

  async get_saved_agents(ownerId: string) {
    console.log(ownerId);
    return await this.savedAgentModel.find({ owner_id: ownerId });
  }

  async get_saved_agent(ownerId: string, agent_id: string) {
    const savedAgent = await this.savedAgentModel.findOne({agent_id: agent_id, owner_id: ownerId});
    if (!savedAgent) {
      throw new Error('Saved agent not found');
    }

    return await this.marketplaceAgentModel.findById(agent_id);
  }
} 