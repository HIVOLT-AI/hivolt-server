import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MarketplaceAgent } from 'src/schema/marketplace-agent.schema';
import { GetMarketplaceAgentsDto, SaveMarketplaceAgentDto } from './marketplace-agent.dto';
import { SavedAgent } from 'src/schema/saved-agent.schema';

@Injectable()
export class MarketplaceAgentService {
  constructor(
    @InjectModel('MarketplaceAgent')
    private readonly marketplaceAgentModel: Model<MarketplaceAgent>,
    @InjectModel('SavedAgent')
    private readonly savedAgentModel: Model<SavedAgent>,
  ) {}

  async get_marketplace_agents() {
    const agents = await this.marketplaceAgentModel.find({ is_active: true });
    return agents.map((agent) => {
      return new GetMarketplaceAgentsDto(
        agent._id.toString(),
        agent.name,
        agent.description,
        agent.icon,
        agent.install_count,
      );
    });
  }

  async get_marketplace_agent(id: string) {
    return await this.marketplaceAgentModel.findById(id);
  }

  async save_marketplace_agent(id: string, data: SaveMarketplaceAgentDto) {
    const marketAgent = await this.marketplaceAgentModel.findById(id);
    if (!marketAgent) {
      throw new Error('Marketplace agent not found');
    }

    const savedAgent = await this.savedAgentModel.findOne({
      agent_id: marketAgent._id.toString(),
    });
    if (savedAgent) {
      throw new Error('Agent already saved');
    }

    const newAgent = await this.savedAgentModel.create({
      name: marketAgent.name,
      description: marketAgent.description,
      icon: marketAgent.icon,
      agent_id: marketAgent._id.toString(),
      owner_id: data.owner_id,
      status: 'live',
    });
    return newAgent;
  }
} 