import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent } from 'src/schema/agent.schema';
import {
  AddToolDto,
  CreateAgentDto,
  DeleteAgentDto,
  UpdateStatusDto,
} from 'src/api/agent/agent.dto';
import { AgentStatus } from 'src/shared/types/agent';

@Injectable()
export class AgentService {
  constructor(
    @InjectModel('Agent')
    private readonly agentModel: Model<Agent>,
  ) {}

  async list() {
    return await this.agentModel.find();
  }

  async get_detail(id: string) {
    return await this.agentModel.findById(id);
  }

  async create(data: CreateAgentDto) {
    const agent = this.agentModel.create({
      name: data.name,
      address: data.address,
      owner_id: data.owner_id,
      agent_id: data.agent_id,
      nav: 0,
      realized_pnl: 0,
      unrealized_pnl: 0,
      total_pnl_percentage: 0,
      status: AgentStatus.paused,
      tools: [],
      mcps: [],
    });
    return agent;
  }

  async delete(data: DeleteAgentDto) {
    await this.agentModel.findByIdAndDelete(data.agent_id);
  }

  async add_tool(data: AddToolDto) {
    const agent = await this.agentModel.findById(data.agent_id);
    if (!agent) {
      throw new Error('Agent not found');
    }
    agent.tools = data.tools;
    await agent.save();
    return agent;
  }

  async update_status(data: UpdateStatusDto) {
    const agent = await this.agentModel.findById(data.agent_id);
    if (!agent) {
      throw new Error('Agent not found');
    }
    agent.status = data.status;
    await agent.save();
    return agent;
  }
}
