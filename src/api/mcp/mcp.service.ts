import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Mcp } from 'src/schema/mcp.schema';

@Injectable()
export class McpService {
  constructor(private readonly mcpModel: Model<Mcp>) {}

  async list() {
    return await this.mcpModel.find();
  }

  async get_detail(mcp_id: string) {
    return await this.mcpModel.findById(mcp_id);
  }
}
