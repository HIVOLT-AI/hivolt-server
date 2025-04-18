import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentController } from 'src/api/agent/agent.controller';
import { AgentService } from 'src/api/agent/agent.service';
import { AgentSchema } from 'src/schema/agent.schema';
import { TransactionLogSchema } from 'src/schema/transaction-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Agent', schema: AgentSchema }]),
    MongooseModule.forFeature([{ name: 'TransactionLog', schema: TransactionLogSchema }]),
  ],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
