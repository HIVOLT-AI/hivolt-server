import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MarketplaceAgent } from 'src/schema/marketplace-agent.schema';
import { GetMarketplaceAgentsDto } from './marketplace-agent.dto';

@Injectable()
export class MarketplaceAgentService {
  constructor(
    @InjectModel('MarketplaceAgent')
    private readonly marketplaceAgentModel: Model<MarketplaceAgent>,
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
} 