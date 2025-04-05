import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransactionLogService } from './transaction-log.service';
import { CreateTransactionLogDto } from './transaction-log.dto';

@ApiTags('Transaction Log')
@Controller('/api/transaction-logs')
export class TransactionLogController {
  constructor(private readonly transactionLogService: TransactionLogService) {}

  @Post()
  async create(@Body() data: CreateTransactionLogDto) {
    return await this.transactionLogService.create(data);
  }

  @Get('')
  async findByAgentId(@Query('agent_id') agent_id: string) {
    return await this.transactionLogService.findByAgentId(agent_id);
  }

} 