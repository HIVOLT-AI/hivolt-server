import {
  Body,
  Controller,
  Delete,
  Get,
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

  @Get('list')
  async list() {
    return await this.agentService.list();
  }

  @Get(':id')
  async get_detail(@Param('agent_id') agent_id: string) {
    return await this.agentService.get_detail(agent_id);
  }

  @Post('create')
  async login(@Body() data: CreateAgentDto) {
    return this.agentService.create(data);
  }

  @Delete('delete')
  async delete(@Body() data: DeleteAgentDto) {
    return this.agentService.delete(data);
  }

  @Put('add-tool')
  async add_tool(@Body() data: AddToolDto) {
    return this.agentService.add_tool(data);
  }

  @Put('update-status')
  async update_status(@Body() data: UpdateStatusDto) {
    return this.agentService.update_status(data);
  }
}
