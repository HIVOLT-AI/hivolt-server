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
import { TransactionLog } from 'src/schema/transaction-log.schema';

@Injectable()
export class AgentService {
  constructor(
    @InjectModel('Agent')
    private readonly agentModel: Model<Agent>,
    @InjectModel('TransactionLog')
    private readonly transactionLogModel: Model<TransactionLog>,
  ) {}

  async list(ownerId: string) {
    return await this.agentModel.find({ owner_id: ownerId });
  }

  async get_detail(id: string) {
    const user_agent = await this.agentModel.findById(id);
    if (!user_agent) {
      throw new Error('Agent not found');
    }

    const transaction_logs = await this.transactionLogModel.find({
      user_agent_id: id,
      owner_id: user_agent.owner_id,
    });

    return {
      user_agent,
      transaction_logs,
    };
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
      prompts: data.prompts,
      icon: data.icon,
      status: AgentStatus.paused,
      tools: [],
      mcps: [],
      fund_amount: 0,
    });
    return agent;
  }

  async delete(id: string) {
    await this.agentModel.findByIdAndDelete(id);
  }

  async add_tool(data: AddToolDto, id: string) {
    const agent = await this.agentModel.findById(id);
    if (!agent) {
      throw new Error('Agent not found');
    }
    agent.tools = data.tools;
    await agent.save();
    return agent;
  }

  async update_status(ownerId: string, data: UpdateStatusDto, id: string) {
    const agent = await this.agentModel.findById(id);
    if (!agent) {
      throw new Error('Agent not found');
    }
    if (agent.owner_id !== ownerId) {
      throw new Error('Agent not found');
    }
    agent.status = data.status;
    await agent.save();
    return agent;
  }
}
