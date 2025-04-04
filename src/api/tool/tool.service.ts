import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tool } from 'src/schema/tool.schema';

@Injectable()
export class ToolService {
  constructor(
    @InjectModel('Tool')
    private readonly toolModel: Model<Tool>,
  ) {}

  async list() {
    return await this.toolModel.find();
  }

  async get_detail(id: string) {
    return await this.toolModel.findById(id);
  }
}
