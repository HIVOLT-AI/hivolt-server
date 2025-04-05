import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgentService } from 'src/api/agent/agent.service';
import {
  AddToolDto,
  CreateAgentDto,
  DeleteAgentDto,
  UpdateStatusDto,
} from 'src/api/agent/agent.dto';

@ApiTags('Agent')
@Controller('/api/agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get('')
  async list(@Headers('x-owner-id') ownerId: string) {
    return await this.agentService.list(ownerId);
  }

  @Get(':id')
  async get_detail(@Param('id') id: string) {
    return await this.agentService.get_detail(id);
  }

  @Post('')
  async login(@Body() data: CreateAgentDto) {
    return this.agentService.create(data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.agentService.delete(id);
  }

  @Put(':id/add-tool')
  async add_tool(@Body() data: AddToolDto, @Param('id') id: string) {
    return this.agentService.add_tool(data, id);
  }

  @Put(':id/update-status')
  async update_status(@Headers('x-owner-id') ownerId: string, @Body() data: UpdateStatusDto, @Param('id') id: string) {
    return this.agentService.update_status(ownerId, data, id);
  }
}
