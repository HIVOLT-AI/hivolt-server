import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent } from 'src/schema/agent.schema';

@Injectable()
export class WorkerService {
  constructor(
    @InjectModel('Agent')
    private readonly agentModel: Model<Agent>,
  ) {}

  async run_all_task() {
    const agents = await this.agentModel.find();
    for (const agent of agents) {
      this.run(agent);
    }
  }

  async run(agent: Agent) {}

  async run_task(id: string) {
    const agent = await this.agentModel.findById(id);
    if (!agent) {
      throw new Error('Agent not found');
    }
    this.run(agent);
  }
}
