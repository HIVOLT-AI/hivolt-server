import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { MarketplaceAgentService } from './marketplace-agent.service';
import { ApiTags } from '@nestjs/swagger';
import { IsSavedDto, SaveMarketplaceAgentDto } from './marketplace-agent.dto';

@ApiTags('Marketplace Agent')
@Controller('/api/marketplace-agents')
export class MarketplaceAgentController {
  constructor(private readonly marketplaceAgentService: MarketplaceAgentService) {}

  @Get()
  async get_marketplace_agents() {
    return await this.marketplaceAgentService.get_marketplace_agents();
  }

  @Get(':id')
  async get_marketplace_agent(@Param('id') id: string) {
    return await this.marketplaceAgentService.get_marketplace_agent(id);
  }

  @Post(':id/save')
  async save_marketplace_agent(@Param('id') id: string, @Body() data: SaveMarketplaceAgentDto) {
    return await this.marketplaceAgentService.save_marketplace_agent(id, data);
  }

  @Post(':id/is-saved ')
  async is_saved(@Param('id') id: string, @Body() data: IsSavedDto) {
    return await this.marketplaceAgentService.is_saved(id, data);
  }
} 