import { Controller, Get, Headers, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SavedAgentService } from './saved-agent.service';


@ApiTags('Saved Agent')     
@Controller('/api/saved-agents')
export class SavedAgentController {
  constructor(private readonly savedAgentService: SavedAgentService) {}

  @Get()
  async get_saved_agents(@Headers('x-owner-id') ownerId: string) {
    return await this.savedAgentService.get_saved_agents(ownerId);
  }

  @Get(':id')
  async get_saved_agent(@Headers('x-owner-id') ownerId: string, @Param('id') agent_id: string) {
    return await this.savedAgentService.get_saved_agent(ownerId, agent_id);
  }
} 