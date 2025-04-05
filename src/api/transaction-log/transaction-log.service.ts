import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionLog } from 'src/schema/transaction-log.schema';
import { CreateTransactionLogDto } from './transaction-log.dto';

@Injectable()
export class TransactionLogService {
  constructor(
    @InjectModel('TransactionLog')
    private readonly transactionLogModel: Model<TransactionLog>,
  ) {}

  async create(data: CreateTransactionLogDto) {
    try {
      const transactionLog = await this.transactionLogModel.create(data);
      return transactionLog;
    } catch (error) {
      throw new Error(`Failed to create transaction log: ${error.message}`);
    }
  }

  async findByAgentId(agentId: string) {
    try {
      if (!agentId) {
        throw new Error('query param agent_id is required');
      }
      const transactionLogs = await this.transactionLogModel.find({
        user_agent_id: agentId,
      });
      return transactionLogs;
    } catch (error) {
      throw new Error(`Failed to find transaction logs: ${error.message}`);
    }
  }
} 